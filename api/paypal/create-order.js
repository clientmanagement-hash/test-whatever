// Vercel Function — POST /api/paypal/create-order
// Crea una orden en PayPal Orders API v2 (intent CAPTURE).
// El monto NO se confía al cliente: se recalcula en el servidor con los
// parámetros de la reserva (fechas + huéspedes) usando api/paypal/pricing.js.
// El Client Secret vive en las variables de entorno de Vercel.

import { computeBooking } from './pricing.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

let cachedToken = null;
let cachedAt = 0;

async function getAccessToken(base, clientId, secret) {
    if (cachedToken && Date.now() - cachedAt < 60 * 60 * 1000) return cachedToken;
    const res = await fetch(`${base}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64')
        },
        body: 'grant_type=client_credentials'
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) throw new Error('paypal_token_failed');
    cachedToken = data.access_token;
    cachedAt = Date.now();
    return cachedToken;
}

export default async function handler(request) {
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    const env = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
    const base = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !secret) {
        return json({ error: 'paypal_not_configured' }, 500);
    }

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return json({ error: 'invalid_body' }, 400);
    }

    // El precio se calcula en el servidor (autoridad), no se acepta del cliente
    const booking = computeBooking(body.checkIn, body.checkOut, body.guests);
    if (booking.error) return json({ error: booking.error }, 400);

    try {
        const token = await getAccessToken(base, clientId, secret);
        const res = await fetch(`${base}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: { currency_code: booking.currency, value: booking.total.toFixed(2) }
                }],
                application_context: {
                    brand_name: 'Cabañas la Maite',
                    user_action: 'PAY_NOW',
                    shipping_preference: 'NO_SHIPPING'
                }
            })
        });
        const data = await res.json();
        if (!res.ok || !data.id) {
            return json({ error: 'paypal_create_failed' }, 502);
        }
        return json({ id: data.id, amount: booking.total, nights: booking.nights });
    } catch (e) {
        return json({ error: 'paypal_create_failed' }, 502);
    }
}

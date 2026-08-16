// Vercel Function — POST /api/paypal/create-order (CommonJS)
// Crea una orden en PayPal Orders API v2 (intent CAPTURE).
// El monto NO se confía al cliente: se recalcula en el servidor con
// { checkIn, checkOut, guests } usando ./_pricing.js (fuente de verdad).

const { computeBooking } = require('./_pricing');
const { propId, isBlocked } = require('../ical/_lib');

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

// Lee el body JSON (usa req.body si Vercel ya lo parseó, si no lo lee del stream)
function readBody(req) {
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) {
        return Promise.resolve(req.body);
    }
    return new Promise((resolve) => {
        let data = '';
        req.on('data', (c) => { data += c; });
        req.on('end', () => {
            try { resolve(data ? JSON.parse(data) : {}); }
            catch (e) { resolve({}); }
        });
    });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const env = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
    const base = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !secret) {
        return res.status(500).json({ error: 'paypal_not_configured' });
    }

    const body = await readBody(req);

    // La propiedad debe existir y las fechas no pueden estar ya reservadas
    // (anti doble reserva: reservas propias + calendarios externos importados)
    const propertyId = body.propertyId;
    if (!propId(propertyId)) return res.status(400).json({ error: 'invalid_property' });

    // El precio se calcula en el servidor (autoridad), no se acepta del cliente
    const booking = computeBooking(body.checkIn, body.checkOut, body.guests);
    if (booking.error) return res.status(400).json({ error: booking.error });

    if (await isBlocked(propertyId, body.checkIn, body.checkOut)) {
        return res.status(409).json({ error: 'dates_unavailable' });
    }

    try {
        const token = await getAccessToken(base, clientId, secret);
        const r = await fetch(`${base}/v2/checkout/orders`, {
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
                    brand_name: 'Cabañas La Maite',
                    user_action: 'PAY_NOW',
                    shipping_preference: 'NO_SHIPPING'
                }
            })
        });
        const data = await r.json();
        if (!r.ok || !data.id) {
            return res.status(502).json({ error: 'paypal_create_failed' });
        }
        return res.status(200).json({ id: data.id, amount: booking.total, nights: booking.nights });
    } catch (e) {
        return res.status(502).json({ error: 'paypal_create_failed' });
    }
};

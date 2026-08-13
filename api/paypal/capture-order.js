// Vercel Function — POST /api/paypal/capture-order
// Captura (cobra) una orden ya aprobada por el comprador en PayPal Orders API v2.

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

    let orderID;
    try {
        orderID = String((await request.json()).orderID || '');
    } catch (e) {
        return json({ error: 'invalid_order' }, 400);
    }
    if (!orderID) return json({ error: 'invalid_order' }, 400);

    try {
        const token = await getAccessToken(base, clientId, secret);
        const res = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                // Clave determinista: un reintento de la MISMA orden usa la misma clave
                'PayPal-Request-Id': `capture-${orderID}`
            }
        });
        const data = await res.json();
        const ok = res.ok && data.status === 'COMPLETED';
        return json({ success: ok, status: data.status || null }, ok ? 200 : 422);
    } catch (e) {
        return json({ error: 'paypal_capture_failed' }, 502);
    }
}

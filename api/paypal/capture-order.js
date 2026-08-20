// Vercel Function — POST /api/paypal/capture-order (CommonJS)
// Captura (cobra) una orden ya aprobada por el comprador en PayPal Orders API v2.

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

// Envía el aviso de reserva por email (FormSubmit) — solo informativo, nunca bloquea el pago
async function notifyReservation({ propertyId, checkIn, checkOut, guest, breakfast, amount, currency, orderId }) {
    const email = process.env.NOTIFY_EMAIL || 'cabanaslamaite@gmail.com';
    const propName = propertyId === 'loft2' ? 'Loft 2' : 'Loft 1';
    const lines = [
        'NUEVA RESERVA — Cabañas La Maite',
        '',
        'Loft: ' + propName,
        'Entrada: ' + checkIn,
        'Salida: ' + checkOut,
        'Huéspedes: ' + (guest || '—'),
        'Desayuno incluido: ' + (breakfast ? 'Sí' : 'No'),
        'Monto cobrado: ' + (amount ? amount + ' ' + (currency || 'USD') : '—'),
        'Orden PayPal: ' + orderId
    ];
    await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _subject: 'Nueva reserva · ' + propName + ' · ' + checkIn, message: lines.join('\n'), _template: 'table' })
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
    const orderID = body.orderID ? String(body.orderID) : '';
    if (!orderID) return res.status(400).json({ error: 'invalid_order' });

    try {
        const token = await getAccessToken(base, clientId, secret);
        const r = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                // Clave determinista: un reintento de la MISMA orden usa la misma clave
                'PayPal-Request-Id': `capture-${orderID}`
            }
        });
        const data = await r.json();
        const ok = r.ok && data.status === 'COMPLETED';
        if (ok) {
            // Registra la reserva en el calendario iCal (bloquea las noches en el feed .ics)
            const { recordReservation } = require('../ical/_lib');
            try {
                await recordReservation({
                    propertyId: body.propertyId,
                    checkIn: body.checkIn,
                    checkOut: body.checkOut,
                    guest: body.guest,
                    breakfast: body.breakfast === true,
                    source: 'web'
                });
            } catch (e) {
                // si la persistencia falla, la reserva se registra a mano (no bloquear el cobro)
            }
            // Aviso por email al dueño (monto real tomado de la respuesta de PayPal)
            try {
                const pu = (data.purchase_units && data.purchase_units[0]) || {};
                const cap = (pu.payments && pu.payments.captures && pu.payments.captures[0]) || {};
                await notifyReservation({
                    propertyId: body.propertyId,
                    checkIn: body.checkIn,
                    checkOut: body.checkOut,
                    guest: body.guest,
                    breakfast: body.breakfast === true,
                    amount: cap.amount ? cap.amount.value : null,
                    currency: cap.amount ? cap.amount.currency_code : 'USD',
                    orderId: orderID
                });
            } catch (e) {
                // si el email falla, la reserva ya quedó registrada en el panel
            }
        }
        return res.status(ok ? 200 : 422).json({ success: ok, status: data.status || null });
    } catch (e) {
        return res.status(502).json({ error: 'paypal_capture_failed' });
    }
};

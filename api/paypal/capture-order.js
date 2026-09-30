// Vercel Function — POST /api/paypal/capture-order (CommonJS)
// Captura (cobra) una orden ya aprobada por el comprador en PayPal Orders API v2.
// Tras el cobro: registra la reserva (iCal), avisa al dueño (FormSubmit) y
// envía confirmación al cliente vía Resend (si RESEND_API_KEY está configurada).

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

function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// Attachment inline del logo: Resend descarga la URL pública (path) — robusto en serverless.
function readLogoAttachment() {
    return {
        filename: 'logo.png',
        path: 'https://www.cabanaslamaite.com/img/logo.png',
        content_type: 'image/png',
        content_id: 'logo'
    };
}

// fetch con timeout propio (evita que un proveedor lento corte la función)
async function fetchWithTimeout(url, options, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: ctrl.signal });
    } finally {
        clearTimeout(t);
    }
}

// Aviso al dueño de una nueva reserva.
// Canal principal: Resend (fiable). Respaldo: FormSubmit (ha estado caído, por eso no es el principal).
async function notifyReservation({ propertyId, checkIn, checkOut, guests, children, name, email, phone, breakfast, amount, currency, orderId }) {
    const emailToOwner = process.env.NOTIFY_EMAIL || 'cabanaslamaite@gmail.com';
    const propName = propertyId === 'loft2' ? 'Loft 2' : 'Loft 1';
    const inMs = Date.parse(checkIn);
    const outMs = Date.parse(checkOut);
    const nights = (Number.isFinite(inMs) && Number.isFinite(outMs)) ? Math.round((outMs - inMs) / 86400000) : 0;
    const perNight = (amount && nights) ? (Number(amount) / nights) : null;
    const total = amount ? (amount + ' ' + (currency || 'USD')) : '—';

    const filas = [
        ['Loft', propName],
        ['Entrada', checkIn],
        ['Salida', checkOut],
        ['Noches', String(nights)],
        ['Huéspedes', String(guests) + (children > 0 ? ' + ' + children + ' menor(es) de 2 años (gratis)' : '')],
        ['Nombre', name || '—'],
        ['Email', email || '—'],
        ['Teléfono / WhatsApp', phone || '—'],
        ['Desayuno incluido', breakfast ? 'SÍ ☕' : 'No'],
        ['Precio por noche', perNight ? (perNight.toFixed(2) + ' ' + (currency || 'USD')) : '—'],
        ['Monto cobrado', total],
        ['Orden PayPal', orderId]
    ];

    // 1) Resend (canal principal)
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
        try {
            const rows = filas.map(([k, v]) =>
                '<tr><th align="left" style="padding:6px;border:1px solid #ddd">' + escapeHtml(k)
                + '</th><td style="padding:6px;border:1px solid #ddd">' + escapeHtml(v) + '</td></tr>').join('');
            const r = await fetchWithTimeout('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: process.env.RESEND_FROM || 'Cabañas La Maite <onboarding@resend.dev>',
                    to: [emailToOwner],
                    reply_to: email || undefined,
                    subject: 'Nueva reserva · ' + propName + ' · ' + checkIn + (breakfast ? ' · ☕ Desayuno' : ''),
                    html: '<h2 style="color:#265a38">Nueva reserva confirmada</h2>'
                        + '<p>Se recibió el pago de <b>' + escapeHtml(total) + '</b>.</p>'
                        + '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">' + rows + '</table>'
                })
            }, 12000);
            if (r.ok) return 'resend';
        } catch (e) { /* si falla, se intenta el respaldo */ }
    }

    // 2) Respaldo: FormSubmit
    try {
        const payload = { _subject: 'Nueva reserva · ' + propName + ' · ' + checkIn, _template: 'table', _captcha: 'false' };
        for (const [k, v] of filas) payload[k] = v;
        const r2 = await fetchWithTimeout('https://formsubmit.co/ajax/' + encodeURIComponent(emailToOwner), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://www.cabanaslamaite.com',
                'Referer': 'https://www.cabanaslamaite.com/'
            },
            body: JSON.stringify(payload)
        }, 12000);
        const d = await r2.json().catch(() => ({}));
        if (r2.ok && d && d.success !== 'false') return 'formsubmit';
    } catch (e) { /* sin canales disponibles */ }

    return null;
}

// Confirmación al CLIENTE usando Resend (solo si RESEND_API_KEY está en Vercel)
async function sendGuestConfirmation({ propertyId, to, name, checkIn, checkOut, guests, breakfast, orderId }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return; // sin key válida o email no escribible: no bloquea el cobro
    }
    const propName = propertyId === 'loft2' ? 'Loft 2' : 'Loft 1';
    const inMs = Date.parse(checkIn);
    const outMs = Date.parse(checkOut);
    const nights = (Number.isFinite(inMs) && Number.isFinite(outMs)) ? Math.round((outMs - inMs) / 86400000) : 0;
    const firstName = (name || 'Cliente').split(' ')[0];
    const detailRows = ''
        + '<tr><th align="left">Loft / Room</th><td>' + escapeHtml(propName) + '</td></tr>'
        + '<tr><th align="left">Check-in / Entrada</th><td>' + escapeHtml(checkIn) + '</td></tr>'
        + '<tr><th align="left">Check-out / Salida</th><td>' + escapeHtml(checkOut) + '</td></tr>'
        + '<tr><th align="left">Nights / Noches</th><td>' + escapeHtml(String(nights)) + '</td></tr>'
        + '<tr><th align="left">Guests / Huéspedes</th><td>' + escapeHtml(String(guests)) + '</td></tr>'
        + (breakfast ? '<tr><th align="left">Breakfast / Desayuno</th><td>Sí ☕ / Yes ☕</td></tr>' : '')
        + '<tr><th align="left">Reference / Referencia</th><td>' + escapeHtml(String(orderId)) + '</td></tr>';

    const html =
        '<div style="text-align:center;margin:0 0 14px"><img src="cid:logo" alt="Cabañas La Maite" style="max-width:150px;height:auto"/></div>'
        // ---- ESPAÑOL ----
        + '<p>Hola <strong>' + escapeHtml(firstName) + '</strong> / Dear <strong>' + escapeHtml(firstName) + '</strong>,</p>'
        + '<div style="font-family:Arial,sans-serif">'
        // Español
        + '<h3 style="color:#265a38;margin-bottom:6px;">Hemos recibido su reserva – Cabañas La Maite</h3>'
        + '<p>Estimado/a huésped:</p>'
        + '<p>¡Gracias por elegir Cabañas La Maite!</p>'
        + '<p>Nos complace informarle que hemos recibido su reserva correctamente.</p>'
        + '<p>Nuestro equipo procederá a revisar y verificar el pago. Una vez que el pago haya sido confirmado, le enviaremos los detalles y la confirmación de su reserva, junto con las instrucciones de check-in y toda la información necesaria para su llegada.</p>'
        + '<p>Le agradecemos permitirnos un breve tiempo para completar el proceso de verificación. Nos pondremos en contacto con usted tan pronto como su reserva haya sido confirmada.</p>'
        + '<p>Si tiene alguna pregunta mientras tanto, no dude en contactarnos. Estaremos encantados de ayudarle.</p>'
        + '<p>¡Esperamos darle la bienvenida a Cabañas La Maite y deseamos que disfrute mucho de su estadía!</p>'
        + '<p>Saludos cordiales,<br/>Cabañas La Maite<br/><em>Equipo de Reservaciones</em></p>'
        + '<hr style="margin:22px 0;border:none;border-top:1px solid #ddd"/>'
        + '<table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#ddd;width:100%">' + detailRows + '</table>'
        + '<hr style="margin:22px 0;border:none;border-top:1px solid #ddd"/>'
        // ---- ENGLISH ----
        + '<h3 style="color:#265a38;margin-bottom:6px;">We have received your reservation – Cabañas La Maite</h3>'
        + '<p>Dear Guest,</p>'
        + '<p>Thank you for choosing Cabañas La Maite!</p>'
        + '<p>We are pleased to let you know that we have successfully received your reservation.</p>'
        + '<p>Our team will now review and verify your payment. Once the payment has been confirmed, we will send you your reservation confirmation and booking details, along with the necessary check-in instructions and information for your arrival.</p>'
        + '<p>Please allow us a short time to complete the payment verification process. We will contact you as soon as your reservation has been fully confirmed.</p>'
        + '<p>If you have any questions in the meantime, please feel free to contact us. We will be happy to assist you.</p>'
        + '<p>We look forward to welcoming you to Cabañas La Maite and hope you have a wonderful stay with us!</p>'
        + '<p>Warm regards,<br/>Cabañas La Maite</p>'
        + '</div>';

    const logoAttachment = readLogoAttachment();
    const res = await fetchWithTimeout('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: process.env.RESEND_FROM || 'Cabañas La Maite <onboarding@resend.dev>',
            to: [to],
            reply_to: process.env.NOTIFY_EMAIL || 'cabanaslamaite@gmail.com',
            subject: 'Hemos recibido su reserva – Cabañas La Maite',
            html: html,
            ...(logoAttachment ? { attachments: [logoAttachment] } : {})
        })
    }, 12000);
    if (!res.ok) {
        throw new Error('resend_failed_' + res.status);
    }
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
            const { recordReservation, markNotify } = require('../ical/_lib');
            const notify = {};

            // 1) Registra la reserva en el calendario iCal (con datos del huésped)
            let uid = null;
            try {
                const rec = await recordReservation({
                    propertyId: body.propertyId,
                    checkIn: body.checkIn,
                    checkOut: body.checkOut,
                    guest: body.guest,
                    name: body.name,
                    email: body.email,
                    phone: body.phone,
                    children: Number(body.children) || 0,
                    breakfast: body.breakfast === true,
                    source: 'web'
                });
                uid = rec && rec.uid ? rec.uid : null;
                notify.reservation = 'ok';
            } catch (e) {
                notify.reservation = 'error:' + String((e && e.message) || e);
            }

            // 2) Aviso al dueño (monto real tomado de PayPal)
            try {
                const pu = (data.purchase_units && data.purchase_units[0]) || {};
                const cap = (pu.payments && pu.payments.captures && pu.payments.captures[0]) || {};
                const canal = await notifyReservation({
                    propertyId: body.propertyId,
                    checkIn: body.checkIn,
                    checkOut: body.checkOut,
                    guests: body.guest,
                    children: Number(body.children) || 0,
                    name: body.name,
                    email: body.email,
                    phone: body.phone,
                    breakfast: body.breakfast === true,
                    amount: cap.amount ? cap.amount.value : null,
                    currency: cap.amount ? cap.amount.currency_code : 'USD',
                    orderId: orderID
                });
                notify.owner = canal ? 'ok:' + canal : 'error:sin_canal';
            } catch (e) {
                notify.owner = 'error:' + String((e && e.message) || e);
            }

            // 3) Confirmación al cliente (Resend) — sólo si su email existe
            if (body.email) {
                try {
                    await sendGuestConfirmation({
                        propertyId: body.propertyId,
                        to: body.email,
                        name: body.name,
                        checkIn: body.checkIn,
                        checkOut: body.checkOut,
                        guests: body.guest,
                        breakfast: body.breakfast === true,
                        orderId: orderID
                    });
                    notify.guest = 'ok:' + body.email;
                } catch (e) {
                    notify.guest = 'error:' + String((e && e.message) || e);
                }
            } else {
                notify.guest = 'skipped:sin email';
            }

            // Guarda el resultado de los correos en la reserva (visible en el panel)
            try {
                if (uid) await markNotify(body.propertyId, uid, notify);
            } catch (e) { /* no bloquear el cobro */ }
        }
        return res.status(ok ? 200 : 422).json({ success: ok, status: data.status || null });
    } catch (e) {
        return res.status(502).json({ error: 'paypal_capture_failed' });
    }
};

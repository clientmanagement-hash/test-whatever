// Vercel Function — POST /api/paypal/capture-order (CommonJS)
// Captura (cobra) una orden ya aprobada por el comprador en PayPal Orders API v2.
// Tras el cobro: registra la reserva (iCal), avisa al dueño (Resend) y
// envía confirmación al cliente vía Resend (si RESEND_API_KEY está configurada).

const { PRICING, computeBooking } = require('./_pricing');
const { validatePromo } = require('../ical/_lib');

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
async function notifyReservation({ propertyId, checkIn, checkOut, adults, childAges, promo, name, email, phone, breakfast, amount, currency, discount, descuentoTipo, desgloseEstimado, orderId }) {
    const emailToOwner = process.env.NOTIFY_EMAIL || 'cabanaslamaite@gmail.com';
    const propName = propertyId === 'loft2' ? 'Loft 2' : 'Loft 1';
    const inMs = Date.parse(checkIn);
    const outMs = Date.parse(checkOut);
    const nights = (Number.isFinite(inMs) && Number.isFinite(outMs)) ? Math.round((outMs - inMs) / 86400000) : 0;
    const perNight = (amount && nights) ? (Number(amount) / nights) : null;
    const total = amount ? (amount + ' ' + (currency || 'USD')) : '—';
    // Cuando hay un cupón de descuento, el "precio por noche" efectivo ya lo refleja
    const notaNoche = (discount && descuentoTipo === 'cupon') ? ' (tras el descuento)' : '';

    const filas = [
        ['Loft', propName],
        ['Entrada', checkIn],
        ['Salida', checkOut],
        ['Noches', String(nights)],
        ['Huéspedes', (() => {
            const nAdultos = Number.isFinite(Number(adults)) ? Math.max(1, Math.floor(Number(adults))) : PRICING.baseGuests;
            const edades = (Array.isArray(childAges) ? childAges : []).map((a) => Number(a)).filter((a) => Number.isFinite(a));
            const gratis = edades.filter((a) => a <= PRICING.childFreeMaxAge).length;
            const pagan = edades.filter((a) => a > PRICING.childFreeMaxAge).length;
            let txt = nAdultos + ' adulto(s)';
            if (edades.length > 0) txt += ' · niños: ' + edades.join(', ') + ' años';
            if (pagan > 0) txt += ' (' + pagan + ' paga(n) como persona)';
            if (gratis > 0) txt += ' (' + gratis + ' gratis)';
            // Total de personas que se cobran (adultos + niños de 3+)
            txt += ' → ' + (nAdultos + pagan) + ' ' + ((nAdultos + pagan) === 1 ? 'persona que paga' : 'personas que pagan');
            if (desgloseEstimado) txt += ' (reconstruido del importe cobrado)';
            return txt;
        })()],
        ['Nombre', name || '—'],
        ['Email', email || '—'],
        ['Teléfono / WhatsApp', phone || '—'],
        ['Desayuno incluido', breakfast ? 'SÍ ☕' : 'No'],
        ['Precio por noche', perNight ? (perNight.toFixed(2) + ' ' + (currency || 'USD') + notaNoche) : '—'],
        ...(promo ? [['🎟️ Código aplicado', promo + (discount ? ' · ' + (descuentoTipo === 'tarifa' ? 'precio fijo ' + discount + ' ' + (currency || 'USD') + '/noche' : 'descuento ' + discount + ' ' + (currency || 'USD') + ' al total') : '')]] : []),
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
async function sendGuestConfirmation({ propertyId, to, name, checkIn, checkOut, adults, childAges, breakfast, amount, currency, descuento, descuentoTipo, desgloseEstimado, orderId }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return { ok: false, motivo: 'sin_destino_valido' };
    }
    const propName = propertyId === 'loft2' ? 'Loft 2' : 'Loft 1';
    const inMs = Date.parse(checkIn);
    const outMs = Date.parse(checkOut);
    const nights = (Number.isFinite(inMs) && Number.isFinite(outMs)) ? Math.round((outMs - inMs) / 86400000) : 0;
    const firstName = (name || 'Cliente').split(' ')[0];
    // Desglose de huéspedes tal como quedó la reserva
    const nAdultos = Number.isFinite(Number(adults)) ? Math.max(1, Math.floor(Number(adults))) : PRICING.baseGuests;
    const edades = (Array.isArray(childAges) ? childAges : []).map((a) => Number(a)).filter((a) => Number.isFinite(a));
    const ninosGratis = edades.filter((a) => a <= PRICING.childFreeMaxAge).length;
    const ninosPagan = edades.filter((a) => a > PRICING.childFreeMaxAge).length;
    let guestsTxt = String(nAdultos) + (nAdultos === 1 ? ' adulto' : ' adultos');
    if (edades.length > 0) {
        guestsTxt += ' · ' + edades.length + (edades.length === 1 ? ' niño (' : ' niños (') + edades.join(', ') + ' años)';
        if (ninosGratis > 0) guestsTxt += ' — ' + ninosGratis + (ninosGratis === 1 ? ' gratis' : ' gratis');
        if (ninosPagan > 0) guestsTxt += ' — ' + ninosPagan + (ninosPagan === 1 ? ' como persona' : ' como personas');
    }
    const detailRows = ''
        + '<tr><th align="left">Loft / Room</th><td>' + escapeHtml(propName) + '</td></tr>'
        + '<tr><th align="left">Check-in / Entrada</th><td>' + escapeHtml(checkIn) + '</td></tr>'
        + '<tr><th align="left">Check-out / Salida</th><td>' + escapeHtml(checkOut) + '</td></tr>'
        + '<tr><th align="left">Nights / Noches</th><td>' + escapeHtml(String(nights)) + '</td></tr>'
        + '<tr><th align="left">Guests / Huéspedes</th><td>' + escapeHtml(guestsTxt) + '</td></tr>'
        + (breakfast ? '<tr><th align="left">Breakfast / Desayuno</th><td>Sí ☕ / Yes ☕</td></tr>' : '')
        + (descuento ? '<tr><th align="left">Code applied / Código aplicado</th><td>' + escapeHtml(descuentoTipo === 'tarifa' ? ('Precio fijo / Fixed rate: ' + descuento + ' ' + (currency || 'USD') + ' por noche') : ('Descuento / Discount: −' + descuento + ' ' + (currency || 'USD'))) + '</td></tr>' : '')
        + (amount ? '<tr><th align="left">Total</th><td>' + escapeHtml(String(amount) + ' ' + (currency || 'USD')) + '</td></tr>' : '')
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
    const cuerpo = await res.json().catch(() => ({}));
    if (!res.ok) {
        // Se guarda el motivo real del rechazo (p. ej. dominio no verificado)
        throw new Error('resend_' + res.status + ':' + String(cuerpo.message || cuerpo.name || '').slice(0, 120));
    }
    // Resend devuelve el id del mensaje: permite consultar después si se entregó
    return { ok: true, id: cuerpo.id || null, para: to };
}

// ---------- Recuperación fiable de datos tras el cobro ----------

// Extrae el código promocional de TODOS los sitios donde PayPal puede dejarlo.
// Antes se leía solo de purchase_units[0].custom_id, que en la respuesta de
// captura puede venir vacío: por eso el código nunca se marcaba como usado.
function extraerPromo(data, body) {
    const vistos = [];
    const push = (v) => { if (v) vistos.push(String(v)); };
    const unidades = Array.isArray(data && data.purchase_units) ? data.purchase_units : [];
    for (const pu of unidades) {
        push(pu && pu.custom_id);
        const caps = (pu && pu.payments && pu.payments.captures) || [];
        for (const c of caps) push(c && c.custom_id);
    }
    // payment_source.paypal suele conservar también la referencia
    const ps = data && data.payment_source && data.payment_source.paypal;
    if (ps) {
        push(ps.custom_id);
        const sca = ps.attributes && ps.attributes.vault;
        if (sca) push(sca.custom_id);
    }
    // Respaldo: lo que envió el navegador (ahora sí incluye el código).
    // Aquí el valor es el código "en crudo" (sin el prefijo promo:).
    if (body && body.promo) {
        const limpio = String(body.promo).trim().toUpperCase();
        if (limpio) return limpio;
    }
    for (const v of vistos) {
        const i = v.indexOf('promo:');
        if (i === 0) return v.slice(6).trim().toUpperCase();
        if (i > 0) return v.slice(i + 6).trim().toUpperCase();
    }
    return null;
}

// Si el importe cobrado no cuadra con el desglose recibido, busca la
// combinación de adultos + niños que SÍ explica ese importe.
// Devuelve { adults, childAges } o null.
function ajustarPersonas(body, amountPaid, edadesOriginales, promo) {
    const esFlat = Boolean(promo && promo.flat && promo.rate);
    const promoRate = esFlat ? promo.rate : null;
    const promoDiscount = (promo && promo.rate && !promo.flat) ? promo.rate : null;

    const probar = (adults, ages) => {
        const r = computeBooking(body.checkIn, body.checkOut, adults, body.breakfast === true, {
            childAges: ages, promoRate, promoFlat: esFlat, promoDiscount
        });
        return (!r.error && Math.abs(r.total - amountPaid) <= 0.01) ? r : null;
    };

    // 1) Mantener las edades declaradas y probar con más adultos
    if (edadesOriginales.length > 0) {
        for (let a = 1; a <= PRICING.maxGuests; a++) {
            const r = probar(a, edadesOriginales);
            if (r && r.guests === a + edadesOriginales.filter((x) => x > PRICING.childFreeMaxAge).length) {
                return { adults: a, childAges: edadesOriginales };
            }
        }
    }
    // 2) Probar solo con adultos (sin niños)
    for (let a = 1; a <= PRICING.maxGuests; a++) {
        const r = probar(a, []);
        if (r) return { adults: a, childAges: [] };
    }
    // 3) Probar añadiendo niños de pago (edades típicas) manteniendo 1 adulto..5
    for (let a = 1; a <= PRICING.maxGuests; a++) {
        for (let n = 1; n <= PRICING.maxGuests - a; n++) {
            const ages = Array.from({ length: n }, () => 8);   // 8 años = niño de pago
            const r = probar(a, ages);
            if (r) return { adults: a, childAges: ages };
        }
    }
    return null;
}

module.exports = async function handler(req, res) {    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

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
            const { recordReservation, markNotify, consumePromo } = require('../ical/_lib');
            const notify = {};

            // ---- Datos fiables del cobro (todo leído de la respuesta de PayPal) ----
            const pu0 = (data.purchase_units && data.purchase_units[0]) || {};
            const cap0 = (pu0.payments && pu0.payments.captures && pu0.payments.captures[0]) || {};
            const amountPaid = cap0.amount ? Number(cap0.amount.value) : null;
            const amountCurrency = (cap0.amount && cap0.amount.currency_code) || 'USD';
            const promoDeOrden = extraerPromo(data, body);

            // Datos del código (si lo hubo) para poder reconstruir el importe
            const promoSegunCodigo = promoDeOrden ? (await validatePromo(promoDeOrden)).promo || null : null;

            // ---- Desglose de huéspedes ----
            // Se prefiere lo que envió el navegador; si no llega, se reconstruye
            // a partir del importe realmente cobrado (para que el registro NUNCA
            // muestre menos personas de las que se pagaron).
            const edadesCrudas = Array.isArray(body.childAges)
                ? body.childAges.map((a) => Number(a)).filter((a) => Number.isFinite(a))
                : [];
            let adultosReserva = Number.isFinite(Number(body.guests))
                ? Math.max(1, Math.floor(Number(body.guests)))
                : (Number.isFinite(Number(body.guest)) ? Math.max(1, Math.floor(Number(body.guest))) : null);
            let edadesHuesped = edadesCrudas;
            let desgloseEstimado = false;

            const esperado = computeBooking(body.checkIn, body.checkOut, adultosReserva || PRICING.baseGuests, body.breakfast === true, {
                childAges: edadesHuesped,
                promoRate: promoSegunCodigo && promoSegunCodigo.rate && promoSegunCodigo.flat ? promoSegunCodigo.rate : null,
                promoFlat: Boolean(promoSegunCodigo && promoSegunCodigo.flat),
                promoDiscount: promoSegunCodigo && promoSegunCodigo.rate && !promoSegunCodigo.flat ? promoSegunCodigo.rate : null
            });
            // Si el importe cobrado no coincide con el desglose recibido, se
            // reconstruye el número de personas que explican el importe real.
            if (amountPaid !== null && adultosReserva !== null && !esperado.error && Math.abs(esperado.total - amountPaid) > 0.01) {
                const ajuste = ajustarPersonas(body, amountPaid, edadesHuesped, promoSegunCodigo);
                if (ajuste) {
                    adultosReserva = ajuste.adults;
                    edadesHuesped = ajuste.childAges;
                    desgloseEstimado = true;
                }
            }
            const ninosPagan = edadesHuesped.filter((a) => a > PRICING.childFreeMaxAge).length;
            const ninosGratis = edadesHuesped.filter((a) => a <= PRICING.childFreeMaxAge).length;
            if (desgloseEstimado) notify.desglose = 'estimado_del_importe';

            // 1) Registra la reserva en el calendario iCal (con datos del huésped)
            let uid = null;
            try {
                const rec = await recordReservation({
                    propertyId: body.propertyId,
                    checkIn: body.checkIn,
                    checkOut: body.checkOut,
                    guest: adultosReserva,
                    adults: adultosReserva,
                    name: body.name,
                    email: body.email,
                    phone: body.phone,
                    children: ninosPagan,
                    freeChildren: ninosGratis,
                    childAges: edadesHuesped,
                    promo: promoDeOrden || '',
                    breakfast: body.breakfast === true,
                    amount: amountPaid,
                    currency: amountCurrency,
                    orderId: orderID,
                    estimated: desgloseEstimado,
                    source: 'web'
                });
                uid = rec && rec.uid ? rec.uid : null;
                notify.reservation = 'ok';
            } catch (e) {
                notify.reservation = 'error:' + String((e && e.message) || e);
            }

            // 1b) La reserva se guarda YA, antes de enviar correos: si la función
            // se quedara sin tiempo, la reserva (y el consumo del cupón) no se pierden.
            if (uid) {
                try { await markNotify(body.propertyId, uid, notify); } catch (e) { /* no bloquear */ }
            }

            // 1b) Si la reserva llevaba un código promocional, se marca como usado.
            // promoDeOrden se extrajo antes buscando en la orden, en las capturas,
            // en payment_source y en el cuerpo: así no depende de un único campo.
            try {
                if (promoDeOrden) {
                    const usado = await consumePromo(promoDeOrden, {
                        propertyId: body.propertyId,
                        checkIn: body.checkIn,
                        checkOut: body.checkOut,
                        orderId: orderID
                    });
                    notify.promo = usado ? 'ok:' + usado.code : 'no_encontrado:' + promoDeOrden;
                } else {
                    notify.promo = 'sin_codigo';
                }
            } catch (e) {
                notify.promo = 'error:' + String((e && e.message) || e);
            }

            // 2) Aviso al dueño (monto real tomado de PayPal)
            try {
                const canal = await notifyReservation({
                    propertyId: body.propertyId,
                    checkIn: body.checkIn,
                    checkOut: body.checkOut,
                    adults: adultosReserva,
                    childAges: edadesHuesped,
                    promo: promoDeOrden || null,
                    name: body.name,
                    email: body.email,
                    phone: body.phone,
                    breakfast: body.breakfast === true,
                    amount: amountPaid,
                    currency: amountCurrency,
                    discount: promoSegunCodigo ? promoSegunCodigo.rate : null,
                    descuentoTipo: promoSegunCodigo ? (promoSegunCodigo.flat ? 'tarifa' : 'cupon') : null,
                    desgloseEstimado: desgloseEstimado,
                    orderId: orderID
                });
                notify.owner = canal ? 'ok:' + canal : 'error:sin_canal';
            } catch (e) {
                notify.owner = 'error:' + String((e && e.message) || e);
            }

            // 3) Confirmación al cliente (Resend) — sólo si su email existe.
            // Se guarda el id del mensaje y se persiste el resultado justo después.
            let guestMsgId = null;
            if (body.email) {
                try {
                    const env = await sendGuestConfirmation({
                        propertyId: body.propertyId,
                        to: body.email,
                        name: body.name,
                        checkIn: body.checkIn,
                        checkOut: body.checkOut,
                        adults: adultosReserva,
                        childAges: edadesHuesped,
                        breakfast: body.breakfast === true,
                        amount: amountPaid,
                        currency: amountCurrency,
                        descuento: promoSegunCodigo ? promoSegunCodigo.rate : null,
                        descuentoTipo: promoSegunCodigo ? (promoSegunCodigo.flat ? 'tarifa' : 'cupon') : null,
                        desgloseEstimado: desgloseEstimado,
                        orderId: orderID
                    });
                    if (env && env.ok) {
                        guestMsgId = env.id;
                        notify.guest = 'aceptado:' + body.email;
                        notify.guestId = env.id || null;
                    } else {
                        notify.guest = 'omitido:' + ((env && env.motivo) || 'desconocido');
                    }
                } catch (e) {
                    notify.guest = 'error:' + String((e && e.message) || e);
                }
            } else {
                notify.guest = 'sin_email';
            }

            // Guarda el resultado final de los correos (incluido el id del mensaje)
            try {
                if (uid) await markNotify(body.propertyId, uid, notify);
            } catch (e) { /* no bloquear el cobro */ }
            // Se devuelve el resultado para que el navegador pueda avisar al dueño
            // si el correo del huésped no llegó a enviarse.
            if (uid) {
                return res.status(200).json({ success: true, status: data.status || null, uid, correoHuesped: notify.guest, correoId: guestMsgId });
            }
        }
        return res.status(ok ? 200 : 422).json({ success: ok, status: data.status || null });
    } catch (e) {
        return res.status(502).json({ error: 'paypal_capture_failed' });
    }
};

// Expuestas para pruebas (no las usa el handler)
module.exports.extraerPromo = extraerPromo;
module.exports.ajustarPersonas = ajustarPersonas;
module.exports.sendGuestConfirmation = sendGuestConfirmation;

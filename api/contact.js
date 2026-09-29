// Vercel Function — POST /api/contact (CommonJS)
// Recibe la consulta del formulario, LA GUARDA SIEMPRE (visible en el panel admin)
// y la envía por correo: primero con Resend (fiable) y, si falla, con FormSubmit.
// Se hace desde el servidor porque FormSubmit exige las cabeceras Origin/Referer,
// que el navegador no permite establecer desde JavaScript.

const { addInquiry } = require('./ical/_lib');

const CAMPOS = ['nombre', 'email', 'telefono', 'fechas', 'huespedes', 'loft', 'mensaje'];

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

const clean = (v) => String(v == null ? '' : v).slice(0, 2000).trim();

function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function fetchWithTimeout(url, options, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

// Envía la consulta por Resend (mismo servicio que las confirmaciones de reserva)
async function sendByResend(to, f) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { ok: false, reason: 'no_key' };
    const rows = CAMPOS
        .filter((k) => clean(f[k]))
        .map((k) => '<tr><th align="left" style="padding:6px;border:1px solid #ddd">' + escapeHtml(k) + '</th>'
            + '<td style="padding:6px;border:1px solid #ddd">' + escapeHtml(clean(f[k])) + '</td></tr>')
        .join('');
    const html = '<h2 style="color:#265a38">Nueva consulta · Cabañas La Maite</h2>'
        + '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">' + rows + '</table>'
        + '<p style="color:#666;font-size:12px">Recibida el ' + new Date().toISOString() + '</p>';
    try {
        const r = await fetchWithTimeout('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: process.env.RESEND_FROM || 'Cabañas La Maite <onboarding@resend.dev>',
                to: [to],
                reply_to: clean(f.email) || undefined,
                subject: 'Nueva consulta · ' + (clean(f.nombre) || 'Cabañas La Maite'),
                html
            })
        }, 12000);
        return { ok: r.ok };
    } catch (e) {
        return { ok: false, reason: 'error' };
    }
}

// Respaldo: FormSubmit (requiere cabeceras Origin/Referer)
async function sendByFormSubmit(to, f) {
    const payload = { _subject: 'Nueva consulta · Cabañas La Maite', _template: 'table', _captcha: 'false' };
    const etiquetas = {
        nombre: 'Nombre', email: 'Email', telefono: 'Teléfono / WhatsApp',
        fechas: 'Fechas', huespedes: 'Huéspedes', loft: 'Loft', mensaje: 'Mensaje'
    };
    for (const k of CAMPOS) {
        if (clean(f[k])) payload[etiquetas[k] || k] = clean(f[k]);
    }
    try {
        const r = await fetchWithTimeout('https://formsubmit.co/ajax/' + encodeURIComponent(to), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'https://www.cabanaslamaite.com',
                'Referer': 'https://www.cabanaslamaite.com/'
            },
            body: JSON.stringify(payload)
        }, 12000);
        const data = await r.json().catch(() => ({}));
        return { ok: r.ok && data && data.success !== 'false' };
    } catch (e) {
        return { ok: false, reason: 'error' };
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const body = await readBody(req);
    const email = clean(body.email);

    if (!clean(body.nombre) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !clean(body.mensaje)) {
        return res.status(400).json({ error: 'invalid_fields' });
    }

    const to = process.env.NOTIFY_EMAIL || 'cabanaslamaite@gmail.com';

    // 1) Enviar por correo: Resend primero, FormSubmit como respaldo
    let sentBy = null;
    const porResend = await sendByResend(to, body);
    if (porResend.ok) {
        sentBy = 'resend';
    } else {
        const porFormSubmit = await sendByFormSubmit(to, body);
        if (porFormSubmit.ok) sentBy = 'formsubmit';
    }

    // 2) Guardar SIEMPRE la consulta (aunque el correo falle, no se pierde)
    let saved = false;
    try {
        await addInquiry({ ...body, sentBy });
        saved = true;
    } catch (e) { /* si falla el guardado, al menos se intentó el correo */ }

    // Éxito para el usuario si se pudo enviar o al menos guardar
    const ok = sentBy !== null || saved;
    return res.status(ok ? 200 : 502).json({ ok: Boolean(ok), sentBy, saved });
};

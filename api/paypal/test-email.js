// Vercel Function — POST /api/paypal/test-email (diagnóstico, requiere PIN admin)
// Envía un email de PRUEBA a cualquier dirección vía Resend y devuelve la
// respuesta real de la API (código + cuerpo) para diagnosticar fallos.
// Body: { to: "alguien@correo.com" }  Header: X-Admin-Pin
const { adminPinOk } = require('../ical/_lib');

function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
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

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    if (!adminPinOk(req)) return res.status(401).json({ error: 'unauthorized' });

    const apiKey = process.env.RESEND_API_KEY;
    const body = await readBody(req);
    const to = body.to;
    const from = process.env.RESEND_FROM || 'Cabañas La Maite <onboarding@resend.dev>';

    if (!apiKey) return res.json({ ok: false, reason: 'RESEND_API_KEY not set in env' });
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return res.json({ ok: false, reason: 'missing or invalid "to"' });
    }

    try {
        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: from,
                to: [to],
                subject: 'Prueba desde Cabañas La Maite',
                html: '<p>Este es un correo de <strong>prueba</strong>. Si lo ves, Resend funciona.</p>'
            })
        });
        const text = await r.text();
        res.json({ ok: r.ok, status: r.status, from: from, body: (text || '').slice(0, 500) });
    } catch (e) {
        res.json({ ok: false, error: String((e && e.message) || e) });
    }
};

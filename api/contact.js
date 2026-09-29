// Vercel Function — POST /api/contact (CommonJS)
// Recibe la consulta del formulario y la reenvía por FormSubmit.
// Se hace desde el servidor porque FormSubmit exige las cabeceras Origin/Referer,
// que el navegador no permite establecer desde JavaScript.

const ALLOWED = ['nombre', 'email', 'telefono', 'fechas', 'mensaje', 'huespedes', 'loft'];

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

const clean = (v) => String(v == null ? '' : v).slice(0, 1000).trim();

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const body = await readBody(req);
    const email = clean(body.email);

    // Validación mínima: nombre, email válido y mensaje
    if (!clean(body.nombre) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !clean(body.mensaje)) {
        return res.status(400).json({ error: 'invalid_fields' });
    }

    const to = process.env.NOTIFY_EMAIL || 'cabanaslamaite@gmail.com';

    // Arma la tabla con los campos recibidos (solo los permitidos)
    const payload = {
        _subject: 'Nueva consulta · Cabañas La Maite',
        _template: 'table',
        _captcha: 'false'
    };
    const etiquetas = {
        nombre: 'Nombre',
        email: 'Email',
        telefono: 'Teléfono / WhatsApp',
        fechas: 'Fechas',
        huespedes: 'Huéspedes',
        loft: 'Loft',
        mensaje: 'Mensaje'
    };
    for (const k of ALLOWED) {
        if (body[k] != null && clean(body[k])) payload[etiquetas[k] || k] = clean(body[k]);
    }

    try {
        const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                // FormSubmit exige contexto de página
                'Origin': 'https://www.cabanaslamaite.com',
                'Referer': 'https://www.cabanaslamaite.com/'
            },
            body: JSON.stringify(payload)
        });
        const data = await r.json().catch(() => ({}));
        const ok = r.ok && data && data.success !== 'false';
        return res.status(ok ? 200 : 502).json({ ok: Boolean(ok) });
    } catch (e) {
        return res.status(502).json({ error: 'send_failed' });
    }
};

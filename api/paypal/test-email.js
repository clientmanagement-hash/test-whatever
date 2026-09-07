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

// Attachment inline del logo: Resend descarga la URL pública (path) — robusto en serverless.
function readLogoAttachment() {
    return {
        filename: 'logo.png',
        path: 'https://www.cabanaslamaite.com/img/logo.png',
        content_type: 'image/png',
        content_id: 'logo'
    };
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
        // HTML idéntico al del correo al huésped (ver sendGuestConfirmation), con datos de ejemplo
        const sampleName = (body.name || 'Nicole');
        const firstName = sampleName.split(' ')[0];
        const detailRows = ''
            + '<tr><th align="left">Loft / Room</th><td>Loft 1</td></tr>'
            + '<tr><th align="left">Check-in / Entrada</th><td>2027-11-20</td></tr>'
            + '<tr><th align="left">Check-out / Salida</th><td>2027-11-22</td></tr>'
            + '<tr><th align="left">Nights / Noches</th><td>2</td></tr>'
            + '<tr><th align="left">Guests / Huéspedes</th><td>2</td></tr>'
            + '<tr><th align="left">Breakfast / Desayuno</th><td>No</td></tr>'
            + '<tr><th align="left">Reference / Referencia</th><td>' + escapeHtml(String(body.orderId || 'SAMPLE-123')) + '</td></tr>';
        const html =
            '<div style="text-align:center;margin:0 0 14px"><img src="cid:logo" alt="Cabañas La Maite" style="max-width:150px;height:auto"/></div>'
            + '<p>Hola <strong>' + escapeHtml(firstName) + '</strong> / Dear <strong>' + escapeHtml(firstName) + '</strong>,</p>'
            + '<div style="font-family:Arial,sans-serif">'
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
        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: from,
                to: [to],
                subject: 'Hemos recibido su reserva – Cabañas La Maite',
                html: html,
                ...(() => { const a = readLogoAttachment(); return a ? { attachments: [a] } : {}; })()
            })
        });
        const text = await r.text();
        res.json({ ok: r.ok, status: r.status, from: from, body: (text || '').slice(0, 500) });
    } catch (e) {
        res.json({ ok: false, error: String((e && e.message) || e) });
    }
};

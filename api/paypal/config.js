// Vercel Function — GET /api/paypal/config (CommonJS)
// Expone solo datos PÚBLICOS: client id (no secreto), entorno, moneda y precios vigentes.
// El Client Secret nunca sale del servidor.

const { PRICING } = require('./_pricing');

module.exports = async function handler(req, res) {
    res.status(200).json({
        clientId: process.env.PAYPAL_CLIENT_ID || null,
        env: process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox',
        currency: process.env.PAYPAL_CURRENCY || 'USD',
        resendConfigured: Boolean(process.env.RESEND_API_KEY),
        // (no devolver aquí el valor/from: podría filtrar la clave si está mal configurada)
        pricing: PRICING
    });
};

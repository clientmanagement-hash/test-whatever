// Vercel Function — GET /api/paypal/config
// Expone solo datos PÚBLICOS (client id no es secreto) para cargar el SDK de PayPal
// y los precios vigentes (fuente de verdad del cobro y de lo mostrado).
// El Client Secret nunca sale del servidor.

import { PRICING } from './pricing.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

export default async function handler(request) {
    return json({
        clientId: process.env.PAYPAL_CLIENT_ID || null,
        env: process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox',
        currency: process.env.PAYPAL_CURRENCY || 'USD',
        pricing: PRICING
    });
}

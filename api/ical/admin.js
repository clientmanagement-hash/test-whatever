// GET /api/ical/admin — datos del panel de administración (requiere PIN)
// Header: X-Admin-Pin (o ?pin=). PIN = env ADMIN_PIN o el valor por defecto.
//
// También sirve la disponibilidad pública para el widget con ?public=1
// (rangos bloqueados + noches huérfanas), para no usar dos funciones serverless.
const { PROPERTIES, storageMode, loadReservations, loadExternal, availability, orphanNightsFromRanges, loadInquiries, adminPinOk, hostUrl } = require('./_lib');

module.exports = async function handler(req, res) {
    // Modo público: solo disponibilidad (lo consume el widget de reserva)
    const esPublico = req.query && (req.query.public === '1' || req.query.public === 'true');
    if (esPublico) {
        const out = { updatedAt: new Date().toISOString(), properties: {} };
        for (const p of PROPERTIES) {
            const blocked = await availability(p.id);
            out.properties[p.id] = {
                name: p.name,
                blocked,
                orphanNights: orphanNightsFromRanges(blocked)
            };
        }
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json(out);
    }

    if (!adminPinOk(req)) return res.status(401).json({ error: 'unauthorized' });

    // Diagnóstico de almacenamiento (sin exponer valores secretos)
    let kvDiag = { url: false, token: false, package: 'no-intentado' };
    try {
        const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
        kvDiag = { url: Boolean(url), token: Boolean(token), package: 'no' };
        require('@vercel/kv');
        kvDiag.package = 'ok';
    } catch (e) {
        kvDiag.package = 'error: ' + String((e && e.message) || e).slice(0, 80);
    }

    const properties = [];
    for (const p of PROPERTIES) {
        const blocked = await availability(p.id);
        properties.push({
            id: p.id,
            name: p.name,
            exportUrl: `${hostUrl(req)}/api/ical/property/${p.id}`,
            reservations: await loadReservations(p.id),
            external: await loadExternal(p.id),
            blocked,
            // Noches huérfanas: 1 noche libre entre dos periodos ocupados (reservables 1 noche)
            orphanNights: orphanNightsFromRanges(blocked)
        });
    }

    res.setHeader('Cache-Control', 'no-store');
    // Consultas del formulario de contacto (las más recientes primero)
    let inquiries = [];
    try {
        inquiries = await loadInquiries();
    } catch (e) { /* si falla, el panel sigue funcionando */ }

    res.status(200).json({
        storage: storageMode(),
        adminPinSet: Boolean(process.env.ADMIN_PIN),
        cronConfigured: Boolean(process.env.CRON_SECRET),
        kv: kvDiag,
        inquiries,
        properties
    });
};

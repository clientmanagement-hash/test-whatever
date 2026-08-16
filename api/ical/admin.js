// GET /api/ical/admin — datos del panel de administración (requiere PIN)
// Header: X-Admin-Pin (o ?pin=). PIN = env ADMIN_PIN o el valor por defecto.
const { PROPERTIES, storageMode, loadReservations, loadExternal, availability, adminPinOk, hostUrl } = require('./_lib');

module.exports = async function handler(req, res) {
    if (!adminPinOk(req)) return res.status(401).json({ error: 'unauthorized' });

    const properties = [];
    for (const p of PROPERTIES) {
        properties.push({
            id: p.id,
            name: p.name,
            exportUrl: `${hostUrl(req)}/api/ical/property/${p.id}`,
            reservations: await loadReservations(p.id),
            external: await loadExternal(p.id),
            blocked: await availability(p.id)
        });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
        storage: storageMode(),
        adminPinSet: Boolean(process.env.ADMIN_PIN),
        cronConfigured: Boolean(process.env.CRON_SECRET),
        properties
    });
};

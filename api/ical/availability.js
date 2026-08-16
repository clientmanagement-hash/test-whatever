// GET /api/ical/availability → rangos bloqueados por propiedad (para el widget)
const { PROPERTIES, availability } = require('./_lib');

module.exports = async function handler(req, res) {
    const out = { updatedAt: new Date().toISOString(), properties: {} };
    for (const p of PROPERTIES) {
        out.properties[p.id] = { name: p.name, blocked: await availability(p.id) };
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(out);
};

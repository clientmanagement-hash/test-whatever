// GET /api/ical/availability → rangos bloqueados + noches huérfanas por propiedad (para el widget)
const { PROPERTIES, availability, orphanNightsFromRanges } = require('./_lib');

module.exports = async function handler(req, res) {
    const out = { updatedAt: new Date().toISOString(), properties: {} };
    for (const p of PROPERTIES) {
        const blocked = await availability(p.id);
        out.properties[p.id] = {
            name: p.name,
            blocked,
            // Noches huérfanas: 1 noche libre entre dos periodos ocupados (se pueden reservar 1 noche)
            orphanNights: orphanNightsFromRanges(blocked)
        };
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(out);
};

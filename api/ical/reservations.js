// POST /api/ical/reservations  — crea una reserva (con validación anti doble reserva)
// DELETE /api/ical/reservations — borra una reserva por uid { propertyId, uid }
const { propId, isBlocked, loadReservations, saveReservations, recordReservation, readBody, dayMs } = require('./_lib');

module.exports = async function handler(req, res) {
    const body = await readBody(req);

    if (req.method === 'POST') {
        const result = await recordReservation({
            propertyId: body.propertyId,
            checkIn: body.checkIn,
            checkOut: body.checkOut,
            guest: body.guest,
            source: body.source === 'web' ? 'web' : 'manual'
        });
        if (result.error) return res.status(400).json({ error: result.error });
        return res.status(201).json({ ok: true, uid: result.uid });
    }

    if (req.method === 'DELETE') {
        const { propertyId, uid } = body;
        if (!propId(propertyId) || !uid) return res.status(400).json({ error: 'invalid' });
        const list = await loadReservations(propertyId);
        const next = list.filter((r) => r.uid !== uid);
        if (next.length === list.length) return res.status(404).json({ error: 'not_found' });
        await saveReservations(propertyId, next);
        return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
};

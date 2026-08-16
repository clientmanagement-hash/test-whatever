// GET /api/ical/property/:propertyId → feed .ics público de la propiedad
// (lo importan Airbnb, Booking.com y Expedia para bloquear las noches reservadas en la web)
const { propId, loadReservations } = require('../_lib');
const { buildCalendar } = require('../_ics');

module.exports = async function handler(req, res) {
    const pid = decodeURIComponent(String(req.query.propertyId || ''));
    const prop = propId(pid);
    if (!prop) return res.status(404).json({ error: 'property_not_found' });

    const reservations = await loadReservations(pid);
    const ics = buildCalendar({ property: prop, reservations });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${pid}.ics"`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(ics);
};

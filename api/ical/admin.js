// GET /api/ical/admin — datos del panel de administración (requiere PIN)
// Header: X-Admin-Pin (o ?pin=). PIN = env ADMIN_PIN o el valor por defecto.
//
// También sirve la disponibilidad pública para el widget con ?public=1
// (rangos bloqueados + noches huérfanas), para no usar dos funciones serverless.
const { PROPERTIES, storageMode, loadReservations, loadExternal, availability, orphanNightsFromRanges, loadInquiries, adminPinOk, hostUrl, loadPromos, addPromo, deletePromo, togglePromo, validatePromo, normCode, readBody, updateReservation, consumePromo } = require('./_lib');
const { PRICING } = require('../paypal/_pricing');

// Añade a cada reserva el desglose de huéspedes y los totales del panel.
// Los registros antiguos (antes de guardar adults/childAges) se muestran
// con la información disponible, sin inventar datos.
function conDesglose(r) {
    const adultos = Number.isFinite(Number(r.adults))
        ? Math.max(1, Math.floor(Number(r.adults)))
        : (Number.isFinite(Number(r.guest)) ? Math.max(1, Math.floor(Number(r.guest))) : null);
    const edades = Array.isArray(r.childAges) ? r.childAges.map(Number).filter((a) => Number.isFinite(a)) : [];
    const gratis = Number.isFinite(Number(r.freeChildren)) ? Math.floor(Number(r.freeChildren)) : edades.filter((a) => a <= PRICING.childFreeMaxAge).length;
    const pagan = Number.isFinite(Number(r.children)) ? Math.floor(Number(r.children)) : edades.filter((a) => a > PRICING.childFreeMaxAge).length;
    // Personas que ocupan cupo y se cobran: adultos + niños de 3+ años
    const personasQuePagan = adultos !== null ? (adultos + pagan) : null;
    return Object.assign({}, r, {
        breakdown: {
            adults: adultos,
            freeChildren: gratis,
            payingChildren: pagan,
            childAges: edades,
            totalPeople: adultos !== null ? (adultos + gratis + pagan) : null,
            payingPeople: personasQuePagan,
            hasDetail: edades.length > 0 || Number.isFinite(Number(r.adults))
        },
        amount: Number.isFinite(Number(r.amount)) ? Number(r.amount) : null,
        currency: r.currency || null,
        orderId: r.orderId || null,
        // Aviso para el panel: reserva sin datos completos (registros antiguos
        // anteriores a que se guardaran las edades y el importe).
        incompleta: !(Number.isFinite(Number(r.amount)) && (Number.isFinite(Number(r.adults)) || edades.length > 0)),
        estimated: Boolean(r.estimated)
    });
}

module.exports = async function handler(req, res) {
    // Modo público: validar un código promocional desde el widget (sin PIN).
    // No expone nada más que si el código es válido y su tarifa por noche.
    if (req.query && req.query.promo) {
        const v = await validatePromo(String(req.query.promo));
        res.setHeader('Cache-Control', 'no-store');
        if (!v.ok) return res.status(200).json({ valid: false, error: v.error });
        return res.status(200).json({
            valid: true,
            code: v.promo.code,
            kind: v.promo.kind === 'discount' ? 'discount' : 'rate',
            rate: v.promo.rate,
            flat: v.promo.flat !== false,
            maxGuests: v.promo.maxGuests || null,
            note: v.promo.note || ''
        });
    }

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

    // Acciones de gestión de códigos promocionales (crear / borrar / activar)
    const metodo = String(req.method || 'GET').toUpperCase();
    if (metodo === 'POST' || metodo === 'DELETE') {
        let body = {};
        try { body = await readBody(req); } catch (e) { body = {}; }
        const accion = String(req.query.action || body.action || (metodo === 'DELETE' ? 'delete' : 'create'));

        if (accion === 'create') {
            const r = await addPromo({
                code: body.code,
                kind: body.kind,
                rate: body.rate,
                flat: body.flat,
                maxGuests: body.maxGuests,
                note: body.note,
                guestName: body.guestName,
                guestEmail: body.guestEmail,
                singleUse: body.singleUse,
                expiresAt: body.expiresAt
            });
            if (r.error) return res.status(400).json({ error: r.error });
            return res.status(200).json({ ok: true, promo: r.promo });
        }
        if (accion === 'delete') {
            const r = await deletePromo(body.code || req.query.code);
            if (r.error) return res.status(404).json({ error: r.error });
            return res.status(200).json({ ok: true });
        }
        if (accion === 'toggle') {
            const r = await togglePromo(body.code || req.query.code, body.active);
            if (r.error) return res.status(404).json({ error: r.error });
            return res.status(200).json({ ok: true, promo: r.promo });
        }
        if (accion === 'update-reservation') {
            const r = await updateReservation(body.propertyId, body.uid, {
                adults: body.adults,
                childAges: body.childAges,
                promo: body.promo,
                amount: body.amount,
                currency: body.currency,
                orderId: body.orderId,
                breakfast: body.breakfast,
                name: body.name,
                phone: body.phone,
                email: body.email
            });
            if (r.error) return res.status(404).json({ error: r.error });
            return res.status(200).json({ ok: true, reservation: r.reservation });
        }
        if (accion === 'consume-promo') {
            const r = await consumePromo(String(body.code || req.query.code), body.usedIn || { manual: true });
            if (!r) return res.status(404).json({ error: 'not_found' });
            return res.status(200).json({ ok: true, promo: r });
        }
        return res.status(400).json({ error: 'unknown_action' });
    }

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
            reservations: (await loadReservations(p.id)).map(conDesglose),
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
        promos: await loadPromos().catch(() => []),
        properties
    });
};

// GET /api/ical/admin — datos del panel de administración (requiere PIN)
// Header: X-Admin-Pin (o ?pin=). PIN = env ADMIN_PIN o el valor por defecto.
//
// También sirve la disponibilidad pública para el widget con ?public=1
// (rangos bloqueados + noches huérfanas), para no usar dos funciones serverless.
const { PROPERTIES, storageMode, loadReservations, loadExternal, availability, orphanNightsFromRanges, loadInquiries, adminPinOk, hostUrl, loadPromos, addPromo, deletePromo, togglePromo, validatePromo, normCode, readBody } = require('./_lib');

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
        promos: await loadPromos().catch(() => []),
        properties
    });
};

// Vercel Function — GET /api/cron/daily (CommonJS)
// Tarea diaria automática (04:00 hora del servidor):
//   1) Refresca los calendarios externos (Booking, Airbnb, Expedia)
//   2) Revisa la salud del sistema (pagos, correos, almacenamiento, calendarios)
//      y avisa por correo al dueño si algo está fallando.
// Protegida con CRON_SECRET (Vercel envía el header Authorization automáticamente).

const { PROPERTIES, loadExternal, saveExternal, adminPinOk } = require('../ical/_lib');
const { parseIcs } = require('../ical/_ics');

function fetchWithTimeout(url, options, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

function filterUpcoming(events) {
    const cutoff = Date.now() - 86400000;
    return (events || []).filter((e) => {
        const out = Date.parse(e.checkOut);
        return !Number.isFinite(out) || out >= cutoff;
    });
}

async function refreshEntry(entry) {
    entry.lastSync = new Date().toISOString();
    entry.status = 'pending';
    try {
        const r = await fetchWithTimeout(entry.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Cabañas La Maite · sincronización iCal)' }
        }, 15000);
        if (!r.ok) throw new Error('http_' + r.status);
        const text = await r.text();
        entry.events = filterUpcoming(parseIcs(text));
        entry.status = 'ok';
        entry.lastCount = entry.events.length;
        delete entry.lastError;
    } catch (e) {
        entry.status = 'error';
        entry.lastError = String((e && e.message) || e).slice(0, 120);
    }
}

module.exports = async function handler(req, res) {
    const auth = String(req.headers.authorization || '');
    const cronOk = process.env.CRON_SECRET && auth === 'Bearer ' + process.env.CRON_SECRET;
    if (!cronOk && !adminPinOk(req)) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    // 1) Refrescar calendarios externos
    const refreshed = [];
    for (const p of PROPERTIES) {
        const list = await loadExternal(p.id);
        for (const entry of list) {
            await refreshEntry(entry);
            refreshed.push({ propertyId: p.id, name: entry.name, status: entry.status, count: entry.lastCount || 0 });
        }
        await saveExternal(p.id, list);
    }

    // 2) Revisar la salud del sistema (misma lógica que /api/health)
    let health = null;
    try {
        const base = 'https://' + (req.headers.host || 'www.cabanaslamaite.com');
        const r = await fetchWithTimeout(base + '/api/health?notify=1', { method: 'GET' }, 25000);
        health = await r.json().catch(() => null);
    } catch (e) { health = null; }

    return res.json({
        ok: true,
        refreshed: refreshed.length,
        refreshedDetail: refreshed,
        health: health ? { ok: health.ok, failures: health.failures, notified: health.notified } : null
    });
};

// POST /api/ical/external/refresh-all — refresca TODOS los calendarios externos.
// Lo invoca el cron de Vercel (vercel.json) y el botón del panel de administración.
// Si CRON_SECRET está definido en Vercel, exige el header Authorization Bearer.
const { PROPERTIES, loadExternal, saveExternal } = require('../../_lib');
const { parseIcs } = require('../../_ics');

async function refreshEntry(entry) {
    entry.lastSync = new Date().toISOString();
    entry.status = 'pending';
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 15000);
        const r = await fetch(entry.url, {
            signal: ctrl.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Cabañas La Maite · sincronización iCal)' }
        });
        clearTimeout(t);
        if (!r.ok) throw new Error('http_' + r.status);
        const text = await r.text();
        entry.events = parseIcs(text);
        entry.status = 'ok';
        entry.lastCount = entry.events.length;
        delete entry.lastError;
    } catch (e) {
        entry.status = 'error';
        entry.lastError = String((e && e.message) || e).slice(0, 120);
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    if (process.env.CRON_SECRET) {
        const auth = String(req.headers.authorization || '');
        if (auth !== 'Bearer ' + process.env.CRON_SECRET) {
            return res.status(401).json({ error: 'unauthorized' });
        }
    }

    const results = [];
    for (const p of PROPERTIES) {
        const list = await loadExternal(p.id);
        for (const entry of list) {
            await refreshEntry(entry);
            results.push({ propertyId: p.id, id: entry.id, status: entry.status, lastCount: entry.lastCount || 0 });
        }
        await saveExternal(p.id, list);
    }

    return res.json({ ok: true, refreshed: results.length, results });
};

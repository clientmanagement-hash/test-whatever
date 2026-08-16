// POST   /api/ical/external/:id — refresca un calendario externo
// DELETE /api/ical/external/:id — lo elimina
// Body: { propertyId } (+ id en la URL)
const { propId, loadExternal, saveExternal, readBody } = require('../../_lib');
const { parseIcs } = require('../../_ics');

async function refreshExternal(entry) {
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
    const body = await readBody(req);
    const id = String(req.query.id || '');
    const propertyId = body.propertyId;

    if (!propId(propertyId)) return res.status(400).json({ error: 'invalid_property' });
    const list = await loadExternal(propertyId);
    const entry = list.find((e) => e.id === id);
    if (!entry) return res.status(404).json({ error: 'not_found' });

    if (req.method === 'POST') {
        await refreshExternal(entry);
        await saveExternal(propertyId, list);
        return res.json({ ok: true, status: entry.status, lastCount: entry.lastCount || 0, lastSync: entry.lastSync, lastError: entry.lastError || null });
    }

    if (req.method === 'DELETE') {
        await saveExternal(propertyId, list.filter((e) => e.id !== id));
        return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
};

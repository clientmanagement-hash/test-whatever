// POST /api/ical/external — agrega un calendario iCal externo (Airbnb/Booking/Expedia)
// Body: { propertyId, name, url } → se descarga y parsea de inmediato.
const { propId, loadExternal, saveExternal, readBody } = require('./_lib');
const { parseIcs } = require('./_ics');

async function refreshExternal(pid, entry) {
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

    const body = await readBody(req);
    const { propertyId, name, url } = body;
    if (!propId(propertyId)) return res.status(400).json({ error: 'invalid_property' });
    if (!/^https?:\/\//i.test(String(url || ''))) return res.status(400).json({ error: 'invalid_url' });
    if (String(url).length > 500) return res.status(400).json({ error: 'url_too_long' });

    const list = await loadExternal(propertyId);
    if (list.some((e) => e.url === url)) return res.status(409).json({ error: 'duplicate' });

    const entry = {
        id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        name: String(name || 'iCal').slice(0, 80),
        url,
        lastSync: null,
        status: 'pending',
        events: []
    };

    await refreshExternal(propertyId, entry);
    list.push(entry);
    await saveExternal(propertyId, list);

    return res.status(201).json({ ok: true, id: entry.id, status: entry.status, lastCount: entry.lastCount || 0, lastError: entry.lastError || null });
};

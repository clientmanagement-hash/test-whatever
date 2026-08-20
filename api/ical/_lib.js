// api/ical/_lib.js — almacenamiento + lógica compartida del calendario iCal
// Persistencia: Vercel KV (Upstash) si KV_REST_API_URL/KV_REST_API_TOKEN existen.
// Si no, usa memoria + /tmp (modo dev-ephemeral): sirve para probar, pero se
// pierde con el cold start — en producción configurar Vercel KV.

const PROPERTIES = [
    { id: 'loft1', name: 'Loft 1' },
    { id: 'loft2', name: 'Loft 2' }
];

const propId = (id) => PROPERTIES.find((p) => p.id === id);

const K_RES = (pid) => `ical:res:${pid}`;
const K_EXT = (pid) => `ical:ext:${pid}`;

// ---------- almacenamiento ----------
let kv = null;
let devStore = null;

function getKv() {
    // Acepta KV_REST_API_URL/TOKEN (Vercel) o UPSTASH_REDIS_REST_URL/TOKEN (Upstash)
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token && !kv) {
        try {
            const { createClient } = require('@vercel/kv');
            kv = createClient({ url, token });
        } catch (e) {
            kv = null;
        }
    }
    return kv;
}

function getDevStore() {
    if (!devStore) {
        devStore = { data: null };
        try {
            const fs = require('fs');
            if (fs.existsSync('/tmp/ical-store.json')) {
                devStore.data = JSON.parse(fs.readFileSync('/tmp/ical-store.json', 'utf8'));
            }
        } catch (e) { /* ignorar */ }
        if (!devStore.data) devStore.data = { reservations: {}, external: {} };
    }
    return devStore;
}

const storageMode = () => (getKv() ? 'vercel-kv' : 'dev-ephemeral');

async function loadReservations(pid) {
    const k = getKv();
    if (k) {
        const raw = await k.get(K_RES(pid));
        return Array.isArray(raw) ? raw : [];
    }
    return getDevStore().data.reservations[pid] || [];
}

async function saveReservations(pid, list) {
    const k = getKv();
    if (k) return k.set(K_RES(pid), list);
    const ds = getDevStore();
    ds.data.reservations[pid] = list;
    try {
        require('fs').writeFileSync('/tmp/ical-store.json', JSON.stringify(ds.data));
    } catch (e) { /* ignorar */ }
}

async function loadExternal(pid) {
    const k = getKv();
    if (k) {
        const raw = await k.get(K_EXT(pid));
        return Array.isArray(raw) ? raw : [];
    }
    return getDevStore().data.external[pid] || [];
}

async function saveExternal(pid, list) {
    const k = getKv();
    if (k) return k.set(K_EXT(pid), list);
    const ds = getDevStore();
    ds.data.external[pid] = list;
    try {
        require('fs').writeFileSync('/tmp/ical-store.json', JSON.stringify(ds.data));
    } catch (e) { /* ignorar */ }
}

// ---------- fechas y disponibilidad ----------
const dayMs = 86400000;
const norm = (s) => String(s).slice(0, 10);

// rangos bloqueados de una propiedad: reservas propias + eventos importados
async function availability(pid) {
    const ranges = [];
    for (const r of await loadReservations(pid)) {
        ranges.push({ checkIn: norm(r.checkIn), checkOut: norm(r.checkOut) });
    }
    for (const ext of await loadExternal(pid)) {
        for (const ev of (ext.events || [])) {
            ranges.push({ checkIn: norm(ev.checkIn), checkOut: norm(ev.checkOut) });
        }
    }
    return ranges;
}

async function isBlocked(pid, checkIn, checkOut) {
    const aIn = Date.parse(checkIn);
    const aOut = Date.parse(checkOut);
    if (!Number.isFinite(aIn) || !Number.isFinite(aOut) || aOut <= aIn) return true;
    for (const r of await availability(pid)) {
        const bIn = Date.parse(r.checkIn);
        const bOut = Date.parse(r.checkOut);
        if (aIn < bOut && bIn < aOut) return true; // solapamiento de noches
    }
    return false;
}

// registra una reserva (sin validar solapamiento: el guardián es create-order)
async function recordReservation({ propertyId, checkIn, checkOut, guest, breakfast, source }) {
    const prop = propId(propertyId);
    if (!prop) return { error: 'invalid_property' };
    const inMs = Date.parse(checkIn);
    const outMs = Date.parse(checkOut);
    if (!Number.isFinite(inMs) || !Number.isFinite(outMs) || outMs <= inMs) return { error: 'invalid_dates' };
    if ((outMs - inMs) / dayMs > 90) return { error: 'too_long' };
    const list = await loadReservations(propertyId);
    const uid = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    list.push({
        uid,
        checkIn: norm(checkIn),
        checkOut: norm(checkOut),
        guest: String(guest || '').slice(0, 80),
        breakfast: Boolean(breakfast),
        source: source === 'web' ? 'web' : 'manual',
        createdAt: new Date().toISOString()
    });
    await saveReservations(propertyId, list);
    return { ok: true, uid };
}

// ---------- utilidades HTTP ----------
function readBody(req) {
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) {
        return Promise.resolve(req.body);
    }
    return new Promise((resolve) => {
        let data = '';
        req.on('data', (c) => { data += c; });
        req.on('end', () => {
            try { resolve(data ? JSON.parse(data) : {}); }
            catch (e) { resolve({}); }
        });
    });
}

// PIN de administración (env ADMIN_PIN; valor por defecto documentado)
const adminPinOk = (req) => {
    const pin = process.env.ADMIN_PIN || 'maite-admin-2026';
    const sent = req.headers['x-admin-pin'] || req.query.pin;
    return typeof sent === 'string' && sent === pin;
};

const hostUrl = (req) => `https://${req.headers.host || 'xn--cabaaslamaite-lkb.com'}`;

module.exports = {
    PROPERTIES,
    propId,
    storageMode,
    loadReservations,
    saveReservations,
    loadExternal,
    saveExternal,
    availability,
    isBlocked,
    recordReservation,
    readBody,
    adminPinOk,
    hostUrl,
    dayMs,
    norm
};

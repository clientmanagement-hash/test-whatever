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
const K_INQ = 'inquiries';   // consultas del formulario de contacto

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

// ---------- consultas del formulario de contacto ----------
// Se guardan siempre (nunca se pierden) y el panel admin las muestra.
async function loadInquiries() {
    const k = getKv();
    if (k) {
        const raw = await k.get(K_INQ);
        return Array.isArray(raw) ? raw : [];
    }
    return getDevStore().data.inquiries || [];
}

async function saveInquiries(list) {
    const k = getKv();
    if (k) return k.set(K_INQ, list);
    const ds = getDevStore();
    ds.data.inquiries = list;
    try {
        require('fs').writeFileSync('/tmp/ical-store.json', JSON.stringify(ds.data));
    } catch (e) { /* ignorar */ }
}

// Guarda una consulta (máx. 300, las más recientes primero)
async function addInquiry(fields) {
    const list = await loadInquiries();
    const item = {
        id: 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        createdAt: new Date().toISOString(),
        sentBy: fields.sentBy || null,   // 'resend' | 'formsubmit' | null (no se pudo enviar)
        nombre: String(fields.nombre || '').slice(0, 120),
        email: String(fields.email || '').slice(0, 120),
        telefono: String(fields.telefono || '').slice(0, 40),
        fechas: String(fields.fechas || '').slice(0, 120),
        huespedes: String(fields.huespedes || '').slice(0, 20),
        mensaje: String(fields.mensaje || '').slice(0, 2000)
    };
    list.unshift(item);
    await saveInquiries(list.slice(0, 300));
    return item;
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

// ---- Noches huérfanas ------------------------------------------------------
// Una noche huérfana es UNA sola noche disponible entre dos periodos ocupados
// (la noche anterior y la siguiente están bloqueadas). Solo esas se pueden
// reservar 1 noche aunque el mínimo general sea mayor.
const dayIso = (t) => new Date(t).toISOString().slice(0, 10);

// ¿La noche que empieza en `nightIso` está libre en esa propiedad?
function nightFree(ranges, nightIso) {
    const t = Date.parse(nightIso + 'T00:00:00Z');
    for (const r of ranges) {
        const bIn = Date.parse(r.checkIn + 'T00:00:00Z');
        const bOut = Date.parse(r.checkOut + 'T00:00:00Z');
        if (t >= bIn && t < bOut) return false; // dentro de un bloqueo
    }
    return true;
}

// Lista de noches huérfanas de una propiedad (una noche libre con ambas vecinas ocupadas)
function orphanNightsFromRanges(ranges, fromIso, toIso) {
    const result = [];
    if (!ranges || !ranges.length) return result;
    // Rango de fechas a explorar: desde la primera a la última fecha bloqueada (+/- 1 día)
    let min = Infinity;
    let max = -Infinity;
    for (const r of ranges) {
        min = Math.min(min, Date.parse(r.checkIn + 'T00:00:00Z'));
        max = Math.max(max, Date.parse(r.checkOut + 'T00:00:00Z'));
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return result;
    const start = Math.max(min - dayMs, fromIso ? Date.parse(fromIso + 'T00:00:00Z') : min - dayMs);
    const end = Math.min(max + dayMs, toIso ? Date.parse(toIso + 'T00:00:00Z') : max + dayMs);
    for (let t = start; t <= end; t += dayMs) {
        const s = dayIso(t);
        const prev = dayIso(t - dayMs);
        const next = dayIso(t + dayMs);
        if (nightFree(ranges, s) && !nightFree(ranges, prev) && !nightFree(ranges, next)) {
            result.push(s);
        }
    }
    return result;
}

// Noches huérfanas de una propiedad (consultando su disponibilidad real)
async function orphanNights(pid) {
    const ranges = await availability(pid);
    return orphanNightsFromRanges(ranges);
}

// ¿El rango pedido es exactamente una noche huérfana? (1 noche, y es huérfana)
async function isOrphanStay(pid, checkIn, checkOut) {
    const aIn = Date.parse(checkIn);
    const aOut = Date.parse(checkOut);
    if (!Number.isFinite(aIn) || !Number.isFinite(aOut)) return false;
    if (Math.round((aOut - aIn) / dayMs) !== 1) return false; // debe ser exactamente 1 noche
    const ranges = await availability(pid);
    const s = norm(checkIn);
    return nightFree(ranges, s) && !nightFree(ranges, dayIso(aIn - dayMs)) && !nightFree(ranges, dayIso(aIn + dayMs));
}

// registra una reserva (sin validar solapamiento: el guardián es create-order)
async function recordReservation({ propertyId, checkIn, checkOut, guest, name, email, phone, children, freeChildren, childAges, breakfast, source }) {
    const prop = propId(propertyId);
    if (!prop) return { error: 'invalid_property' };
    const inMs = Date.parse(checkIn);
    const outMs = Date.parse(checkOut);
    if (!Number.isFinite(inMs) || !Number.isFinite(outMs) || outMs <= inMs) return { error: 'invalid_dates' };
    if ((outMs - inMs) / dayMs > 90) return { error: 'too_long' };
    const list = await loadReservations(propertyId);
    const uid = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const kids = Number.isFinite(Number(children)) ? Math.max(0, Math.floor(Number(children))) : 0;
    const ages = Array.isArray(childAges) ? childAges.map((a) => Number(a)).filter((a) => Number.isFinite(a) && a >= 0 && a <= 17).map((a) => Math.floor(a)) : [];
    // Si no llegan edades pero sí conteos, se reconstruye el recuento de gratis
    const kidsFree = Number.isFinite(Number(freeChildren))
        ? Math.max(0, Math.floor(Number(freeChildren)))
        : ages.filter((a) => a <= 2).length;
    list.push({
        uid,
        checkIn: norm(checkIn),
        checkOut: norm(checkOut),
        guest: String(guest || '').slice(0, 80),
        name: String(name || '').slice(0, 80),
        email: String(email || '').slice(0, 120),
        phone: String(phone || '').slice(0, 30),
        children: kids,           // niños de 3+ años (pagan como una persona)
        freeChildren: kidsFree,   // niños de 2 años o menos (gratis)
        childAges: ages,          // edades declaradas
        breakfast: Boolean(breakfast),
        source: source === 'web' ? 'web' : 'manual',
        createdAt: new Date().toISOString()
    });
    await saveReservations(propertyId, list);
    return { ok: true, uid };
}

// Guarda el resultado de los envíos de correo de una reserva (diagnóstico en el panel)
async function markNotify(propertyId, uid, notify) {
    if (!propId(propertyId) || !uid) return { error: 'invalid' };
    const list = await loadReservations(propertyId);
    const item = list.find((r) => r.uid === uid);
    if (!item) return { error: 'not_found' };
    item.notify = notify;
    await saveReservations(propertyId, list);
    return { ok: true };
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
    loadInquiries,
    addInquiry,
    orphanNights,
    orphanNightsFromRanges,
    isOrphanStay,
    recordReservation,
    markNotify,
    readBody,
    adminPinOk,
    hostUrl,
    dayMs,
    norm
};

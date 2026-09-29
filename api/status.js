// Vercel Function — /api/status (CommonJS)
// Dos usos en una sola función (para no exceder el límite de funciones de Vercel):
//
//   GET /api/status              → estado del sistema (pagos, correos, almacenamiento, calendarios)
//   GET /api/status?notify=1     → además avisa por correo al dueño si algo falla
//   GET /api/status?task=daily   → tarea diaria: refresca los calendarios externos y revisa la salud
//
// Autoriza con el PIN del panel (X-Admin-Pin) o el Bearer del cron (CRON_SECRET).

const { PROPERTIES, storageMode, loadReservations, loadExternal, loadInquiries, saveExternal, adminPinOk } = require('./ical/_lib');
const { parseIcs } = require('./ical/_ics');

function fetchWithTimeout(url, options, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

// ---------- tarea diaria: refrescar calendarios ----------
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

async function runDailyRefresh() {
    const out = [];
    for (const p of PROPERTIES) {
        const list = await loadExternal(p.id);
        for (const entry of list) {
            await refreshEntry(entry);
            out.push({ propertyId: p.id, name: entry.name, status: entry.status, count: entry.lastCount || 0 });
        }
        await saveExternal(p.id, list);
    }
    return out;
}

// ---------- comprobaciones de salud ----------
async function checkResend(from) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { ok: false, label: 'Resend (correos)', detail: 'Falta RESEND_API_KEY en Vercel' };
    try {
        const r = await fetchWithTimeout('https://api.resend.com/domains', {
            headers: { 'Authorization': 'Bearer ' + apiKey }
        }, 12000);
        if (r.status === 401) return { ok: false, label: 'Resend (correos)', detail: 'La API key no es válida' };
        if (!r.ok) return { ok: false, label: 'Resend (correos)', detail: 'Respuesta ' + r.status };
        const data = await r.json().catch(() => ({}));
        const doms = (data && data.data) || [];
        const verified = doms.filter((d) => d.status === 'verified').map((d) => d.name);
        return {
            ok: true,
            label: 'Resend (correos)',
            detail: verified.length ? 'Dominio verificado: ' + verified.join(', ') : 'Clave válida (sin dominio verificado)',
            from
        };
    } catch (e) {
        return { ok: false, label: 'Resend (correos)', detail: 'No se pudo contactar a Resend' };
    }
}

async function checkPayPal() {
    const env = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
    const id = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    if (!id || !secret) return { ok: false, label: 'Pagos (PayPal)', detail: 'Faltan credenciales en Vercel' };
    const base = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    try {
        const r = await fetchWithTimeout(base + '/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64')
            },
            body: 'grant_type=client_credentials'
        }, 12000);
        if (r.status === 401) return { ok: false, label: 'Pagos (PayPal)', detail: 'Credenciales rechazadas' };
        if (!r.ok) return { ok: false, label: 'Pagos (PayPal)', detail: 'Respuesta ' + r.status };
        return { ok: true, label: 'Pagos (PayPal)', detail: env === 'live' ? 'Modo LIVE (cobra de verdad)' : 'Modo SANDBOX (pagos de prueba)' };
    } catch (e) {
        return { ok: false, label: 'Pagos (PayPal)', detail: 'No se pudo contactar a PayPal' };
    }
}

async function checkStorage() {
    const mode = storageMode();
    const ok = mode === 'vercel-kv';
    let extra = '';
    try {
        const inq = await loadInquiries();
        extra = ' · ' + inq.length + ' consulta(s) guardada(s)';
    } catch (e) { extra = ' · no se pudo leer'; }
    return {
        ok,
        label: 'Almacenamiento',
        detail: (ok ? 'Upstash (persistente)' : 'EFÍMERO — falta configurar Upstash (los datos se pierden)') + extra
    };
}

async function checkCalendars() {
    const items = [];
    let allOk = true;
    for (const p of PROPERTIES) {
        try {
            const ext = await loadExternal(p.id);
            const malos = ext.filter((e) => e.status !== 'ok');
            const total = ext.reduce((n, e) => n + (e.events ? e.events.length : 0), 0);
            const reservas = (await loadReservations(p.id)).length;
            items.push({
                ok: malos.length === 0,
                label: 'Calendario ' + p.name,
                detail: (malos.length ? malos.length + ' calendario(s) con error · ' : '')
                    + ext.length + ' externos · ' + total + ' fechas · ' + reservas + ' reservas propias'
            });
            if (malos.length) allOk = false;
        } catch (e) {
            items.push({ ok: false, label: 'Calendario ' + p.name, detail: 'No se pudo leer' });
            allOk = false;
        }
    }
    return { ok: allOk, items };
}

module.exports = async function handler(req, res) {
    const auth = String(req.headers.authorization || '');
    const cronOk = process.env.CRON_SECRET && auth === 'Bearer ' + process.env.CRON_SECRET;
    if (!cronOk && !adminPinOk(req)) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    // Tarea diaria (refrescar calendarios + salud)
    const isDaily = req.query && req.query.task === 'daily';
    let refreshed = null;
    if (isDaily) {
        try { refreshed = await runDailyRefresh(); } catch (e) { refreshed = []; }
    }

    const from = process.env.RESEND_FROM || 'Cabañas La Maite <onboarding@resend.dev>';
    const checks = [];
    checks.push(await checkStorage());
    checks.push(await checkResend(from));
    checks.push(await checkPayPal());
    const cals = await checkCalendars();
    checks.push(...(cals.items.length ? cals.items : [{ ok: cals.ok, label: 'Calendarios', detail: 'Sin datos' }]));

    const failures = checks.filter((c) => !c.ok);
    const overall = failures.length === 0;

    // Aviso al dueño si algo falla (desde el cron o con ?notify=1)
    const wantsNotify = cronOk || (req.query && req.query.notify === '1');
    let notified = false;
    if (!overall && wantsNotify && process.env.RESEND_API_KEY) {
        try {
            const to = process.env.NOTIFY_EMAIL || 'cabanaslamaite@gmail.com';
            const rows = failures.map((f) => '<tr><td style="padding:6px;border:1px solid #ddd"><b>' + f.label
                + '</b></td><td style="padding:6px;border:1px solid #ddd">' + f.detail + '</td></tr>').join('');
            await fetchWithTimeout('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from,
                    to: [to],
                    subject: '⚠️ Aviso: algo falla en la web de Cabañas La Maite',
                    html: '<h2 style="color:#a05a1c">Revisión automática del sistema</h2>'
                        + '<p>Se detectaron problemas:</p><table cellpadding="0" cellspacing="0" style="border-collapse:collapse">'
                        + rows + '</table><p>Entra al panel para más detalle.</p>'
                })
            }, 12000);
            notified = true;
        } catch (e) { /* si el aviso falla, el panel sigue mostrando el estado */ }
    }

    return res.status(200).json({
        ok: overall,
        checkedAt: new Date().toISOString(),
        failures: failures.length,
        notified,
        refreshed: refreshed ? refreshed.length : null,
        refreshedDetail: refreshed,
        checks
    });
};

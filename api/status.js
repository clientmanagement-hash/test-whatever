// Vercel Function — GET /api/status (CommonJS)
// Comprueba automáticamente que todo lo crítico funcione, SIN necesidad de hacer
// una reserva ni un mensaje de prueba. Devuelve el estado de cada servicio.
// Con ?notify=1 envía un aviso por correo al dueño si algo está fallando.
// Se usa desde el panel admin (con PIN) y desde el cron diario.

const { PROPERTIES, storageMode, loadReservations, loadExternal, loadInquiries, adminPinOk } = require('./ical/_lib');

function fetchWithTimeout(url, options, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

async function checkResend(from) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { ok: false, label: 'Resend (correos)', detail: 'Falta RESEND_API_KEY en Vercel' };
    try {
        // Endpoint de lectura: valida la clave sin enviar correo
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

async function checkCalendars() {
    const out = [];
    let allOk = true;
    for (const p of PROPERTIES) {
        try {
            const ext = await loadExternal(p.id);
            const malos = ext.filter((e) => e.status !== 'ok');
            const total = ext.reduce((n, e) => n + (e.events ? e.events.length : 0), 0);
            const reservas = (await loadReservations(p.id)).length;
            out.push({
                ok: malos.length === 0,
                label: 'Calendario ' + p.name,
                detail: (malos.length ? malos.length + ' calendario(s) con error · ' : '')
                    + ext.length + ' externos · ' + total + ' fechas · ' + reservas + ' reservas propias'
            });
            if (malos.length) allOk = false;
        } catch (e) {
            out.push({ ok: false, label: 'Calendario ' + p.name, detail: 'No se pudo leer' });
            allOk = false;
        }
    }
    return { ok: allOk, items: out };
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

module.exports = async function handler(req, res) {
    // Autoriza: cron de Vercel (Bearer CRON_SECRET) o el panel admin (PIN)
    const auth = String(req.headers.authorization || '');
    const cronOk = process.env.CRON_SECRET && auth === 'Bearer ' + process.env.CRON_SECRET;
    if (!cronOk && !adminPinOk(req)) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const from = process.env.RESEND_FROM || 'Cabañas La Maite <onboarding@resend.dev>';
    const checks = [];

    checks.push(await checkStorage());
    checks.push(await checkResend(from));
    checks.push(await checkPayPal());

    const cals = await checkCalendars();
    if (cals.items) checks.push(...cals.items);
    else checks.push({ ok: cals.ok, label: 'Calendarios', detail: 'Sin datos' });

    const failures = checks.filter((c) => !c.ok);
    const overall = failures.length === 0;

    // Aviso por correo al dueño si algo falla (se usa desde el cron o ?notify=1)
    const wantsNotify = req.query && (req.query.notify === '1' || cronOk);
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
        checks
    });
};

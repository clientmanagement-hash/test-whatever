// api/ical/_ics.js — generar y parsear iCalendar (RFC 5545)

const icsEscape = (s) => String(s).replace(/[\\;,]/g, (m) => '\\' + m).replace(/\r?\n/g, '\\n');

const fmtDate = (d) => d.toISOString().slice(0, 10).replace(/-/g, ''); // Date → YYYYMMDD (UTC)

const nowStamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // YYYYMMDDTHHMMSSZ

// Genera el feed .ics de una propiedad con sus reservas (una VEVENT por reserva,
// DTEND = día de salida; el formato all-day lo aceptan Airbnb, Booking y Expedia).
function buildCalendar({ property, reservations }) {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Cabanas La Maite//Calendario iCal//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:' + icsEscape(property.name + ' · Cabañas La Maite'),
        'X-WR-CALDESC:' + icsEscape('Noches reservadas directamente en cabanaslamaite.vercel.app')
    ];
    for (const r of reservations || []) {
        const inD = new Date(String(r.checkIn).slice(0, 10) + 'T00:00:00Z');
        const outD = new Date(String(r.checkOut).slice(0, 10) + 'T00:00:00Z');
        if (!Number.isFinite(inD.getTime()) || !Number.isFinite(outD.getTime()) || outD <= inD) continue;
        lines.push(
            'BEGIN:VEVENT',
            'UID:' + icsEscape(r.uid) + '@cabanaslamaite.vercel.app',
            'DTSTAMP:' + nowStamp(),
            'DTSTART;VALUE=DATE:' + fmtDate(inD),
            'DTEND;VALUE=DATE:' + fmtDate(outD),
            'SUMMARY:' + icsEscape('Reservado'),
            'TRANSP:TRANSPARENT',
            'END:VEVENT'
        );
    }
    lines.push('END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
}

// Parsea un texto .ics externo (Airbnb/Booking/Expedia) → [{ checkIn, checkOut }]
// Soporta DTSTART/DTEND con VALUE=DATE, VALUE=DATE-TIME y TZID; líneas continuadas.
function parseIcs(text) {
    const unfolded = String(text).replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const events = [];
    let cur = null;
    const push = () => {
        if (cur && cur.checkIn) events.push(cur);
    };
    for (const raw of unfolded.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) continue;
        if (line === 'BEGIN:VEVENT') { cur = { checkIn: null, checkOut: null }; continue; }
        if (line === 'END:VEVENT') { push(); cur = null; continue; }
        if (!cur) continue;
        const idx = line.indexOf(':');
        if (idx < 0) continue;
        const name = line.slice(0, idx).toUpperCase();
        const value = line.slice(idx + 1);
        const datePart = (v) => {
            const m = (v.match(/\d{8}/) || [])[0];
            return m ? m.slice(0, 4) + '-' + m.slice(4, 6) + '-' + m.slice(6, 8) : null;
        };
        if (name.startsWith('DTSTART')) cur.checkIn = datePart(value);
        if (name.startsWith('DTEND')) cur.checkOut = datePart(value);
    }
    push();
    return events
        .map((e) => {
            let out = e.checkOut;
            if (!out && e.checkIn) {
                const d = new Date(e.checkIn + 'T00:00:00Z');
                d.setUTCDate(d.getUTCDate() + 1);
                out = d.toISOString().slice(0, 10);
            }
            return { checkIn: e.checkIn, checkOut: out };
        })
        .filter((e) => e.checkIn && e.checkOut && Date.parse(e.checkOut) > Date.parse(e.checkIn));
}

module.exports = { buildCalendar, parseIcs };

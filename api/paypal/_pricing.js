// Precios — fuente de verdad del COBRO (server-side). Módulo compartido (CommonJS).
// El frontend solo MUESTRA estos precios; el servidor los recalcula al cobrar.
// (El prefijo _ evita que Vercel lo exponga como ruta /api/...)

const PRICING = {
    baseGuests: 2,        // la tarifa incluye 2 personas
    minNights: 2,         // estadía mínima
    maxGuests: 8,
    maxNights: 60,
    extraGuestFee: 10,    // $ por persona adicional por noche
    seasons: [
        { from: '01-01', to: '12-31', rate: 116 }   // tarifa fija
    ],
    events: [
        { from: '2027-03-21', to: '2027-03-28', rate: 130.5 }   // Semana Santa 2027
    ],
    depositPct: 100,      // 100 = pago total al reservar
    currency: 'USD',
    // Desayuno incluido (recargo por noche): $7 por los 2 primeros + $6.40 por persona extra
    // tarifas resultantes (base $116): 2p=$123 · 3p=$139.40 · 4p=$155.80 · 5p=$172.20
    breakfast: { base: 7, extraPerGuest: 6.4 }
};

const toInt = (s) => parseInt(String(s).replace(/-/g, ''), 10);

function rateForDate(date) {
    // 1) Eventos puntuales (fecha completa YYYY-MM-DD)
    const full = date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
    for (const ev of PRICING.events) {
        if (full >= toInt(ev.from) && full <= toInt(ev.to)) return ev.rate;
    }
    // 2) Temporadas recurrentes (MM-DD)
    const v = (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
    for (const s of PRICING.seasons) {
        const f = toInt(s.from);
        const t = toInt(s.to);
        if (f <= t) {
            if (v >= f && v <= t) return s.rate;
        } else if (v >= f || v <= t) {
            return s.rate; // temporada que cruza el año nuevo
        }
    }
    return PRICING.seasons.length ? PRICING.seasons[0].rate : 0;
}

// Recibe fechas 'YYYY-MM-DD', huéspedes y si incluye desayuno; devuelve { total, nights, guests, currency, breakfast } o { error }
function computeBooking(checkIn, checkOut, guests, breakfast) {
    const inMs = Date.parse(checkIn);
    const outMs = Date.parse(checkOut);
    if (!Number.isFinite(inMs) || !Number.isFinite(outMs) || outMs <= inMs) {
        return { error: 'invalid_dates' };
    }
    const nights = Math.round((outMs - inMs) / 86400000);
    if (nights < PRICING.minNights) return { error: 'min_nights' };
    if (nights > PRICING.maxNights) return { error: 'too_long' };

    const g = Number.isFinite(guests) ? Math.max(1, Math.floor(guests)) : PRICING.baseGuests;
    if (g > PRICING.maxGuests) return { error: 'too_many_guests' };

    const extraGuests = Math.max(0, g - PRICING.baseGuests);
    const withBreakfast = breakfast === true;
    let total = 0;
    for (let i = 0; i < nights; i++) {
        const d = new Date(inMs + i * 86400000);
        let rate = rateForDate(d) + extraGuests * PRICING.extraGuestFee;
        if (withBreakfast) {
            rate += PRICING.breakfast.base + extraGuests * PRICING.breakfast.extraPerGuest;
        }
        total += rate;
    }
    total = Math.round(total * PRICING.depositPct) / 100;
    return { total: Math.round(total * 100) / 100, nights, guests: g, currency: PRICING.currency, breakfast: withBreakfast };
}

module.exports = { PRICING, rateForDate, computeBooking };

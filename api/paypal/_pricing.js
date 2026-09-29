// Precios — fuente de verdad del COBRO (server-side). Módulo compartido (CommonJS).
// El frontend solo MUESTRA estos precios; el servidor los recalcula al cobrar.
// (El prefijo _ evita que Vercel lo exponga como ruta /api/...)

const PRICING = {
    baseGuests: 2,        // la tarifa incluye 2 personas
    minNights: 2,         // estadía mínima (2 noches)
    maxGuests: 5,         // máximo 5 huéspedes
    maxNights: 60,
    // Persona adicional por noche: 3ª +$10 · 4ª +$10 · 5ª +$5
    // (equivale a un recargo acumulado de $10 por cada persona hasta la 4ª y $5 la 5ª)
    extraGuestFee: 10,    // $ por cada persona adicional hasta la 4ª
    extraGuestFee5: 5,    // $ por la 5ª persona
    seasons: [
        { from: '01-01', to: '04-30', rate: 119 },  // TEMPORADA ALTA: ene, feb, mar, abr
        { from: '05-01', to: '06-30', rate: 110 },  // TEMPORADA BAJA: may, jun
        { from: '07-01', to: '08-31', rate: 119 },  // TEMPORADA ALTA: jul, ago
        { from: '09-01', to: '11-30', rate: 110 },  // TEMPORADA BAJA: sep, oct, nov
        { from: '12-01', to: '12-31', rate: 119 }   // TEMPORADA ALTA: diciembre
    ],
    events: [
        { from: '2027-03-21', to: '2027-03-28', rate: 135 }   // Semana Santa 2027: $135/noche
    ],
    depositPct: 100,      // 100 = pago total al reservar
    currency: 'USD',
    // Desayuno incluido: $11 por persona por noche
    // (ej. 2 noches × 2 personas = +$44 sobre el total)
    breakfast: { perPersonPerNight: 11 }
};

// Recargo por personas adicionales (misma lógica en servidor y frontend)
function extraGuestsFee(guests) {
    const extra = Math.max(0, guests - PRICING.baseGuests);
    if (!extra) return 0;
    return Math.min(extra, 2) * PRICING.extraGuestFee + Math.max(0, extra - 2) * PRICING.extraGuestFee5;
}

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

    const extraFeePerNight = extraGuestsFee(g);
    const withBreakfast = breakfast === true;
    let total = 0;
    for (let i = 0; i < nights; i++) {
        const d = new Date(inMs + i * 86400000);
        let rate = rateForDate(d) + extraFeePerNight;
        if (withBreakfast) rate += PRICING.breakfast.perPersonPerNight * g;
        total += rate;
    }
    total = Math.round(total * PRICING.depositPct) / 100;
    return { total: Math.round(total * 100) / 100, nights, guests: g, currency: PRICING.currency, breakfast: withBreakfast };
}

module.exports = { PRICING, rateForDate, computeBooking, extraGuestsFee };

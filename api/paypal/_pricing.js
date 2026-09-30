// Precios — fuente de verdad del COBRO (server-side). Módulo compartido (CommonJS).
// El frontend solo MUESTRA estos precios; el servidor los recalcula al cobrar.
// (El prefijo _ evita que Vercel lo exponga como ruta /api/...)

const PRICING = {
    baseGuests: 2,        // la tarifa incluye 2 personas
    minNights: 2,         // estadía mínima (2 noches)
    maxGuests: 5,         // máximo 5 huéspedes (los niños de 3+ años también ocupan cupo)
    childFreeMaxAge: 2,   // niños de 0 a 2 años: gratis y NO ocupan cupo
    maxChildren: 4,       // tope de niños por reserva
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
        // Fin de año 2026-2027 (tienen prioridad sobre las temporadas)
        { from: '2026-12-24', to: '2026-12-28', rate: 170 },   // Navidad
        { from: '2026-12-29', to: '2027-01-01', rate: 210 },   // Fin de año
        { from: '2027-01-02', to: '2027-01-04', rate: 170 },   // Año nuevo
        { from: '2027-01-05', to: '2027-01-10', rate: 140 },   // Post año nuevo
        { from: '2027-03-21', to: '2027-03-28', rate: 135 }    // Semana Santa 2027
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
// `opts.allowOneNight` permite 1 noche (se usa solo para noches huérfanas validadas por el calendario)
// `opts.childAges` = lista de edades de los niños que acompañan la reserva.
//   - Edad <= childFreeMaxAge (2 años): GRATIS y no ocupan cupo de huésped.
//   - Edad >= 3 años: se cobra como una persona (ocupa cupo y suma la persona adicional).
// `opts.promoRate` = tarifa especial por noche (código promocional). Si viene, SUSTITUYE
//   el precio de temporada, pero se mantienen el recargo por persona adicional y el desayuno.
// `opts.promoFlat` = true cuando el código fija una TARIFA PLANA: el precio por noche es
//   exactamente promoRate, sin recargo por persona adicional (el desayuno sí se suma aparte).
function computeBooking(checkIn, checkOut, guests, breakfast, opts) {
    const inMs = Date.parse(checkIn);
    const outMs = Date.parse(checkOut);
    if (!Number.isFinite(inMs) || !Number.isFinite(outMs) || outMs <= inMs) {
        return { error: 'invalid_dates' };
    }
    const nights = Math.round((outMs - inMs) / 86400000);
    const minNights = (opts && opts.allowOneNight) ? 1 : PRICING.minNights;
    if (nights < minNights) return { error: 'min_nights' };
    if (nights > PRICING.maxNights) return { error: 'too_long' };

    // Adultos: el cliente envía cuántos adultos hay (la tarifa base cubre 2).
    // Los niños de 3+ años se suman aparte desde sus edades, así que este valor
    // no puede usarse para "colar" niños como adultos ni al revés.
    const g = Number.isFinite(guests) ? Math.max(1, Math.floor(guests)) : PRICING.baseGuests;
    if (g > PRICING.maxGuests) return { error: 'too_many_guests' };

    // Clasifica las edades de los niños: gratis (<=2) y de pago (>=3)
    const rawAges = (opts && Array.isArray(opts.childAges)) ? opts.childAges : [];
    if (rawAges.length > PRICING.maxChildren) return { error: 'too_many_children' };
    const ages = rawAges
        .map((a) => Number(a))
        .filter((a) => Number.isFinite(a) && a >= 0 && a <= 17)
        .map((a) => Math.floor(a));
    const freeChildren = ages.filter((a) => a <= PRICING.childFreeMaxAge).length;
    const payingChildren = ages.filter((a) => a > PRICING.childFreeMaxAge).length;

    // Los niños de pago ocupan cupo igual que un adulto
    const totalPayingGuests = g + payingChildren;
    if (totalPayingGuests > PRICING.maxGuests) return { error: 'too_many_guests' };

    const extraFeePerNight = extraGuestsFee(totalPayingGuests);
    const withBreakfast = breakfast === true;
    // Tarifa especial: si hay código promocional válido, sustituye la tarifa de temporada
    const promoRate = (opts && Number.isFinite(Number(opts.promoRate)) && Number(opts.promoRate) > 0)
        ? Number(opts.promoRate)
        : null;
    // Tarifa PLANA: el precio por noche es exactamente promoRate, sin recargo por personas.
    // El desayuno se sigue cobrando aparte (es un servicio adicional, no hospedaje).
    const promoFlat = Boolean(promoRate !== null && opts && opts.promoFlat);
    const extraAplicable = promoFlat ? 0 : extraFeePerNight;
    let total = 0;
    for (let i = 0; i < nights; i++) {
        const d = new Date(inMs + i * 86400000);
        const base = promoRate !== null ? promoRate : rateForDate(d);
        let rate = base + extraAplicable;
        // El desayuno se cobra solo a quienes pagan (adultos + niños de 3+)
        if (withBreakfast) rate += PRICING.breakfast.perPersonPerNight * totalPayingGuests;
        total += rate;
    }
    total = Math.round(total * PRICING.depositPct) / 100;
    return {
        total: Math.round(total * 100) / 100,
        nights,
        guests: totalPayingGuests,
        freeChildren: freeChildren,
        payingChildren: payingChildren,
        childAges: ages,
        currency: PRICING.currency,
        breakfast: withBreakfast,
        promoRate: promoRate,
        promoFlat: promoFlat
    };
}

module.exports = { PRICING, rateForDate, computeBooking, extraGuestsFee };

/* ==========================================================================
   Cabañas la Maite — comportamiento del sitio + i18n ES/EN
   ========================================================================== */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ==========================================================================
   Traducción ES/EN
   - El contenido por defecto del HTML es español.
   - Si el navegador no es español (y no hay idioma guardado), se muestra en inglés.
   - El botón ES|EN del menú cambia y recuerda el idioma elegido.
   ========================================================================== */
const I18N = {
    en: {
        // Navegación
        'nav.inicio': 'Home',
        'nav.lofts': 'Lofts',
        'nav.galeria': 'Gallery',
        'nav.ubicacion': 'Location',
        'nav.reservar': 'Book',
        'nav.menu': 'Open menu',
        'nav.menuClose': 'Close menu',

        // Hero
        'hero.tagline': 'Your beach hideaway: sober, cheerful and minutes from Buena Vista and Sámara beaches. Lofts with pool, tropical garden and everything you need to unwind.',
        'hero.book': 'Book on Booking.com',
        'hero.seeLofts': 'See the lofts',
        'hero.rating': 'Exceptional · 155 reviews',
        'hero.scroll': 'Scroll',
        'hero.scrollAria': 'Scroll to the next section',

        // Franja de datos
        'stat.1.label': 'to Buena Vista Beach',
        'stat.2.strong': 'Pool',
        'stat.2.label': 'in each loft',
        'stat.3.label': 'Exceptional · 155 reviews',
        'stat.4.strong': '1.6 km',
        'stat.4.label': 'to Sámara Beach',

        // Sección lofts
        'lofts.eyebrow': 'Our lofts',
        'lofts.title': 'Two spaces, <span class="text-green">one calm</span>',
        'lofts.sub': 'Self-contained apartments with private entrance, air conditioning, equipped kitchen and a pool among palm trees.',
        'loft1.title': 'Loft 1<br>Pool and garden',
        'loft2.title': 'Loft 2<br>Pool and terrace',
        'loft.desc': 'Pool, garden and terrace.',
        'loft.price': 'From <strong>$116</strong> per night',
        'loft1.link': 'See Loft 1 <span aria-hidden="true">→</span>',
        'loft2.link': 'See Loft 2 <span aria-hidden="true">→</span>',

        // Chips
        'chip.beds': '2 beds + sofa',
        'chip.ac': 'Air conditioning',
        'chip.kitchen': 'Equipped kitchen',
        'chip.internet': 'Satellite internet',
        'chip.parking': 'Private parking',
        'chip.breakfast': 'Breakfast (not included)',
        'chip.cleaning': 'Cleaning (5+ nights)',
        'chip.crib': 'Baby crib',
        'chip.terrace': 'Private terrace',
        'chip.pool': 'Pool',

        // Galería
        'galeria.eyebrow': 'Gallery',
        'galeria.title': 'Live the experience',
        'galeria.sub': 'Pool, tropical gardens and the best beaches minutes away. This is what staying at Cabañas la Maite feels like.',

        // Ubicación
        'ubicacion.eyebrow': 'Location',
        'ubicacion.title': 'Sámara Beach, <span class="text-green">one of the best in the Pacific</span>',
        'ubicacion.sub': 'White sand, gentle waves and unforgettable sunsets. We are 1.6 km from the sea, in one of the most beautiful and safest beaches in Costa Rica.',
        'ubicacion.h1': '900 m to Buena Vista Beach',
        'ubicacion.h1b': '1.6 km to Sámara Beach',
        'ubicacion.h2': 'Restaurants and sodas',
        'ubicacion.h2b': 'local food nearby',
        'ubicacion.h3': 'Minimarket and pharmacy',
        'ubicacion.h3b': 'close to the lodge',
        'ubicacion.h4': 'Easy access',
        'ubicacion.h4b': 'by car or bus',
        'ubicacion.mapTitle': 'Map of Cabañas Lamaite, Sámara, Guanacaste, Costa Rica',

        // Reservas
        'reservar.eyebrow': 'Bookings',
        'reservar.title': 'Book your stay',
        'reservar.sub': 'Best price guaranteed booking directly.',
        'reservar.booking.p': 'Secure booking, instant confirmation and free cancellation on most options.',
        'reservar.booking.go': 'Check availability <span aria-hidden="true">→</span>',
        'reservar.wa.title': 'WhatsApp',
        'reservar.wa.p': 'Message us directly on WhatsApp at +506 8306 3336 for enquiries, special offers and personal attention.',
        'reservar.wa.go': 'Open WhatsApp chat <span aria-hidden="true">→</span>',
        'reservar.social.title': 'Social media',
        'reservar.social.p': 'Follow us and message us on our social networks.',
        'reservar.form.title': 'Or send us your question',
        'reservar.form.intro': 'Tell us your dates and we will reply with availability and price.',
        'reservar.form.nombre': 'Name',
        'reservar.form.email': 'Email',
        'reservar.form.entrada': 'Check-in',
        'reservar.form.salida': 'Check-out',
        'reservar.form.mensaje': 'Message',
        'reservar.form.nombre.ph': 'Your name',
        'reservar.form.email.ph': 'you@email.com',
        'reservar.form.mensaje.ph': 'Which loft interests you? How many people?',
        'reservar.form.submit': 'Send request',
        'reservar.form.sending': 'Sending...',
        'reservar.form.ok': 'Thank you, {name}! We will contact you soon to confirm your request.',
        'reservar.form.errNombre': 'Please enter your name.',
        'reservar.form.errEmail': 'Please enter a valid email.',
        'reservar.form.subject': 'New enquiry · Cabañas la Maite',
        'reservar.form.errSend': 'There was an error sending. Message us on WhatsApp or try again.',
        'direct.title': 'Direct booking',
        'direct.sub': 'Choose your loft and dates and pay the total for your stay. Minimum stay: 2 nights.',
        'direct.loft': 'Loft',
        'direct.loft1': 'Loft 1',
        'direct.loft2': 'Loft 2',
        'direct.in': 'Check-in',
        'direct.out': 'Check-out',
        'direct.nightsLabel': 'Nights',
        'direct.rate': 'Price per night',
        'direct.total': 'Total',
        'direct.deposit': 'Deposit',
        'direct.totalPay': 'Total payment',
        'direct.pay': 'Payment to confirm your booking',
        'direct.note': 'The booking is confirmed once payment is received. You can pay with credit or debit card, no PayPal account needed.',
        'direct.night': 'night',
        'direct.nights': 'nights',
        'direct.selectDates': 'Select your dates',
        'direct.minNights': 'Minimum 2 nights',
        'paypal.item': 'Deposit · Cabañas la Maite',
        'direct.guests': 'Guests',
        'direct.feeNote': 'Rate for 2 people',
        'direct.extra': 'extra person',

        // Footer
        'footer.brand': 'Lofts with pool, 900 m from Buena Vista Beach and 1.6 km from Sámara Beach. Sober, cheerful beach style in Sámara, Costa Rica.',
        'footer.explorar': 'Explore',
        'footer.contacto': 'Contact',
        'footer.made': 'Made with <span style="color:var(--tan-500)">♥</span> by the sea',

        // Lightbox
        'lb.close': 'Close',
        'lb.prev': 'Previous photo',
        'lb.next': 'Next photo',
        'lb.alt': 'Enlarged photo',

        // Páginas de loft (compartido)
        'loft.back': '← Back to the lofts',
        'spec.title': 'Loft details',
        'spec.size': '📐 Size',
        'spec.beds': '🛏️ Beds',
        'spec.baths': '🚿 Bathrooms',
        'spec.climate': '🌡️ Climate',
        'spec.pool': '🏊 Pool',
        'spec.entry': '🚪 Entrance',
        'spec.checkin': '✅ Check-in',
        'spec.checkout': '✅ Check-out',
        'spec.bedsVal': '2 beds + 1 sofa',
        'spec.bathVal': '1 private bathroom',
        'spec.climateVal': 'Individual A/C',
        'spec.poolVal': 'Yes',
        'spec.entryVal': 'Independent',
        'spec.book1': 'Book Loft 1',
        'spec.book2': 'Book Loft 2',
        'spec.note': 'Free cancellation on most options',

        // Servicios
        'amen.eyebrow': 'Services & equipment',
        'amen.title': 'Everything you need',
        'amen.sub': 'Designed so you only worry about enjoying.',
        'amen.cocina': 'Private kitchen',
        'amen.cafe': 'Coffee station',
        'amen.bano': 'Private bathroom',
        'amen.comodidad': 'Comfort',
        'amen.vistas': 'Views',
        'amen.politicas': 'Policies',
        'amen.servicios': 'Services',
        'amen.fridge': 'Refrigerator',
        'amen.micro': 'Microwave',
        'amen.utensils': 'Kitchen utensils',
        'amen.coffeemaker': 'Coffee maker',
        'amen.dining': 'Dining area',
        'amen.diningTable': 'Dining table',
        'amen.shower': 'Shower',
        'amen.shower2': 'Standalone shower',
        'amen.toilet': 'Toilet',
        'amen.tp': 'Toilet paper',
        'amen.towels': 'Towels',
        'amen.ac': 'Individual air conditioning',
        'amen.bedding': 'Bedding',
        'amen.mosquito': 'Mosquito net',
        'amen.balcony': 'Balcony / terrace',
        'amen.gardenView': 'Garden views',
        'amen.poolView': 'Pool views',
        'amen.nosmoke': 'No smoking',
        'amen.sanitizer': 'Hand sanitizer',
        'amen.internet': 'Satellite internet',
        'amen.parking': 'Private parking',
        'amen.breakfast': 'Breakfast in the cabin with prior reservation (not included)',
        'amen.cleaning': 'Cleaning service (5 nights or more)',
        'amen.crib': 'Baby crib',

        // Detalle Loft 1
        'loft1.eyebrow': 'Loft 01 · Sámara Beach',
        'loft1.tagline': '60 m² apartment with pool, private entrance and terrace with tropical garden views.',
        'loft1.space': 'The space',
        'loft1.h2': 'Your pool among palm trees',
        'loft1.lead': 'The main highlight of this apartment is its pool. With a private entrance and air conditioning, it includes a living room, a separate bedroom and a bathroom with shower.',
        'loft1.p2': 'The fully equipped kitchen includes a refrigerator, kitchenware, microwave and toaster, so you can cook with total comfort. The loft also offers a coffee maker and tea kettle, a seating area, a dining area and a terrace with garden views.',
        'loft1.p3': 'The unit has <strong>2 double beds and 1 sofa bed</strong>, bedding and individual air conditioning.',
        'loft1.galleryH2': 'This is Loft 1',

        // Detalle Loft 2
        'loft2.eyebrow': 'Loft 02 · Sámara Beach',
        'loft2.tagline': '60 m² apartment with pool, private entrance and terrace with garden views.',
        'loft2.space': 'The space',
        'loft2.h2': 'Your pool, your hideaway',
        'loft2.lead': 'The pool is the main highlight of this apartment. With a private entrance and air conditioning, it includes a living room, a separate bedroom and a bathroom with shower.',
        'loft2.p2': 'The kitchen is fully equipped with a refrigerator, kitchenware, microwave and toaster, so you can cook with total comfort. The loft also has a coffee maker and tea kettle, a seating area, a dining area and a terrace with garden views.',
        'loft2.p3': 'The unit has <strong>2 double beds and 1 sofa bed</strong>, bedding and individual air conditioning.',
        'loft2.galleryH2': 'This is Loft 2',
        'gallery.sub': 'Click any photo to view it full size.',

        // CTA
        'cta.h2': 'Ready for your getaway?',
        'cta1.p': 'Book Loft 1 on Booking.com or message us directly for special offers.',
        'cta2.p': 'Book Loft 2 on Booking.com or message us directly for special offers.',
        'cta.book': 'Book on Booking.com',
        'cta.fb': 'Message us on Facebook',

        // Alt de imágenes
        'alt.loft1.view': 'Loft 1 — main view',
        'alt.loft2.card': 'Loft 2 — cozy space with pool',
        'alt.loft1.interior': 'Loft 1 — interior',
        'alt.loft1.detail': 'Loft 1 — detail',
        'alt.loft1.space': 'Loft 1 — space',
        'alt.loft1.garden': 'Loft 1 — garden',
        'alt.loft1.exterior': 'Loft 1 — exterior',
        'alt.loft2.interior': 'Loft 2 — interior',
        'alt.loft2.detail': 'Loft 2 — detail',
        'alt.loft2.exterior': 'Loft 2 — exterior',
        'alt.interior': 'Interior space',
        'alt.garden': 'Tropical garden',
        'alt.loft2': 'Loft 2'
    }
};

function getInitialLang() {
    let saved = null;
    try { saved = localStorage.getItem('maite-lang'); } catch (e) { /* sin almacenamiento */ }
    if (saved === 'es' || saved === 'en') return saved;
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    return nav.startsWith('es') ? 'es' : 'en';
}

let lang = getInitialLang();

const tr = (key, es) => (lang === 'en' && I18N.en[key]) ? I18N.en[key] : es;

function applyLang() {
    document.documentElement.lang = lang;
    if (typeof window.updateDirect === 'function') window.updateDirect();
    const d = I18N[lang] || null;

    // Texto plano
    $$('[data-i18n]').forEach((el) => {
        if (el.dataset.esText === undefined) el.dataset.esText = el.textContent;
        el.textContent = (d && d[el.dataset.i18n]) ? d[el.dataset.i18n] : el.dataset.esText;
    });

    // Texto con HTML interno (br, span, strong...)
    $$('[data-i18n-html]').forEach((el) => {
        if (el.dataset.esHtml === undefined) el.dataset.esHtml = el.innerHTML;
        el.innerHTML = (d && d[el.dataset.i18nHtml]) ? d[el.dataset.i18nHtml] : el.dataset.esHtml;
    });

    // Atributos (placeholder, alt, title, aria-label...)
    $$('[data-i18n-attr]').forEach((el) => {
        if (!el.dataset.esAttrs) {
            const map = {};
            el.dataset.i18nAttr.split(';').forEach((pair) => {
                const [attr, key] = pair.split(':');
                map[attr] = el.getAttribute(attr);
            });
            el.dataset.esAttrs = JSON.stringify(map);
        }
        const es = JSON.parse(el.dataset.esAttrs);
        el.dataset.i18nAttr.split(';').forEach((pair) => {
            const [attr, key] = pair.split(':');
            el.setAttribute(attr, (d && d[key]) ? d[key] : es[attr]);
        });
    });

    // Botones del selector
    $$('.lang-btn').forEach((btn) => {
        const on = btn.dataset.lang === lang;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', String(on));
    });
}

function setLang(next) {
    lang = next;
    try { localStorage.setItem('maite-lang', next); } catch (e) { /* sin almacenamiento */ }
    applyLang();
}

$$('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

applyLang();

/* ==========================================================================
   Menú móvil
   ========================================================================== */
const navToggle = $('#nav-toggle');
const navLinks = $('#nav-links');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? tr('nav.menuClose', 'Cerrar menú') : tr('nav.menu', 'Abrir menú'));
    });

    navLinks.addEventListener('click', (e) => {
        if (e.target.closest('a')) {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', tr('nav.menu', 'Abrir menú'));
        }
    });

    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/* ==========================================================================
   Header al hacer scroll
   ========================================================================== */
const header = $('#site-header');

if (header) {
    const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ==========================================================================
   Scroll suave para anclas de la misma página
   ========================================================================== */
$$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
        const target = $(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

/* ==========================================================================
   Animaciones de aparición
   ========================================================================== */
const revealEls = $$('.reveal');

if ('IntersectionObserver' in window && revealEls.length) {
    revealEls.forEach((el) => {
        const children = Array.from(el.children);
        if (children.length > 2 && el.classList.contains('mosaic')) {
            children.forEach((child, i) => child.style.setProperty('--d', `${i * 70}ms`));
        }
    });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
} else {
    revealEls.forEach((el) => el.classList.add('in-view'));
}

/* ==========================================================================
   Lightbox para galerías
   ========================================================================== */
const lightbox = $('#lightbox');
const galleryFigures = $$('.mosaic figure, .detail-gallery-grid figure');

if (lightbox && galleryFigures.length) {
    const lbImg = lightbox.querySelector('img');
    const lbCount = lightbox.querySelector('.lb-count');
    let current = 0;

    const show = (i) => {
        current = (i + galleryFigures.length) % galleryFigures.length;
        const src = galleryFigures[current].querySelector('img');
        lbImg.src = src.currentSrc || src.src;
        lbImg.alt = src.alt || tr('lb.alt', 'Foto ampliada');
        lbCount.textContent = `${current + 1} / ${galleryFigures.length}`;
    };

    const open = (i) => {
        show(i);
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        lbImg.src = '';
    };

    galleryFigures.forEach((fig, i) => {
        fig.addEventListener('click', () => open(i));
    });

    lightbox.querySelector('.lb-close').addEventListener('click', close);
    lightbox.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); show(current - 1); });
    lightbox.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); show(current + 1); });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
    });
}

/* ==========================================================================
   Formulario de contacto
   ========================================================================== */
const contactForm = $('#contact-form');
const formMessage = $('#form-message');

if (contactForm && formMessage) {
    const setMessage = (text, type) => {
        formMessage.textContent = text;
        formMessage.className = `form-message ${type}`;
    };

    const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(contactForm));

        if (!data.nombre || !data.nombre.trim()) {
            setMessage(tr('reservar.form.errNombre', 'Por favor, escribe tu nombre.'), 'error');
            return;
        }
        if (!data.email || !isValidEmail(data.email)) {
            setMessage(tr('reservar.form.errEmail', 'Por favor, escribe un email válido.'), 'error');
            return;
        }

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = tr('reservar.form.sending', 'Enviando...');
        submitBtn.disabled = true;

        // Envío real por FormSubmit → llega a cabanaslamaite@gmail.com
        try {
            const res = await fetch('https://formsubmit.co/ajax/cabanaslamaite@gmail.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    _subject: tr('reservar.form.subject', 'Nueva consulta · Cabañas la Maite'),
                    _template: 'table',
                    _captcha: 'false'
                })
            });
            if (!res.ok) throw new Error('formsubmit_error');
            setMessage(
                tr('reservar.form.ok', '¡Gracias {name}! Te contactaremos pronto para confirmar tu consulta.').replace('{name}', data.nombre.trim()),
                'success'
            );
        } catch (err) {
            setMessage(tr('reservar.form.errSend', 'Hubo un error al enviar. Escríbenos por WhatsApp o intenta de nuevo.'), 'error');
        }
        contactForm.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        setTimeout(() => {
            formMessage.className = 'form-message';
        }, 6000);
    });

    const checkIn = $('#fecha-entrada');
    const checkOut = $('#fecha-salida');

    if (checkIn && checkOut) {
        const today = new Date().toISOString().split('T')[0];
        checkIn.min = today;
        checkOut.min = today;

        checkIn.addEventListener('change', () => {
            checkOut.min = checkIn.value || today;
            if (checkOut.value && checkOut.value < checkIn.value) {
                checkOut.value = checkIn.value;
            }
        });
    }
}

/* ==========================================================================
   Reserva directa con PayPal (seña) — pago del total vía paypal.me
   CONFIGURACIÓN: tarifa fija $116/noche, % a pagar y tu enlace paypal.me
   ========================================================================== */
const BOOKING = {
    currency: 'USD',                     // dólares (cuenta PayPal en $)
    baseGuests: 2,                       // la tarifa incluye 2 personas
    minNights: 2,                        // estadía mínima (noches)
    extraGuestFee: 10,                   // $ por persona adicional por noche
    // Tarifa fija: $116/noche por 2 personas, todo el año
    seasons: [
        { from: '01-01', to: '12-31', rate: 116 }   // tarifa fija
    ],
    // Eventos puntuales con fecha completa (YYYY-MM-DD) — tienen prioridad sobre seasons
    events: [
        { from: '2027-03-21', to: '2027-03-28', rate: 130.5 }   // Semana Santa 2027: $130,50/noche
    ],
    depositPct: 100,                     // % a pagar al reservar (100 = pago total)
    paypalMeUser: 'cabanaslamait'        // tu enlace: paypal.me/cabanaslamait
};

function rateForDate(date) {
    // 1) Eventos puntuales (fecha completa YYYY-MM-DD), ej. Semana Santa
    const full = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    for (const ev of (BOOKING.events || [])) {
        const f = parseInt(ev.from.replace(/-/g, ''), 10);
        const t = parseInt(ev.to.replace(/-/g, ''), 10);
        if (full >= f && full <= t) return ev.rate;
    }
    // 2) Temporadas recurrentes (MM-DD)
    const v = (date.getMonth() + 1) * 100 + date.getDate();
    for (const s of BOOKING.seasons) {
        const f = parseInt(s.from.slice(0, 2), 10) * 100 + parseInt(s.from.slice(3), 10);
        const t = parseInt(s.to.slice(0, 2), 10) * 100 + parseInt(s.to.slice(3), 10);
        if (f <= t) {
            if (v >= f && v <= t) return s.rate;
        } else if (v >= f || v <= t) {
            return s.rate; // la temporada cruza el año nuevo
        }
    }
    return BOOKING.seasons.length ? BOOKING.seasons[0].rate : 0;
}

const directLoft = $('#direct-loft');
const directGuests = $('#direct-guests');
const directIn = $('#direct-in');
const directOut = $('#direct-out');
const directRate = $('#direct-rate');
const directNights = $('#direct-nights');
const directTotal = $('#direct-total');
const directDeposit = $('#direct-deposit');
const directDepositLabel = $('#direct-deposit-label');
const directPay = $('#direct-pay');
const directFeeNote = $('#direct-fee-note');

const fmtUSD = (n) => '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

if (directLoft && directGuests && directIn && directOut && directPay) {
    const addDays = (iso, days) => {
        const d = new Date(iso);
        d.setUTCDate(d.getUTCDate() + days);
        return d.toISOString().slice(0, 10);
    };

    const updateDirect = () => {
        const label = directDepositLabel;
        label.textContent = BOOKING.depositPct >= 100
            ? tr('direct.totalPay', 'Pago total')
            : `${tr('direct.deposit', 'Seña')} (${BOOKING.depositPct}%)`;

        const guests = Math.max(1, parseInt(directGuests.value, 10) || BOOKING.baseGuests);
        directFeeNote.textContent = `${tr('direct.feeNote', 'Tarifa para 2 personas')} · ${tr('direct.extra', 'persona adicional')} ${fmtUSD(BOOKING.extraGuestFee)}`;

        const nights = directIn.value && directOut.value
            ? Math.round((new Date(directOut.value) - new Date(directIn.value)) / 86400000)
            : 0;
        const hasDates = nights >= BOOKING.minNights;

        let total = 0;
        let n = 0;
        const ratesSeen = [];
        const extraFee = Math.max(0, guests - BOOKING.baseGuests) * BOOKING.extraGuestFee;

        if (hasDates) {
            const d = new Date(directIn.value);
            const end = new Date(directOut.value);
            while (d < end) {
                const r = rateForDate(d) + extraFee;
                total += r;
                if (!ratesSeen.includes(r)) ratesSeen.push(r);
                n += 1;
                d.setDate(d.getDate() + 1);
            }
        }

        // Precio por noche: con fechas → tarifa exacta; sin fechas → rango de temporadas
        if (hasDates) {
            directRate.textContent = ratesSeen.length === 1
                ? fmtUSD(ratesSeen[0])
                : `${fmtUSD(Math.min(...ratesSeen))}–${fmtUSD(Math.max(...ratesSeen))}`;
        } else {
            const rates = [...BOOKING.seasons.map((s) => s.rate), ...(BOOKING.events || []).map((e) => e.rate)];
            directRate.textContent = rates.length === 1
                ? fmtUSD(rates[0])
                : (rates.length ? `${fmtUSD(Math.min(...rates))}–${fmtUSD(Math.max(...rates))}` : '—');
        }

        const deposit = total * BOOKING.depositPct / 100;

        if (hasDates) {
            directNights.textContent = `${n} ${n === 1 ? tr('direct.night', 'noche') : tr('direct.nights', 'noches')}`;
            directTotal.textContent = fmtUSD(total);
            directDeposit.textContent = BOOKING.depositPct >= 100
                ? fmtUSD(total)
                : `${fmtUSD(deposit)} (${BOOKING.depositPct}%)`;
        } else if (nights > 0) {
            directNights.textContent = String(nights);
            directTotal.textContent = tr('direct.minNights', 'Mínimo 2 noches');
            directDeposit.textContent = '—';
        } else {
            directNights.textContent = '—';
            directTotal.textContent = tr('direct.selectDates', 'Elige tus fechas');
            directDeposit.textContent = '—';
        }

        // El botón de pago solo se habilita con fechas válidas y paypal.me configurado
        const paypalReady = BOOKING.paypalMeUser && !String(BOOKING.paypalMeUser).startsWith('TU_');
        if (!hasDates || !paypalReady) {
            directPay.removeAttribute('href');
            directPay.classList.add('disabled');
        } else {
            directPay.setAttribute('href', `https://www.paypal.me/${BOOKING.paypalMeUser}/${deposit.toFixed(2)}`);
            directPay.classList.remove('disabled');
        }
    };

    window.updateDirect = updateDirect;

    const today = new Date().toISOString().split('T')[0];
    directIn.min = today;
    directOut.min = addDays(today, BOOKING.minNights);

    directLoft.addEventListener('change', updateDirect);
    directGuests.addEventListener('input', updateDirect);
    directIn.addEventListener('change', () => {
        directOut.min = directIn.value ? addDays(directIn.value, BOOKING.minNights) : addDays(today, BOOKING.minNights);
        updateDirect();
    });
    directOut.addEventListener('change', updateDirect);

    updateDirect();
}

console.log('Cabañas la Maite · sitio cargado 🌴');

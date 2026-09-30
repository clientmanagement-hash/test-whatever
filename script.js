/* ==========================================================================
   Cabañas La Maite — comportamiento del sitio + i18n ES/EN
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
        'nav.faq': 'FAQ',
        'nav.reservar': 'Book',
        'nav.menu': 'Open menu',
        'nav.menuClose': 'Close menu',

        // Hero
        'hero.tagline': 'A beach refuge: serene and cozy, just a few minutes from Buena Vista and Sámara beaches. Lofts with pool, tropical garden and everything you need to unwind.',
        'oficial.text': '<strong>cabanaslamaite.com is the official website of Cabañas La Maite</strong> (also written <strong>Cabañas Lamaite</strong> or <strong>Cabañas La Maite Sámara</strong>), an accommodation of two lofts with a pool in Playa Sámara, Guanacaste, Costa Rica. Here you can check real availability, up-to-date rates and <strong>book directly with us</strong>, with no middleman fees.',
        'hero.seeLofts': 'See the lofts',
        'hero.rating': 'Exceptional · 155 reviews',
        'hero.scroll': 'Scroll',
        'hero.scrollAria': 'Scroll to the next section',

        // Franja de datos
        'stat.1.label': 'from Buena Vista Beach',
        'stat.2.strong': 'Pool',
        'stat.2.label': '',
        'stat.3.label': 'Exceptional · 155 reviews',
        'stat.4.strong': 'A 1.6 km',
        'stat.4.label': 'from Sámara Beach',

        // Sección lofts
        'lofts.eyebrow': 'Our lofts',
        'lofts.title': 'Two spaces, <span class="text-green">one calm</span>',
        'lofts.sub': 'Self-contained apartments with private entrance, air conditioning, equipped kitchen and a pool among palm trees.',
        'loft1.title': 'Loft 1<br>Garden and pool',
        'loft2.title': 'Loft 2<br>Garden and pool',
        'loft.desc': 'Pool, garden and terrace.',
        'loft.price': 'From <strong>$110</strong> per night',
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
        'galeria.sub': 'Pool, tropical gardens and the best beaches minutes away. This is what staying at Cabañas La Maite feels like.',

        // Desayuno
        'desayuno.eyebrow': 'Extra service',
        'desayuno.title': 'Start your day with a typical Costa Rican breakfast',
        'desayuno.p': 'Enjoy an authentic typical Costa Rican breakfast, prepared at the cabins with prior reservation. Gallo pinto, eggs, fresh fruit and local coffee: the perfect way to start the day before heading to the beach.',
        'desayuno.price': '<strong>$11</strong> per person, per night · added to your booking',
        'desayuno.li1': 'With prior reservation',
        'desayuno.li2': 'Served at your cabin',
        'desayuno.li3': 'You can add it when booking',
        'desayuno.cta': 'Book with breakfast',

        // Paella        'paella.eyebrow': 'Extra service',
        'paella.title': 'Paella for lunch or dinner',
        'paella.sub': 'We prepare paella to order, to enjoy at your cabin. Choose your favourite and we cook it for you.',
        'paella.t1': '🥗 Vegetarian',
        'paella.t2': '🦐 Seafood',
        'paella.t3': '🥩 Meat',
        'paella.t4': '🍤 Mixed',
        'paella.price': '<strong>$18</strong> per person · minimum 2 people · includes bread',
        'paella.note': 'With prior reservation. Arrange it on WhatsApp when confirming your booking.',
        'paella.cta': 'Order paella on WhatsApp',
        'alt.paellaSeafood': 'Seafood paella',
        'alt.paellaMeat': 'Meat paella',

        // Políticas y condiciones
        'pol.back': '← Back to home',
        'pol.eyebrow': 'Important information',
        'pol.title': 'Policies and conditions',
        'pol.tagline': 'Cancellation policy and stay conditions at Cabañas La Maite.',
        'pol.cancel.title': 'Cancellation policy',
        'pol.cancel.lead': 'We want you to book with peace of mind. These are the conditions if you need to cancel your booking.',
        'pol.cancel.h1': 'Flexible – 5 days (General)',
        'pol.cancel.p1': 'The guest may cancel their booking free of charge up to 5 days before the arrival date. In this case, 100% of the amount paid will be refunded, regardless of whether payment was made by credit/debit card or PayPal.',
        'pol.cancel.p2': 'If the guest cancels within the 5 days prior to the arrival date, they must pay 100% of the total booking amount.',
        'pol.cancel.p3': 'In case of no-show, 100% of the total booking amount will still be charged.',
        'pol.cancel.h2': 'Refunds',
        'pol.cancel.p4': 'Refunds will be made, whenever possible, using the same payment method used to make the booking.',
        'pol.cancel.p5': 'Refunds are subject to the terms and timelines of the payment provider used. If the card-issuing bank or financial institution applies any charge directly related to receiving or processing the refund, that charge is the guest\'s responsibility and may be deducted from the amount to be refunded.',
        'pol.cancel.p6': 'Refunds made via PayPal are subject to the terms and timelines established by PayPal.',
        'pol.cancel.h3': 'How to cancel',
        'pol.cancel.p7': 'Message us on WhatsApp at <strong>+506 8306 3336</strong> or email <strong>cabanaslamaite@gmail.com</strong> with your name and booking dates. We will confirm through the same channel.',
        'pol.stay.title': 'Accommodation conditions',
        'pol.stay.h1': 'Children',
        'pol.stay.li1': 'Children of any age are allowed.',
        'pol.stay.li2': 'Children aged 2 and under stay free and do not take up a place within the maximum of 5 people.',
        'pol.stay.li3b': 'Children aged 3 and over are charged as a person (including the extra-person surcharge and breakfast if requested). Each child\'s age must be provided when booking.',
        'pol.stay.li3': 'Cribs are available free of charge, subject to availability.',
        'pol.stay.li4': 'Extra beds are subject to availability and may have an additional cost.',
        'pol.stay.h2': 'Pets',
        'pol.stay.li5': 'Pets are not allowed on the premises.',
        'pol.stay.h3': 'Check-in and check-out',
        'pol.stay.li6': 'Check-in: from 3:00 p.m.',
        'pol.stay.li7': 'Check-out: until 11:00 a.m.',
        'pol.stay.li8': 'Check-in is fully automatic, so guests can check in on their own from 3:00 p.m., following the instructions provided before their arrival.',
        'pol.stay.li9': 'Check-out after 11:00 a.m. is subject to availability and may incur an additional charge.',
        'pol.stay.h4': 'Smoking policy',
        'pol.stay.li10': 'Smoking is not allowed inside the rooms or in the indoor or common areas of the property.',
        'pol.stay.li11': 'Smoking is only allowed in the designated smoking area located in the parking lot.',
        'pol.stay.li12': 'Failure to comply with this policy may result in an additional charge for cleaning and/or treatment of the room.',
        'pol.stay.h5': 'Noise and parties',
        'pol.stay.li13': 'Parties, events or gatherings that may disturb other guests are not allowed.',
        'pol.stay.li14': 'A moderate noise level must be maintained, especially during rest hours.',
        'pol.stay.li15': 'The property reserves the right to ask guests to reduce noise when necessary.',
        'pol.stay.h6': 'Occupancy and visitors',
        'pol.stay.li16': 'Only the people included in the reservation may stay in the room.',
        'pol.stay.li17': 'Any external visitor must be registered and previously authorised by the property.',
        'pol.stay.li18': 'Exceeding the maximum occupancy of the room is not allowed.',
        'pol.stay.h7': 'Use of the facilities',
        'pol.stay.li19': 'Guests must use the facilities, furniture and equipment of the property responsibly.',
        'pol.stay.li20': 'Any damage caused to the property, furniture, equipment or facilities may be charged to the responsible guest.',
        'pol.stay.li21': 'Removing furniture, bed linen, towels or other items from the rooms without authorisation is not allowed.',
        'pol.stay.h8': 'Safety',
        'pol.stay.li22': 'Guests are responsible for their personal belongings. The property is not responsible for valuables left unattended.',
        'pol.stay.li23': 'Room doors must remain closed when guests are away from the room.',
        'pol.cta.p': 'Do you have questions about these policies?',
        'pol.cta.btn': 'Message us on WhatsApp',
        'footer.politicas': 'Policies and conditions',
        'direct.policies': 'By booking you accept our cancellation policy and stay conditions',
        'pol.modalTitle': 'Policies and conditions',
        'pol.loading': 'Loading…',
        'pol.loadErr': 'Could not load the policies.',
        'pol.openFull': 'Open in a full page',

        // Preguntas frecuentes
        'faq.eyebrow': 'Frequently asked questions',
        'faq.title': 'Everything you need to know',
        'faq.sub': 'Quick answers about the accommodation, rates, location and policies.',
        'faq.q1': 'Where is Cabañas La Maite located?',
        'faq.a1': 'Cabañas La Maite is in <strong>Sámara, Nicoya, Guanacaste, Costa Rica</strong> (Plus Code VFH4+X8; coordinates 9.8799882, -85.5441426). It is <strong>900 m from Playa Buena Vista</strong> and <strong>1.6 km from Playa Sámara</strong>.',
        'faq.q2': 'How far is it from the beach?',
        'faq.a2': '<strong>900 metres from Playa Buena Vista</strong> (about a 10-12 minute walk) and <strong>1.6 km from Playa Sámara</strong>, one of the most beautiful and safest beaches in Costa Rica, ideal for swimming.',
        'faq.q3': 'How many people fit in each loft?',
        'faq.a3': 'Each loft sleeps up to <strong>5 people</strong>. The base rate includes 2 people; each extra person has a nightly cost (the 3rd and 4th add $10 each, the 5th $5).',
        'faq.q4': 'What beds does each loft have?',
        'faq.a4': 'Both lofts have 2 double beds and 1 sofa bed, plus bed linen and individual air conditioning.',
        'faq.q5': 'Is the pool private?',
        'faq.a5': 'The pool is shared between the two lofts and is surrounded by a tropical garden. Each loft has its own private entrance and terrace.',
        'faq.q6': 'Do the lofts have air conditioning, a kitchen and wifi?',
        'faq.a6': 'Yes. Each loft includes individual air conditioning, a fully equipped kitchen (refrigerator, microwave, utensils, coffee maker), satellite internet, a terrace and a private bathroom with shower.',
        'faq.q7': 'How much is one night?',
        'faq.a7': 'For 2 people: <strong>$119 per night</strong> in high season (January, February, March, April, July, August and December) and <strong>$110 per night</strong> in low season (May, June, September, October and November). Each extra person costs $10 (3rd and 4th) and $5 (the 5th).',
        'faq.q8': 'Are there special rates for Christmas, New Year or Easter?',
        'faq.a8': 'Yes. From 24 to 28 December the rate is $170 per night; from 29 December to 1 January, $210; from 2 to 4 January, $170; and from 5 to 10 January, $140. At Easter (21 to 28 March 2027) the rate is $135 per night.',
        'faq.q9': 'What is the minimum stay?',
        'faq.a9': 'The general minimum stay is 2 nights. As an exception, if only one night is left available between two bookings on the calendar, that night can be booked on its own.',
        'faq.q10': 'Can I pay by credit or debit card?',
        'faq.a10': 'Yes. You can pay 100% when booking with a credit or debit card, without needing a PayPal account. Costa Rican guests can also pay by SINPE Móvil by arranging it on WhatsApp.',
        'faq.q11': 'How much do I pay when booking?',
        'faq.a11': 'You pay 100% of the total when you book. Once payment is complete you will receive an automatic confirmation email.',
        'faq.q12': 'Do you offer breakfast?',
        'faq.a12': 'Yes, we offer a <strong>typical Costa Rican breakfast</strong> (gallo pinto, eggs, fresh fruit and local coffee) for <strong>$11 per person per night</strong>, with prior reservation. You can add it when booking or arrange it on WhatsApp.',
        'faq.q13': 'Do you serve lunch or dinner?',
        'faq.a13': 'We prepare <strong>paella</strong> for lunch or dinner with prior reservation: vegetarian, seafood, meat or mixed. It costs <strong>$18 per person</strong>, minimum 2 people, and includes bread. It is ordered on WhatsApp.',
        'faq.q14': 'What time are check-in and check-out?',
        'faq.a14': 'Check-in is from 3:00 p.m. and is fully automatic: you can let yourself in following the instructions we send you before arrival. Check-out is until 11:00 a.m.',
        'faq.q15': 'Are children allowed?',
        'faq.a15': 'Yes, children of any age are allowed. <strong>Children aged 2 and under stay free</strong> and do not take up a place within the maximum of 5 people. <strong>From age 3 they are charged as a person</strong>, with the extra-person surcharge and breakfast if chosen. Cribs are available at no cost subject to availability. When booking you only need to enter each child\'s age and the system applies the price automatically.',
        'faq.q16': 'Are pets allowed?',
        'faq.a16': 'No, pets are not allowed on the premises.',
        'faq.q17': 'Is smoking allowed?',
        'faq.a17': 'Smoking is not allowed inside the rooms or in the indoor or common areas. It is only allowed in the designated smoking area in the parking lot.',
        'faq.q18': 'What is the cancellation policy?',
        'faq.a18': 'It is <strong>flexible</strong>: you can cancel free of charge up to <strong>5 days before</strong> arrival and 100% of the amount paid is refunded. If you cancel within the 5 days prior, or do not show up, 100% of the booking is charged.',
        'faq.q19': 'Is there parking?',
        'faq.a19': 'Yes, each loft has private parking on the property.',
        'faq.q20': 'How do I book directly with you?',
        'faq.a20': 'You can book right here on the page: choose loft, dates, number of guests and pay by card. You can also message us on <strong>WhatsApp at +506 8306 3336</strong> or email <strong>cabanaslamaite@gmail.com</strong>.',
        'faq.policies': 'See all policies and conditions',
        'faq.teaserTitle': 'Any questions before booking?',
        'faq.teaserSub': 'Seasonal rates, distances to the beaches, children, breakfast, paella package, check-in, payment methods and cancellation policy.',
        'faq.verTodas': 'See all the answers',
        'faq.ctaReservar': 'Book now',
        'faqp.back': '← Back to home',

        // Ubicación
        'ubicacion.eyebrow': 'Location',
        'ubicacion.title': 'Sámara Beach, <span class="text-green">one of the best in the Pacific</span>',
        'ubicacion.sub': 'White sand, gentle waves and unforgettable sunsets. We are 1.6 km from the sea, in one of the most beautiful and safest beaches in Costa Rica.',
        'ubicacion.h1': '900 m from Buena Vista Beach',
        'ubicacion.h1b': '1.6 km from Sámara Beach',
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
        'reservar.form.subject': 'New enquiry · Cabañas La Maite',
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
        'direct.sinpe': 'For <strong>Costa Ricans</strong>: we accept payments via <strong>SINPE Móvil</strong> to <strong>+506 8306 3336</strong>. Make the transfer and send us the receipt on WhatsApp to confirm your booking.',
        'direct.sinpeBtn': 'Send receipt via WhatsApp',
        'direct.note': 'The booking is confirmed once payment is received. You can pay with credit or debit card, no PayPal account needed.',
        'direct.night': 'night',
        'direct.nights': 'nights',
        'direct.selectDates': 'Select your dates',
        'direct.selectIn': 'Select check-in date',
        'direct.selectOut': 'Select check-out date',
        'direct.unavailable': 'Dates unavailable',
        'direct.minNights': 'Minimum 2 nights',
        'direct.orphanOk': 'Last available night — 1-night stay allowed',
        'direct.smartErr': 'Choose valid dates to calculate the amount.',
        'direct.formName': 'Please enter your name to continue.',
        'direct.formEmail': 'Please enter a valid email to receive your confirmation.',
        'direct.payOk': 'Payment received! Your booking is confirmed. We will contact you to arrange the details.',
        'direct.payCancel': 'Payment cancelled. You can try again anytime.',
        'direct.payErr': 'There was an error with the payment. Try again or message us on WhatsApp.',
        'direct.payUnavailable': 'Online payment is available on the published site.',
        'direct.maxNights': 'Maximum stay is 60 nights.',
        'direct.maxGuests': 'Maximum 5 guests.',
        'paypal.item': 'Deposit · Cabañas La Maite',
        'direct.guests': 'Guests',
        'direct.adults': 'Adults',
        'direct.kidsLabel': 'Children',
        'direct.kidsAges': 'Age of each child',
        'direct.kidsNote': 'Children aged 2 and under stay free. From age 3 they are charged as a person.',
        'direct.kidN': 'Child',
        'direct.years': 'years',
        'direct.year1': '1 year',
        'direct.free': 'Free',
        'direct.pays': 'Pays',
        'direct.kidsFreeShort': 'child(ren) free',
        'direct.kidsPaidShort': 'child(ren) as a person',
        'direct.guestTotal': 'Total',
        'direct.persons': 'people',
        'direct.person1': 'person',
        'direct.adultsLower': 'adult(s)',
        'direct.kidsPayingLower': 'child(ren) aged 3+ who pay',
        'direct.kidsFreeLower': 'child(ren) aged 2 and under (free)',
        'direct.guestPaying': 'Charged for',
        'direct.overCap': 'Exceeds the maximum of 5',
        'direct.promo': 'Do you have a promo code?',
        'direct.promoApply': 'Apply',
        'direct.promoChecking': 'Checking…',
        'direct.promoOk': 'Code applied',
        'direct.perNight': 'per night',
        'direct.promoUsed': 'This code has already been used.',
        'direct.promoExpired': 'This code has expired.',
        'direct.promoBad': 'Invalid code.',
        'direct.promoErr': 'Could not check the code. Please try again.',
        'direct.promoFlat': 'flat rate',
        'direct.promoPlusExtras': 'plus per-person extras',
        'direct.promoMaxShort': 'max.',
        'direct.promoOverGuests': 'This code is for a maximum of',
        'direct.promoMaxGuests': 'El código es para máximo 4 personas.',
        'direct.name': 'Name *',
        'direct.email': 'Email *',
        'direct.phone': 'Phone / WhatsApp',
        'direct.feeNote': 'Rate for 2 people',
        'direct.extra': 'extra person',
        'direct.extra5': '3rd-4th person',
        'direct.extra6': '5th person',
        'direct.bfast': 'Breakfast',
        'direct.bfastPer': 'per person/night',
        'direct.breakfast': 'Typical Costa Rican breakfast',

        // Footer
        'footer.brand': 'Lofts with pool, 900 m from Buena Vista Beach and 1.6 km from Sámara Beach. Relaxing, welcoming beach style in Sámara, Costa Rica.',
        'footer.explorar': 'Explore',
        'footer.contacto': 'Contact',
        'footer.oficiales': 'Official site',
        'footer.esteSitio': 'This is our official website',
        'footer.mejorPrecio': 'Best price, book direct',
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
        'amen.internet': 'Satellite internet',
        'amen.parking': 'Private parking',
        'amen.breakfast': 'Typical Costa Rican breakfast with prior reservation (not included)',
        'amen.paella': 'Paella (vegetarian, seafood, meat or mixed) with prior reservation',
        'amen.cleaning': 'Cleaning service (5 nights or more)',
        'amen.crib': 'Baby crib',

        // Detalle Loft 1
        'loft1.eyebrow': 'Loft 01 · Sámara Beach',
        'loft1.tagline': '60 m² apartment with pool, private entrance and terrace with tropical garden views.',
        'loft1.space': 'The space',
        'loft1.h2': 'Your pool among palm trees',
        'loft1.lead': 'The main highlight of this apartment is its pool and garden view. With a private entrance and air conditioning, it includes a living room, kitchen and private bathroom with shower.',
        'loft1.lead2': 'The fully equipped kitchen includes a refrigerator, kitchen utensils and a microwave, so you can cook with total comfort. The loft also offers a coffee maker, seating area, dining area and a terrace with garden views.',
        'loft1.p2': 'The fully equipped kitchen includes a refrigerator, kitchenware, microwave and toaster, so you can cook with total comfort. The loft also offers a coffee maker and tea kettle, a seating area, a dining area and a terrace with garden views.',
        'loft1.p3': 'The unit has <strong>2 double beds and 1 sofa bed</strong>, bedding and individual air conditioning.',
        'loft1.galleryH2': 'This is Loft 1',

        // Detalle Loft 2
        'loft2.eyebrow': 'Loft 02 · Sámara Beach',
        'loft2.tagline': '60 m² apartment with pool, private entrance and terrace with garden views.',
        'loft2.space': 'The space',
        'loft2.h2': 'Your pool, your hideaway',
        'loft2.lead': 'Enjoy a spacious and cozy space with a loft-style feel, where the pool and garden views take center stage. The unit has a private entrance, air conditioning and an open design that comfortably integrates the sleeping, living, dining and kitchen areas.',
        'loft2.p2': 'The kitchen is fully equipped with a refrigerator, microwave, toaster and kitchen utensils, plus a coffee maker, so you can prepare and enjoy your meals during your stay. It also has a private bathroom with shower and a terrace with garden views.',
        'loft2.p3': 'The loft has <strong>2 double beds and 1 sofa bed</strong>, bedding and individual air conditioning.',
        'loft2.galleryH2': 'This is Loft 2',
        'gallery.sub': 'Click any photo to view it full size.',

        // CTA
        'cta.h2': 'Ready for your getaway?',
        'cta1.p': 'Book Loft 1 directly with us, or message us for special offers.',
        'cta2.p': 'Book Loft 2 directly with us, or message us for special offers.',
        'cta.book': 'Book direct',
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
        'alt.experience': 'The experience',
        'alt.breakfast': 'Breakfast',
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

const i18nDynamicFns = [];
const registerDynamic = (fn) => i18nDynamicFns.push(fn);

function applyLang() {
    document.documentElement.lang = lang;
    i18nDynamicFns.forEach((fn) => fn());
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

        // Envío a través del servidor (/api/contact), que reenvía por FormSubmit
        // (FormSubmit exige las cabeceras Origin/Referer, que el navegador no puede fijar)
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('contact_error');
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
   Carrusel de fotos en las tarjetas de lofts (página principal)
   ========================================================================== */
document.querySelectorAll('.loft-carousel').forEach((car) => {
    const track = car.querySelector('.carousel-track');
    const imgs = track ? Array.from(track.children) : [];
    const prevBtn = car.querySelector('.carousel-prev');
    const nextBtn = car.querySelector('.carousel-next');
    const dotsWrap = car.querySelector('.carousel-dots');
    if (!track || imgs.length < 2 || !prevBtn || !nextBtn || !dotsWrap) return;

    const total = imgs.length;
    const dots = [];
    let idx = 0;

    const go = (i) => {
        idx = (i + total) % total;
        track.style.transform = 'translateX(-' + (idx * 100) + '%)';
        dots.forEach((d, k) => d.classList.toggle('active', k === idx));
    };

    for (let i = 0; i < total; i++) {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'carousel-dot';
        d.setAttribute('aria-label', 'Foto ' + (i + 1));
        d.addEventListener('click', () => go(i));
        dotsWrap.appendChild(d);
        dots.push(d);
    }

    prevBtn.addEventListener('click', () => go(idx - 1));
    nextBtn.addEventListener('click', () => go(idx + 1));

    // Deslizar con el dedo (móvil)
    let startX = null;
    track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
        if (startX == null) return;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
        startX = null;
    }, { passive: true });

    go(0);
});

/* ==========================================================================
   Pago con PayPal (Smart Buttons + Vercel Functions)
   El SDK se carga dinámicamente con el client id del entorno (sandbox/live).
   El monto se calcula en el widget y se envía al backend al crear la orden.
   ========================================================================== */
const paypalContainer = $('#paypal-hosted-container');
const payStatus = $('#direct-pay-status');

const setPayStatus = (text, type) => {
    if (!payStatus) return;
    payStatus.textContent = text;
    payStatus.className = `direct-pay-status ${type}`;
};

function loadPayPalSdk(clientId, currency) {
    return new Promise((resolve, reject) => {
        if (window.paypal && window.paypal.Buttons) return resolve(window.paypal);
        const s = document.createElement('script');
        s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&components=buttons&currency=${encodeURIComponent(currency)}`;
        s.onload = () => resolve(window.paypal);
        s.onerror = () => reject(new Error('sdk_failed'));
        document.head.appendChild(s);
    });
}

const payErrorMsg = (code) => {
    const map = {
        invalid_dates: tr('direct.selectDates', 'Elige tus fechas'),
        min_nights: tr('direct.minNights', 'Mínimo 2 noches'),
        too_long: tr('direct.maxNights', 'La estadía máxima es de 60 noches.'),
        too_many_guests: tr('direct.maxGuests', 'Máximo 5 huéspedes.'),
        promo_not_found: tr('direct.promoBad', 'Código no válido.'),
        promo_used: tr('direct.promoUsed', 'Este código ya fue utilizado.'),
        promo_expired: tr('direct.promoExpired', 'Este código ha caducado.'),
        promo_max_guests: tr('direct.promoMaxGuests', 'El código es para máximo 4 personas.'),
        invalid_property: tr('direct.selectDates', 'Elige tus fechas'),
        dates_unavailable: tr('direct.unavailable', 'Fechas no disponibles'),
        paypal_not_configured: tr('direct.payUnavailable', 'El pago en línea está disponible en el sitio publicado.')
    };
    return map[code] || tr('direct.payErr', 'Hubo un error con el pago. Inténtalo de nuevo o escríbenos por WhatsApp.');
};

async function initPayPal() {
    if (!paypalContainer) return;
    try {
        const res = await fetch('/api/paypal/config');
        if (!res.ok) throw new Error('config_failed');
        const cfg = await res.json();
        if (!cfg.clientId) throw new Error('no_client_id');

        // El servidor es la autoridad de precios: sobrescribe la copia local para mostrar
        if (cfg.pricing) {
            Object.assign(BOOKING, cfg.pricing);
            i18nDynamicFns.forEach((fn) => fn());
        }

        const paypal = await loadPayPalSdk(cfg.clientId, cfg.currency || 'USD');

        paypal.Buttons({
            style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
            createOrder: async () => {
                if (!lastBooking) {
                    setPayStatus(tr('direct.smartErr', 'Elige fechas válidas para calcular el monto.'), 'error');
                    throw new Error('no_booking');
                }
                // Validar nombre y email del cliente (necesarios para confirmar la reserva)
                const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lastBooking.email || '');
                if (!lastBooking.name) {
                    setPayStatus(tr('direct.formName', 'Escribe tu nombre para continuar.'), 'error');
                    throw new Error('missing_name');
                }
                if (!validEmail) {
                    setPayStatus(tr('direct.formEmail', 'Escribe un email válido para recibir tu confirmación.'), 'error');
                    throw new Error('missing_email');
                }
                const r = await fetch('/api/paypal/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(lastBooking)
                });
                const d = await r.json();
                if (!r.ok || !d.id) {
                    setPayStatus(payErrorMsg(d && d.error), 'error');
                    throw new Error('create_failed');
                }
                return d.id;
            },
            onApprove: async (data) => {
                try {
                    const r = await fetch('/api/paypal/capture-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderID: data.orderID, propertyId: lastBooking ? lastBooking.propertyId : '', checkIn: lastBooking ? lastBooking.checkIn : '', checkOut: lastBooking ? lastBooking.checkOut : '', guest: lastBooking ? lastBooking.guests : '', name: lastBooking ? lastBooking.name : '', email: lastBooking ? lastBooking.email : '', phone: lastBooking ? lastBooking.phone : '', breakfast: lastBooking ? Boolean(lastBooking.breakfast) : false })
                    });
                    const d = await r.json();
                    if (r.ok && d.success) {
                        setPayStatus(tr('direct.payOk', '¡Pago recibido! Tu reserva está confirmada. Te contactaremos para coordinar los detalles.'), 'success');
                    } else {
                        setPayStatus(tr('direct.payErr', 'Hubo un error con el pago. Inténtalo de nuevo o escríbenos por WhatsApp.'), 'error');
                    }
                } catch (e) {
                    setPayStatus(tr('direct.payErr', 'Hubo un error con el pago. Inténtalo de nuevo o escríbenos por WhatsApp.'), 'error');
                }
            },
            onCancel: () => {
                setPayStatus(tr('direct.payCancel', 'Pago cancelado. Puedes intentarlo de nuevo cuando quieras.'), 'error');
            },
            onError: () => {
                setPayStatus(tr('direct.payErr', 'Hubo un error con el pago. Inténtalo de nuevo o escríbenos por WhatsApp.'), 'error');
            }
        }).render('#paypal-hosted-container');
        paypalContainer.classList.add('ready');
    } catch (e) {
        setPayStatus(tr('direct.payUnavailable', 'El pago en línea está disponible en el sitio publicado.'), 'error');
    }
}

initPayPal();

/* ==========================================================================
   Disponibilidad (iCal): bloquea fechas ya reservadas (propias o externas)
   ========================================================================== */
let availability = null;

async function loadAvailability() {
    try {
        const r = await fetch('/api/ical/admin?public=1');
        if (r.ok) {
            availability = await r.json();
            // Recalcula el widget ahora que hay datos de disponibilidad
            i18nDynamicFns.forEach((fn) => fn());
        }
    } catch (e) { /* sin backend: el widget funciona igual */ }
}

function datesBlocked(propertyId, checkIn, checkOut) {
    if (!availability || !availability.properties || !availability.properties[propertyId]) return false;
    const aIn = Date.parse(checkIn);
    const aOut = Date.parse(checkOut);
    if (!Number.isFinite(aIn) || !Number.isFinite(aOut)) return false;
    for (const b of availability.properties[propertyId].blocked) {
        const bIn = Date.parse(b.checkIn);
        const bOut = Date.parse(b.checkOut);
        if (aIn < bOut && bIn < aOut) return true; // solapamiento de noches
    }
    return false;
}

// ¿La noche `nightIso` es huérfana? (1 sola noche libre entre dos periodos ocupados)
// Solo estas se pueden reservar por 1 noche aunque el mínimo general sea 2.
function isOrphanNight(propertyId, nightIso) {
    if (!availability || !availability.properties || !availability.properties[propertyId]) return false;
    const list = availability.properties[propertyId].orphanNights;
    if (!list || !list.length) return false;
    const s = String(nightIso).slice(0, 10);
    return list.indexOf(s) !== -1;
}

// ¿El rango es exactamente una noche huérfana?
function isOrphanStay(propertyId, checkIn, checkOut) {
    const aIn = Date.parse(checkIn);
    const aOut = Date.parse(checkOut);
    if (!Number.isFinite(aIn) || !Number.isFinite(aOut)) return false;
    if (Math.round((aOut - aIn) / 86400000) !== 1) return false;
    return isOrphanNight(propertyId, checkIn);
}

loadAvailability();

/* ==========================================================================
   Modal de políticas y condiciones (se carga desde politicas.html)
   ========================================================================== */
const polModal = $('#pol-modal');
const polBody = $('#pol-modal-body');
const polOpen = $('#open-policies');
const polClose = $('#pol-modal-close');
let polLoaded = false;

async function loadPolicies() {
    if (!polBody) return;
    if (polLoaded) return;
    try {
        const r = await fetch('politicas.html');
        if (!r.ok) throw new Error('http');
        const html = await r.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const blocks = doc.querySelectorAll('.politicas-block');
        if (!blocks.length) throw new Error('empty');
        polBody.innerHTML = Array.prototype.map.call(blocks, (b) => b.outerHTML).join('');
        polLoaded = true;
        applyLang(); // traduce el contenido recién insertado
    } catch (e) {
        // si falla la carga, se ofrece el enlace a la página completa
        polBody.innerHTML = '<p data-i18n="pol.loadErr">No se pudieron cargar las políticas.</p>';
        applyLang();
    }
}

function openPolicies() {
    if (!polModal) return;
    polModal.classList.add('open');
    polModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    loadPolicies();
}

function closePolicies() {
    if (!polModal) return;
    polModal.classList.remove('open');
    polModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

if (polModal && polOpen) {
    polOpen.addEventListener('click', openPolicies);
    if (polClose) polClose.addEventListener('click', closePolicies);
    polModal.addEventListener('click', (e) => {
        if (e.target === polModal) closePolicies();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && polModal.classList.contains('open')) closePolicies();
    });
}

/* ==========================================================================
   Reserva directa con PayPal (seña) — pago del total vía Smart Buttons (Vercel + Orders API)
   CONFIGURACIÓN: tarifas por temporada (alta $119 / baja $110), % a pagar y credenciales PayPal en Vercel (env)
   ========================================================================== */
const BOOKING = {
    currency: 'USD',                     // dólares (cuenta PayPal en $)
    baseGuests: 2,                       // la tarifa incluye 2 personas
    minNights: 2,                        // estadía mínima (2 noches)
    maxNights: 60,
    maxGuests: 5,                        // máximo 5 personas
    // Persona adicional por noche: 3ª +$10 · 4ª +$10 · 5ª +$5
    extraGuestFee: 10,                   // $ por cada persona adicional hasta la 4ª
    extraGuestFee5: 5,                   // $ por la 5ª persona
    breakfast: { perPersonPerNight: 11 },   // desayuno: $11 por persona por noche (ej. 2 noches × 2 pers = +$44)
    // Temporadas (se usa la primera que coincida)
    seasons: [
        { from: '01-01', to: '04-30', rate: 119 },  // ALTA: ene, feb, mar, abr
        { from: '05-01', to: '06-30', rate: 110 },  // BAJA: may, jun
        { from: '07-01', to: '08-31', rate: 119 },  // ALTA: jul, ago
        { from: '09-01', to: '11-30', rate: 110 },  // BAJA: sep, oct, nov
        { from: '12-01', to: '12-31', rate: 119 }   // ALTA: diciembre
    ],
    // Eventos puntuales con fecha completa (YYYY-MM-DD) — tienen prioridad sobre seasons
    events: [
        // Fin de año 2026-2027 (prioridad sobre las temporadas)
        { from: '2026-12-24', to: '2026-12-28', rate: 170 },   // Navidad
        { from: '2026-12-29', to: '2027-01-01', rate: 210 },   // Fin de año
        { from: '2027-01-02', to: '2027-01-04', rate: 170 },   // Año nuevo
        { from: '2027-01-05', to: '2027-01-10', rate: 140 },   // Post año nuevo
        { from: '2027-03-21', to: '2027-03-28', rate: 135 }    // Semana Santa 2027: $135/noche
    ],
    depositPct: 100                      // % a pagar al reservar (100 = pago total)
};

// Recargo por personas adicionales (3ª +10, 4ª +10, 5ª +5)
function extraGuestsFee(guests) {
    const extra = Math.max(0, guests - BOOKING.baseGuests);
    if (!extra) return 0;
    return Math.min(extra, 2) * BOOKING.extraGuestFee + Math.max(0, extra - 2) * (BOOKING.extraGuestFee5 || 5);
}

function rateForDate(date) {
    // 1) Eventos puntuales (fecha completa YYYY-MM-DD), ej. Semana Santa
    const full = date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
    for (const ev of (BOOKING.events || [])) {
        const f = parseInt(ev.from.replace(/-/g, ''), 10);
        const t = parseInt(ev.to.replace(/-/g, ''), 10);
        if (full >= f && full <= t) return ev.rate;
    }
    // 2) Temporadas recurrentes (MM-DD)
    const v = (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
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
const directChildren = $('#direct-children');
const directChildAges = $('#direct-child-ages');
const directAdultsVal = $('#direct-adults-val');
const directKidsVal = $('#direct-kids-val');
const directKidsAgesWrap = $('#direct-kids-ages-wrap');
const directKidsAges = $('#direct-kids-ages');
const directGuestTotal = $('#direct-guest-total');
const directSteppers = document.querySelectorAll('.stepper');
let directAdultsCount = 2;
const MAX_ADULTS = 5;
const MAX_KIDS = 4;
const KID_FREE_MAX_AGE = 2;
const directIn = $('#direct-in');
const directOut = $('#direct-out');
const directRate = $('#direct-rate');
const directNights = $('#direct-nights');
const directTotal = $('#direct-total');
const directDeposit = $('#direct-deposit');
const directDepositLabel = $('#direct-deposit-label');
const directFeeNote = $('#direct-fee-note');
const directBreakfast = $('#direct-breakfast');
const directPromo = $('#direct-promo');
const directPromoApply = $('#direct-promo-apply');
const directPromoMsg = $('#direct-promo-msg');
// Código promocional aplicado: { code, rate } o null
let directPromoActivo = null;
const directName = $('#direct-name');
const directPhone = $('#direct-phone');
const directEmail = $('#direct-email');
let lastBooking = null;

const fmtUSD = (n) => '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

if (directLoft && directGuests && directIn && directOut) {
    const addDays = (iso, days) => {
        const d = new Date(iso);
        d.setUTCDate(d.getUTCDate() + days);
        return d.toISOString().slice(0, 10);
    };

    // --- Contadores de adultos y niños ---
    const kidsCount = () => {
        const el = directKidsAges ? directKidsAges.querySelectorAll('.kid-age-row select') : [];
        return el.length;
    };
    const readKidAges = () => {
        if (!directKidsAges) return [];
        return Array.from(directKidsAges.querySelectorAll('.kid-age-row select')).map((s) => parseInt(s.value, 10) || 0);
    };
    const payingKids = () => readKidAges().filter((a) => a > KID_FREE_MAX_AGE).length;
    const freeKids = () => readKidAges().filter((a) => a <= KID_FREE_MAX_AGE).length;
    const totalPaying = () => directAdultsCount + payingKids();

    // Reconstruye la lista de edades conservando las ya elegidas
    const renderKidAges = (count) => {
        if (!directKidsAges || !directKidsAgesWrap) return;
        const previos = readKidAges();
        directKidsAges.innerHTML = '';
        if (count <= 0) { directKidsAgesWrap.hidden = true; return; }
        directKidsAgesWrap.hidden = false;
        for (let i = 0; i < count; i++) {
            const edad = Number.isFinite(previos[i]) ? previos[i] : 8;
            const row = document.createElement('div');
            row.className = 'kid-age-row';
            const lab = document.createElement('label');
            lab.textContent = `${tr('direct.kidN', 'Niño')} ${i + 1}`;
            const sel = document.createElement('select');
            for (let a = 0; a <= 17; a++) {
                const o = document.createElement('option');
                o.value = String(a);
                o.textContent = a === 1 ? tr('direct.year1', '1 año') : `${a} ${tr('direct.years', 'años')}`;
                if (a === edad) o.selected = true;
                sel.appendChild(o);
            }
            const nota = document.createElement('span');
            nota.className = 'kid-free-note ' + (edad <= KID_FREE_MAX_AGE ? 'free' : 'paid');
            nota.textContent = edad <= KID_FREE_MAX_AGE ? tr('direct.free', 'Gratis') : tr('direct.pays', 'Paga');
            sel.addEventListener('change', () => {
                const v = parseInt(sel.value, 10) || 0;
                nota.className = 'kid-free-note ' + (v <= KID_FREE_MAX_AGE ? 'free' : 'paid');
                nota.textContent = v <= KID_FREE_MAX_AGE ? tr('direct.free', 'Gratis') : tr('direct.pays', 'Paga');
                updateDirect();
            });
            row.appendChild(lab);
            row.appendChild(sel);
            row.appendChild(nota);
            directKidsAges.appendChild(row);
        }
    };

    // Resumen visible: cuántos huéspedes son en total y cuántos pagan
    const renderGuestTotal = () => {
        if (!directGuestTotal) return;
        const pagando = totalPaying();
        const gratis = freeKids();
        const totalPersonas = directAdultsCount + kidsCount();
        const excede = pagando > MAX_ADULTS;

        let txt = `${tr('direct.guestTotal', 'Total')}: <strong>${totalPersonas} ${totalPersonas === 1 ? tr('direct.person1', 'persona') : tr('direct.persons', 'personas')}</strong>`;
        txt += ` — ${directAdultsCount} ${tr('direct.adultsLower', 'adulto(s)')}`;
        const pagandoNinos = payingKids();
        if (pagandoNinos > 0) txt += ` + ${pagandoNinos} ${tr('direct.kidsPayingLower', 'niño(s) de 3+ años que paga(n)')}`;
        if (gratis > 0) txt += ` + ${gratis} ${tr('direct.kidsFreeLower', 'niño(s) de 2 años o menos (gratis)')}`;
        txt += `<br>${tr('direct.guestPaying', 'Se cobra por')}: <strong>${pagando}</strong> ${pagando === 1 ? tr('direct.person1', 'persona') : tr('direct.persons', 'personas')}`;
        if (excede) txt += ` · <strong>${tr('direct.overCap', 'Excede el máximo de 5')}</strong>`;

        directGuestTotal.innerHTML = txt;
        directGuestTotal.classList.toggle('warn', excede);
    };

    const syncCounters = () => {
        const kids = kidsCount();
        if (directAdultsVal) directAdultsVal.textContent = String(directAdultsCount);
        if (directKidsVal) directKidsVal.textContent = String(kids);
        if (directGuests) directGuests.value = String(directAdultsCount);
        if (directChildren) directChildren.value = String(kids);
        if (directChildAges) directChildAges.value = JSON.stringify(readKidAges());
        renderGuestTotal();
        // Un niño se puede añadir si quedan plazas libres en el cupo de 5
        directSteppers.forEach((st) => {
            const tipo = st.getAttribute('data-stepper');
            const menos = st.querySelector('[data-step="-1"]');
            const mas = st.querySelector('[data-step="1"]');
            if (!menos || !mas) return;
            if (tipo === 'adults') {
                menos.disabled = directAdultsCount <= 1;
                mas.disabled = directAdultsCount >= MAX_ADULTS || totalPaying() >= MAX_ADULTS;
            } else {
                menos.disabled = kids <= 0;
                mas.disabled = kids >= MAX_KIDS || totalPaying() >= MAX_ADULTS;
            }
        });
    };

    if (directSteppers.length) {
        directSteppers.forEach((st) => {
            st.addEventListener('click', (ev) => {
                const btn = ev.target.closest('.step-btn');
                if (!btn || btn.disabled) return;
                const delta = parseInt(btn.getAttribute('data-step'), 10) || 0;
                const tipo = st.getAttribute('data-stepper');
                if (tipo === 'adults') {
                    directAdultsCount = Math.max(1, Math.min(MAX_ADULTS, directAdultsCount + delta));
                } else {
                    const n = Math.max(0, Math.min(MAX_KIDS, kidsCount() + delta));
                    renderKidAges(n);
                }
                syncCounters();
                updateDirect();
            });
        });
    }
    renderKidAges(0);
    syncCounters();

    const updateDirect = () => {
        const label = directDepositLabel;
        label.textContent = BOOKING.depositPct >= 100
            ? tr('direct.totalPay', 'Pago total')
            : `${tr('direct.deposit', 'Seña')} (${BOOKING.depositPct}%)`;

        const breakfast = directBreakfast ? directBreakfast.checked : false;
        // Personas que pagan: adultos + niños de 3+ años (los de 2- son gratis)
        const guests = Math.max(1, directAdultsCount + payingKids());
        const breakfastPerNight = breakfast ? BOOKING.breakfast.perPersonPerNight * guests : 0;

        const nights = directIn.value && directOut.value
            ? Math.round((new Date(directOut.value) - new Date(directIn.value)) / 86400000)
            : 0;
        // Fechas válidas: se cumple el mínimo general, O es una sola noche huérfana
        // (1 noche libre entre dos periodos ocupados) que sí se puede reservar.
        const isOrphan = isOrphanStay(directLoft.value, directIn.value, directOut.value);
        const hasDates = (nights >= BOOKING.minNights || isOrphan) && nights >= 1 && nights <= 60;

        const free = freeKids();
        const paid = payingKids();
        const kidsNote = free > 0 ? ` · ${free} ${tr('direct.kidsFreeShort', 'niño(s) gratis')}` : '';
        const paidNote = paid > 0 ? ` · ${paid} ${tr('direct.kidsPaidShort', 'niño(s) como persona')}` : '';
        directFeeNote.textContent = (isOrphan && nights === 1)
            ? tr('direct.orphanOk', 'Última noche disponible — se permite 1 noche')
            : (breakfast
                ? `${tr('direct.bfast', 'Desayuno')} ${fmtUSD(BOOKING.breakfast.perPersonPerNight)} ${tr('direct.bfastPer', 'por persona/noche')} · ${tr('direct.extra5', '3ª-4ª persona')} ${fmtUSD(BOOKING.extraGuestFee)} · ${tr('direct.extra6', '5ª persona')} ${fmtUSD(BOOKING.extraGuestFee5 || 5)}`
                : `${tr('direct.feeNote', 'Tarifa para 2 personas')} · ${tr('direct.extra5', '3ª-4ª persona')} ${fmtUSD(BOOKING.extraGuestFee)} · ${tr('direct.extra6', '5ª persona')} ${fmtUSD(BOOKING.extraGuestFee5 || 5)}`) + kidsNote + paidNote;

        // Fechas ya bloqueadas (reservas propias o calendarios externos importados)
        if (hasDates && datesBlocked(directLoft.value, directIn.value, directOut.value)) {
            directNights.textContent = String(nights);
            directTotal.textContent = tr('direct.unavailable', 'Fechas no disponibles');
            directDeposit.textContent = '—';
            lastBooking = null;
            return;
        }

        // El código puede limitar cuántas personas aplican la tarifa especial
        if (directPromoActivo && directPromoActivo.maxGuests && guests > directPromoActivo.maxGuests) {
            directNights.textContent = nights > 0 ? String(nights) : '—';
            directTotal.textContent = tr('direct.promoOverGuests', 'El código es para máximo')
                + ' ' + directPromoActivo.maxGuests + ' ' + tr('direct.persons', 'personas');
            directDeposit.textContent = '—';
            lastBooking = null;
            return;
        }

        let total = 0;
        let n = 0;
        const ratesSeen = [];
        const extraFee = extraGuestsFee(guests);
        // Si hay un código aplicado, su tarifa sustituye a la de temporada.
        // Con tarifa plana NO se suma el recargo por persona adicional.
        const baseRate = directPromoActivo ? directPromoActivo.rate : null;
        const extraAplicable = (directPromoActivo && directPromoActivo.flat) ? 0 : extraFee;

        if (hasDates) {
            const d = new Date(directIn.value);
            const end = new Date(directOut.value);
            while (d < end) {
                const r = (baseRate !== null ? baseRate : rateForDate(d)) + extraAplicable + breakfastPerNight;
                total += r;
                if (!ratesSeen.includes(r)) ratesSeen.push(r);
                n += 1;
                d.setUTCDate(d.getUTCDate() + 1);
            }
        }

        // Precio por noche: con fechas → tarifa exacta; sin fechas → rango de temporadas
        if (hasDates) {
            directRate.textContent = ratesSeen.length === 1
                ? fmtUSD(ratesSeen[0])
                : `${fmtUSD(Math.min(...ratesSeen))}–${fmtUSD(Math.max(...ratesSeen))}`;
        } else {
            const rates = directPromoActivo
                ? [directPromoActivo.rate + breakfastPerNight]
                : [...BOOKING.seasons.map((s) => s.rate + breakfastPerNight), ...(BOOKING.events || []).map((e) => e.rate + breakfastPerNight)];
            directRate.textContent = rates.length === 1
                ? fmtUSD(rates[0])
                : (rates.length ? `${fmtUSD(Math.min(...rates))}–${fmtUSD(Math.max(...rates))}` : '—');
        }

        const deposit = total * BOOKING.depositPct / 100;

        // Marca visual cuando la tarifa especial está aplicada
        if (directRate && directPromoActivo) {
            if (!directRate.querySelector('.promo-badge')) {
                const b = document.createElement('span');
                b.className = 'promo-badge';
                b.textContent = directPromoActivo.code;
                directRate.appendChild(b);
            } else {
                directRate.querySelector('.promo-badge').textContent = directPromoActivo.code;
            }
        } else if (directRate) {
            const b = directRate.querySelector('.promo-badge');
            if (b) b.remove();
        }

        if (hasDates) {
            directNights.textContent = `${n} ${n === 1 ? tr('direct.night', 'noche') : tr('direct.nights', 'noches')}`;
            directTotal.textContent = fmtUSD(total);
            directDeposit.textContent = BOOKING.depositPct >= 100
                ? fmtUSD(total)
                : `${fmtUSD(deposit)} (${BOOKING.depositPct}%)`;
        } else if (nights > 0) {
            directNights.textContent = String(nights);
            directTotal.textContent = nights > 60
                ? tr('direct.maxNights', 'La estadía máxima es de 60 noches.')
                : tr('direct.minNights', 'Mínimo 2 noches');
            directDeposit.textContent = '—';
        } else {
            directNights.textContent = '—';
            directTotal.textContent = tr('direct.selectDates', 'Elige tus fechas');
            directDeposit.textContent = '—';
        }

        // Parámetros de la reserva para el cobro (el servidor calcula el monto)
        if (hasDates) {
            syncCounters();
            const childAges = readKidAges();
            lastBooking = { propertyId: directLoft.value, checkIn: directIn.value, checkOut: directOut.value, guests: directAdultsCount, childAges, promo: directPromoActivo ? directPromoActivo.code : '', breakfast, name: directName ? directName.value.trim() : '', email: directEmail ? directEmail.value.trim() : '', phone: directPhone ? directPhone.value.trim() : '' };
        } else {
            lastBooking = null;
        }

        // El botón de PayPal se habilita automáticamente (Smart Buttons); el monto se valida al pagar
    };

    registerDynamic(updateDirect);

    const today = new Date().toISOString().split('T')[0];
    directIn.min = today;
    directOut.min = addDays(today, BOOKING.minNights);

    directLoft.addEventListener('change', updateDirect);
    directIn.addEventListener('change', () => {
        // Si la noche elegida es huérfana, basta 1 noche; si no, se respeta el mínimo
        const minN = isOrphanNight(directLoft.value, directIn.value) ? 1 : BOOKING.minNights;
        directOut.min = directIn.value ? addDays(directIn.value, minN) : addDays(today, BOOKING.minNights);
        updateDirect();
    });
    directOut.addEventListener('change', updateDirect);
    if (directBreakfast) directBreakfast.addEventListener('change', updateDirect);

    // --- Código promocional ---
    const promoMsg = (texto, tipo) => {
        if (!directPromoMsg) return;
        directPromoMsg.textContent = texto || '';
        directPromoMsg.className = 'promo-msg' + (tipo ? ' ' + tipo : '');
    };
    const aplicarPromo = async () => {
        const code = directPromo ? directPromo.value.trim() : '';
        if (!code) {
            directPromoActivo = null;
            promoMsg('');
            updateDirect();
            return;
        }
        promoMsg(tr('direct.promoChecking', 'Comprobando…'), '');
        try {
            const r = await fetch('/api/ical/admin?promo=' + encodeURIComponent(code));
            const d = await r.json();
            if (d && d.valid) {
                directPromoActivo = { code: d.code, rate: d.rate, flat: d.flat !== false, maxGuests: d.maxGuests || null };
                const ambito = directPromoActivo.flat
                    ? tr('direct.promoFlat', 'tarifa plana')
                    : tr('direct.promoPlusExtras', 'más extras por persona');
                const tope = directPromoActivo.maxGuests
                    ? ' · ' + tr('direct.promoMaxShort', 'máx.') + ' ' + directPromoActivo.maxGuests + ' ' + tr('direct.persons', 'personas')
                    : '';
                promoMsg(
                    tr('direct.promoOk', 'Código aplicado') + ': ' + fmtUSD(d.rate) + ' ' + tr('direct.perNight', 'por noche') + ' (' + ambito + tope + ')',
                    'ok'
                );
            } else {
                directPromoActivo = null;
                const err = d && d.error;
                promoMsg(
                    err === 'used' ? tr('direct.promoUsed', 'Este código ya fue utilizado.')
                        : err === 'expired' ? tr('direct.promoExpired', 'Este código ha caducado.')
                            : tr('direct.promoBad', 'Código no válido.'),
                    'err'
                );
            }
        } catch (e) {
            directPromoActivo = null;
            promoMsg(tr('direct.promoErr', 'No se pudo comprobar el código. Inténtalo de nuevo.'), 'err');
        }
        updateDirect();
    };

    if (directPromoApply) directPromoApply.addEventListener('click', aplicarPromo);
    if (directPromo) {
        directPromo.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') { ev.preventDefault(); aplicarPromo(); }
        });
        // Si el huésped cambia el código escrito, se quita el aplicado anterior
        directPromo.addEventListener('input', () => {
            if (directPromoActivo && directPromo.value.trim().toUpperCase().replace(/[\s-]+/g, '') !== directPromoActivo.code) {
                directPromoActivo = null;
                promoMsg('');
                updateDirect();
            }
        });
    }

    // Los datos del huésped deben refrescar lastBooking (si se escriben tras elegir fechas)
    [directName, directEmail, directPhone].forEach((el) => {
        if (el) el.addEventListener('input', updateDirect);
    });

    // Pre-selección del loft desde las páginas de detalle (index.html?loft=loft1|loft2)
    const loftParam = new URLSearchParams(location.search).get('loft');
    if (loftParam === 'loft1' || loftParam === 'loft2') {
        directLoft.value = loftParam;
        updateDirect();
    }

    // ================= Calendario personalizado (las fechas ocupadas NO se pueden elegir) =================
    const inField = $('#direct-in-field');
    const outField = $('#direct-out-field');

    if (inField && outField) {
        const CAL_MONTHS = {
            es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
            en: ['January','February','March','April','May','June','July','August','September','October','November','December']
        };
        const CAL_WEEK = { es: ['Do','Lu','Ma','Mi','Ju','Vi','Sá'], en: ['Su','Mo','Tu','We','Th','Fr','Sa'] };

        let calOpen = false;
        let calPhase = 'in';
        let calY = 0;
        let calM = 0;

        const pop = document.createElement('div');
        pop.className = 'cal-popover';
        pop.style.display = 'none';
        pop.innerHTML =
            '<div class="cal-head">' +
                '<button type="button" class="cal-nav" data-cal="prev" aria-label="Mes anterior">‹</button>' +
                '<span class="cal-title"></span>' +
                '<button type="button" class="cal-nav" data-cal="next" aria-label="Mes siguiente">›</button>' +
            '</div>' +
            '<div class="cal-weekdays"></div>' +
            '<div class="cal-grid"></div>';
        document.body.appendChild(pop);

        const iso = (d) => d.toISOString().slice(0, 10);
        const dayBlocked = (pid, s) => {
            if (!availability || !availability.properties || !availability.properties[pid]) return false;
            const t = Date.parse(s);
            for (const b of availability.properties[pid].blocked) {
                if (t >= Date.parse(b.checkIn) && t < Date.parse(b.checkOut)) return true;
            }
            return false;
        };
        const rangeBlocked = (pid, aIn, aOut) => {
            if (!availability || !availability.properties || !availability.properties[pid]) return false;
            const x = Date.parse(aIn);
            const y = Date.parse(aOut);
            if (!Number.isFinite(x) || !Number.isFinite(y) || y <= x) return false;
            for (const b of availability.properties[pid].blocked) {
                const bIn = Date.parse(b.checkIn);
                const bOut = Date.parse(b.checkOut);
                if (x < bOut && bIn < y) return true;
            }
            return false;
        };
        const fmtDisp = (s) => {
            if (!s) return '';
            const p = s.split('-');
            return lang === 'en' ? p[1] + '/' + p[2] + '/' + p[0] : p[2] + '/' + p[1] + '/' + p[0];
        };
        const updateFields = () => {
            inField.textContent = directIn.value ? fmtDisp(directIn.value) : tr('direct.selectIn', 'Elegir fecha de entrada');
            outField.textContent = directOut.value ? fmtDisp(directOut.value) : tr('direct.selectOut', 'Elegir fecha de salida');
            inField.classList.toggle('has-value', Boolean(directIn.value));
            outField.classList.toggle('has-value', Boolean(directOut.value));
        };

        const renderCal = () => {
            const pid = directLoft.value;
            const wk = CAL_WEEK[lang] || CAL_WEEK.es;
            const months = CAL_MONTHS[lang] || CAL_MONTHS.es;
            pop.querySelector('.cal-title').textContent = months[calM] + ' ' + calY;
            pop.querySelector('.cal-weekdays').innerHTML = wk.map((w) => '<span>' + w + '</span>').join('');
            const grid = pop.querySelector('.cal-grid');
            grid.innerHTML = '';
            const now = new Date();
            const t0 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
            const firstDow = new Date(Date.UTC(calY, calM, 1)).getUTCDay();
            const dim = new Date(Date.UTC(calY, calM + 1, 0)).getUTCDate();
            const minOut = directIn.value ? addDays(directIn.value, BOOKING.minNights) : null;
            // Si la noche de entrada es huérfana, se puede salir al día siguiente (1 noche)
            const orphanIn = directIn.value ? isOrphanNight(pid, directIn.value) : false;
            for (let i = 0; i < firstDow; i++) grid.appendChild(document.createElement('span'));
            for (let d = 1; d <= dim; d++) {
                const s = iso(new Date(Date.UTC(calY, calM, d)));
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'cal-day';
                btn.textContent = String(d);
                // Un día es seleccionable si: para ENTRADA → la noche está libre;
                // para SALIDA → el rango entrada→salida no invade ningún bloqueo
                // (el día de salida puede coincidir con el check-in de otra reserva).
                let dis;
                if (calPhase === 'out') {
                    const isOrphanCheckout = orphanIn && s === addDays(directIn.value, 1);
                    dis = Date.parse(s) < t0
                        || rangeBlocked(pid, directIn.value, s)
                        || (!isOrphanCheckout && minOut && Date.parse(s) < Date.parse(minOut));
                } else {
                    dis = Date.parse(s) < t0 || dayBlocked(pid, s);
                }
                if (dis) btn.classList.add('disabled');
                if (s === directIn.value || s === directOut.value) btn.classList.add('selected');
                if (directIn.value && directOut.value && s > directIn.value && s < directOut.value) btn.classList.add('in-range');
                btn.addEventListener('click', () => {
                    if (btn.classList.contains('disabled')) return; // fechas ocupadas no se pueden tocar
                    if (calPhase === 'in') {
                        directIn.value = s;
                        directOut.value = '';
                        calPhase = 'out';
                        renderCal();
                    } else {
                        directOut.value = s;
                        closeCal();
                        updateFields();
                        updateDirect();
                    }
                });
                grid.appendChild(btn);
            }
        };

        const openCal = (phase, field) => {
            const now = new Date();
            calY = directIn.value ? parseInt(directIn.value.slice(0, 4), 10) : now.getFullYear();
            calM = directIn.value ? parseInt(directIn.value.slice(5, 7), 10) - 1 : now.getMonth();
            calPhase = (phase === 'out' && !directIn.value) ? 'in' : phase;
            // Posición fija en la ventana (evita que la tarjeta recorte el calendario)
            const r = field.getBoundingClientRect();
            const pw = Math.min(280, window.innerWidth - 16);
            let left = r.left;
            if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
            if (left < 8) left = 8;
            pop.style.top = (r.bottom + 6) + 'px';
            pop.style.left = left + 'px';
            pop.style.width = pw + 'px';
            calOpen = true;
            renderCal();
            pop.style.display = 'block';
        };
        const closeCal = () => {
            calOpen = false;
            pop.style.display = 'none';
        };

        inField.addEventListener('click', () => openCal('in', inField));
        outField.addEventListener('click', () => openCal('out', outField));
        pop.querySelector('[data-cal="prev"]').addEventListener('click', (e) => {
            e.stopPropagation();
            calM -= 1;
            if (calM < 0) { calM = 11; calY -= 1; }
            renderCal();
        });
        pop.querySelector('[data-cal="next"]').addEventListener('click', (e) => {
            e.stopPropagation();
            calM += 1;
            if (calM > 11) { calM = 0; calY += 1; }
            renderCal();
        });
        document.addEventListener('click', (e) => {
            if (calOpen && !pop.contains(e.target) && e.target !== inField && e.target !== outField) closeCal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeCal();
        });
        window.addEventListener('scroll', closeCal, true);
        window.addEventListener('resize', closeCal);
        directLoft.addEventListener('change', () => { if (calOpen) renderCal(); });
        registerDynamic(() => {
            if (calOpen) renderCal();
            updateFields();
        });

        updateFields();
    }

    updateDirect();
}

console.log('Cabañas La Maite · sitio cargado 🌴');

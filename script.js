/* ==========================================================================
   Cabañas la Maite — comportamiento del sitio
   ========================================================================== */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ---------- Menú móvil ---------- */
const navToggle = $('#nav-toggle');
const navLinks = $('#nav-links');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });

    // Cerrar el menú al elegir una opción o al hacer clic fuera
    navLinks.addEventListener('click', (e) => {
        if (e.target.closest('a')) {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'Abrir menú');
        }
    });

    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/* ---------- Header al hacer scroll ---------- */
const header = $('#site-header');

if (header) {
    const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ---------- Scroll suave para anclas de la misma página ---------- */
$$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
        const target = $(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

/* ---------- Animaciones de aparición ---------- */
const revealEls = $$('.reveal');

if ('IntersectionObserver' in window && revealEls.length) {
    // Escalonar los hijos de una misma grilla para un efecto en cascada
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

/* ---------- Lightbox para galerías ---------- */
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
        lbImg.alt = src.alt || 'Foto';
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

/* ---------- Formulario de contacto ---------- */
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

        // Validación simple
        if (!data.nombre || !data.nombre.trim()) {
            setMessage('Por favor, escribe tu nombre.', 'error');
            return;
        }
        if (!data.email || !isValidEmail(data.email)) {
            setMessage('Por favor, escribe un email válido.', 'error');
            return;
        }

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;

        // Simular envío (reemplazar con un endpoint real cuando exista)
        await new Promise((resolve) => setTimeout(resolve, 1200));

        setMessage(
            `¡Gracias ${data.nombre.trim()}! Te contactaremos pronto para confirmar tu consulta.`,
            'success'
        );
        contactForm.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        setTimeout(() => {
            formMessage.className = 'form-message';
        }, 6000);
    });

    // Fechas mínimas: hoy para entrada; salida >= entrada
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

console.log('Cabañas la Maite · sitio cargado 🌴');

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Contact form handling
const contactForm = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    // Show loading state
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    // Simulate API call (replace with actual endpoint)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Show success message
    formMessage.textContent = `¡Gracias ${data.nombre}! Te contactaremos pronto para confirmar tu reserva.`;
    formMessage.className = 'form-message success';

    // Reset form
    contactForm.reset();

    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    // Hide message after 5 seconds
    setTimeout(() => {
        formMessage.style.display = 'none';
        formMessage.className = 'form-message';
    }, 5000);
});

// Scroll effect for header
let lastScroll = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }

    lastScroll = currentScroll;
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe cards for animation
document.querySelectorAll('.cabana-card, .highlight, .reservar-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Set min date for check-in (today)
const today = new Date().toISOString().split('T')[0];
document.getElementById('fecha-entrada').min = today;
document.getElementById('fecha-salida').min = today;

// Update checkout min date when checkin changes
document.getElementById('fecha-entrada').addEventListener('change', function() {
    document.getElementById('fecha-salida').min = this.value;
});

console.log('Cabañas Las Maite - Website loaded! 🌴');

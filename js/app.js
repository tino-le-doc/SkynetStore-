/**
 * SkynetStore — Main App (Homepage)
 */
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('nav');
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // Header scroll effect
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.style.background = window.scrollY > 50
                ? 'rgba(10, 10, 15, 0.95)'
                : 'rgba(10, 10, 15, 0.85)';
        });
    }

    // Featured products (homepage)
    const featuredGrid = document.getElementById('featured-products');
    if (featuredGrid) {
        const featured = PRODUCTS.filter(p => p.popular).slice(0, 6);
        featuredGrid.innerHTML = featured.map(p => createProductCard(p, '')).join('');
    }

    // Newsletter form
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = newsletterForm.querySelector('input');
            if (input && input.value) {
                alert('Merci ! Vous recevrez nos actualités IA à ' + input.value);
                input.value = '';
            }
        });
    }

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Message envoyé ! Notre équipe vous répondra sous 24h.');
            contactForm.reset();
        });
    }
});

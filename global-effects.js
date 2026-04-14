// ====================================================
// Global Visual Effects JS (Performance-Optimized)
// Scroll Reveal, Card Glow Tracking
// ====================================================

document.addEventListener('DOMContentLoaded', () => {

    // ---- 1. Auto-tag elements for scroll reveal ----
    // EXCLUDE hostel/timeline elements — they have their own animation system
    const autoRevealSelectors = [
        '.about-section .section-header',
        '.nature-section .section-header',
        '.programs-section .section-header',
        '.admission-section .section-header',
        '.why-us-section .section-header',
        '.contact-section .section-header',
        '.academic-highlight',
        '.nature-showcase',
        '.nature-description',
        '.contact-wrapper'
    ];

    autoRevealSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add('scroll-reveal');
        });
    });

    // Stagger grids
    const staggerSelectors = ['.fefu-cards-grid', '.programs-grid', '.admission-steps', '.features-grid'];
    staggerSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add('scroll-reveal-stagger');
        });
    });

    // ---- 2. Single IntersectionObserver for all reveals ----
    const allReveal = document.querySelectorAll('.scroll-reveal, .scroll-reveal-stagger');
    if (allReveal.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.02, rootMargin: '100px 0px 0px 0px' });
        allReveal.forEach(el => observer.observe(el));
    }

    // ---- 3. Card Glow Tracking (Mouse-Follow, desktop only) ----
    if (window.innerWidth > 768) {
        const glowCards = document.querySelectorAll('.fefu-card, .program-card, .step-card, .feature-card');
        glowCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--mouse-x', x + '%');
                card.style.setProperty('--mouse-y', y + '%');
            });
        });
    }

    // ---- 4. Scroll to Top Button Visibility ----
    const scrollTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 800) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        }, { passive: true });
    }

});

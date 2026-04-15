// ========================================
// NAVIGATION FUNCTIONALITY
// ========================================

// Smooth scrolling for navigation links
document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
    link.addEventListener('click', function (e) {
        const fullHref = this.getAttribute('href');
        if (!fullHref) return;

        // Extract hash part
        const hashIndex = fullHref.indexOf('#');
        if (hashIndex === -1) {
            return; // No anchor, let browser handle it
        }

        const targetId = fullHref.substring(hashIndex);
        const pagePart = fullHref.substring(0, hashIndex);

        // If the link is pointing to another page, let the browser handle it
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        if (pagePart && pagePart !== '' && pagePart !== currentPath) {
            return;
        }

        e.preventDefault();
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Close original mobile menu if open
            const navMenu = document.getElementById('navMenu');
            if (navMenu) {
                navMenu.classList.remove('active');
            }

            // Close sidebar mobile drawer if open
            const closeBtn = document.getElementById('sidebar-close-toggle');
            if (closeBtn) {
                closeBtn.click();
            }
        }
    });
});

// Mobile navigation toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Navbar scroll effect
const navbar = document.getElementById('navbar');
let lastScroll = 0;
let ticking = false;

if (navbar) {
    window.addEventListener('scroll', () => {
        lastScroll = window.scrollY; // Use scrollY for better compatibility

        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (lastScroll > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    });
}

// ========================================
// ACTIVE NAVIGATION HIGHLIGHTING
// ========================================

// ========================================
// ACTIVE NAVIGATION HIGHLIGHTING (Optimized)
// ========================================

const sectionObserverOptions = {
    threshold: 0.3,
    rootMargin: "-10% 0px -40% 0px" // Trigger when section is near top/center
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute('id');

            document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href && (href === `#${currentId}` || href.endsWith(`#${currentId}`))) {
                    link.classList.add('active');
                }
            });
        }
    });
}, sectionObserverOptions);

document.querySelectorAll('.section').forEach((section) => {
    sectionObserver.observe(section);
});

// ========================================
// CONTACT FORM HANDLING
// ========================================

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            message: document.getElementById('message').value
        };

        console.log('Form submitted:', formData);

        // TODO: Add your form submission logic here
        // For now, just show an alert
        alert('Thank you for your message! We will get back to you soon.');

        // Reset form
        contactForm.reset();
    });
}

// ========================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ========================================

// ========================================
// MOTION.JS SPRING ANIMATIONS
// ========================================

import("https://esm.sh/motion@12.38.0").then(({ animate, inView, stagger, scroll }) => {
    
    // 0. Global Scroll Progress Indicator using Motion
    const progressBar = document.createElement('div');
    progressBar.id = 'motion-scroll-progress';
    progressBar.style.position = 'fixed';
    progressBar.style.top = '0';
    progressBar.style.left = '0';
    progressBar.style.right = '0';
    progressBar.style.height = '4px';
    progressBar.style.background = 'linear-gradient(90deg, #0077b6, #00b4d8)';
    progressBar.style.transformOrigin = '0%';
    progressBar.style.zIndex = '100000';
    document.body.appendChild(progressBar);

    scroll(animate(progressBar, { scaleX: [0, 1] }));
    // 1. Standard Cards
    const standardCards = document.querySelectorAll('.program-card, .step-card, .feature-card');
    standardCards.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        el.style.transition = 'none'; // Disable CSS transitions for physics
    });

    inView('.program-card, .step-card, .feature-card', (element) => {
        animate(element, 
            { opacity: [0, 1], y: [40, 0] }, 
            { type: "spring", bounce: 0.4, duration: 0.8 }
        );
    });

    // 2. FEFU Cards with Stagger
    const fefuCards = document.querySelectorAll('.fefu-card');
    fefuCards.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        el.style.transition = 'none'; // Disable CSS transitions
    });

    // Animate when the grid enters view
    inView('.fefu-cards-grid', () => {
        animate('.fefu-card', 
            { opacity: [0, 1], y: [40, 0] }, 
            { 
                type: "spring", 
                bounce: 0.3, 
                duration: 0.9, 
                delay: stagger(0.1, { startDelay: 0.1 }) 
            }
        );
    });
});

// ========================================
// ADMISSION STEPPER ANIMATION
// ========================================
const admissionSteps = document.querySelectorAll('.admission-step');
if (admissionSteps.length > 0) {
    const stepObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Trigger animation when the step is nicely in view (approx middle of screen)
            if (entry.isIntersecting) {
                entry.target.classList.add('is-active');
            } else {
                // Optional: remove if you want them to un-fill when scrolling up past them
                // We'll leave them filled once activated for a smoother forward reading experience
                // Actually, let's remove so it replays up and down accurately
                const boundingRect = entry.target.getBoundingClientRect();
                // When scrolling up (element is below viewport), remove active class
                if (boundingRect.top > 0) {
                    entry.target.classList.remove('is-active');
                }
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: "0px 0px -15% 0px" 
    });

    admissionSteps.forEach(step => stepObserver.observe(step));
}

// ========================================
// FEFU CARDS GLOWING EFFECT (Exact Aceternity Implementation)
// ========================================

// ========================================
// FEFU CARDS GLOWING EFFECT (Optimized)
// ========================================

const fefuCards = document.querySelectorAll('.fefu-card');
const supportsHover = window.matchMedia('(hover: hover)').matches;

const GLOW_CONFIG = {
    proximity: 64,
    inactiveZone: 0.01,
    inactiveRadiusMultiplier: 0.5, // Precompute
};

if (supportsHover) {
    let cardData = [];
    let rafId = null;
    let mouseX = 0;
    let mouseY = 0;
    let scrollX = 0;
    let scrollY = 0;

    // Initialize card data (absolute positions)
    const initCardData = () => {
        const docScrollX = window.scrollX || window.pageXOffset;
        const docScrollY = window.scrollY || window.pageYOffset;

        cardData = Array.from(fefuCards).map(card => {
            const rect = card.getBoundingClientRect();
            return {
                element: card,
                glowElement: card.querySelector('.fefu-card-glow'),
                // Absolute position in document
                left: rect.left + docScrollX,
                top: rect.top + docScrollY,
                width: rect.width,
                height: rect.height,
                centerX: rect.left + docScrollX + (rect.width * 0.5),
                centerY: rect.top + docScrollY + (rect.height * 0.5),
                currentAngle: 0
            };
        });
    };

    // Update positions on resize or layout changes
    window.addEventListener('resize', debounce(initCardData, 200));
    window.addEventListener('load', initCardData);
    // Also run shortly after load in case of layout shifts
    setTimeout(initCardData, 1000);

    const updateGlows = () => {
        // Current absolute mouse position
        const absMouseX = mouseX + scrollX;
        const absMouseY = mouseY + scrollY;

        cardData.forEach(data => {
            if (!data.glowElement) return;

            // Distance from center
            const dx = absMouseX - data.centerX;
            const dy = absMouseY - data.centerY;
            const distanceFromCenter = Math.hypot(dx, dy);

            const inactiveRadius = 0.5 * Math.min(data.width, data.height) * GLOW_CONFIG.inactiveZone;

            if (distanceFromCenter < inactiveRadius) {
                data.glowElement.style.setProperty('--active', '0');
                return;
            }

            // Check proximity (using absolute bounds)
            const isActive =
                absMouseX > data.left - GLOW_CONFIG.proximity &&
                absMouseX < data.left + data.width + GLOW_CONFIG.proximity &&
                absMouseY > data.top - GLOW_CONFIG.proximity &&
                absMouseY < data.top + data.height + GLOW_CONFIG.proximity;

            data.glowElement.style.setProperty('--active', isActive ? '1' : '0');

            if (isActive) {
                // Calculate angle
                let targetAngle = (180 * Math.atan2(dy, dx)) / Math.PI + 90;

                // Smooth rotation (simple lerp)
                const angleDiff = ((targetAngle - data.currentAngle + 180) % 360) - 180;
                data.currentAngle += angleDiff * 0.45; // Ease factor (Increased speed)

                data.glowElement.style.setProperty('--start', String(data.currentAngle));
            }
        });

        rafId = null;
    };

    const onInteraction = () => {
        if (!rafId) {
            rafId = requestAnimationFrame(updateGlows);
        }
    };

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        // Update scroll values here too to key off latest state
        scrollX = window.scrollX;
        scrollY = window.scrollY;
        onInteraction();
    }, { passive: true });

    // Update on scroll too, as relative mouse pos might not change but absolute does
    window.addEventListener('scroll', () => {
        scrollX = window.scrollX;
        scrollY = window.scrollY;
        onInteraction();
    }, { passive: true });

    // Initial init
    initCardData();
} else {
    // Mobile: Calculate which card is closest to the center of the viewport
    const calculateCenterCard = () => {
        const viewportCenterPoint = window.innerHeight / 2;
        let closestCard = null;
        let minDistance = Infinity;

        fefuCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            // Card center relative to viewport
            const cardCenter = rect.top + rect.height / 2;
            const distance = Math.abs(cardCenter - viewportCenterPoint);

            if (distance < minDistance) {
                minDistance = distance;
                closestCard = card;
            }
        });

        fefuCards.forEach(card => {
            if (card === closestCard) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    };

    // Calculate on scroll and initial load
    window.addEventListener('scroll', () => {
        requestAnimationFrame(calculateCenterCard);
    }, { passive: true });

    // Initial check
    setTimeout(calculateCenterCard, 500);
}


// (FEFU card animations moved to Motion.js block)

// ========================================
// THREE.JS PLACEHOLDER
// ========================================

// This section is ready for Three.js integration
// The hero-canvas div is available for rendering 3D content

/*
Example Three.js setup (uncomment when ready to use):
 
import * as THREE from 'three';
 
const canvas = document.getElementById('hero-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
 
renderer.setSize(window.innerWidth, window.innerHeight);
canvas.appendChild(renderer.domElement);
 
// Add your 3D objects here
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x2563eb });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
 
camera.position.z = 5;
 
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
 
animate();
 
// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
*/

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Debounce function for performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========================================
// GALLERY TAB FILTERING
// ========================================

function initGalleryTabs() {
    const tabs = document.querySelectorAll('.gallery-tab');
    const items = document.querySelectorAll('.gallery-item-cat');

    if (!tabs.length || !items.length) return;

    // Initialize: Show only the active tab's category on page load
    const activeTab = document.querySelector('.gallery-tab.active');
    if (activeTab) {
        const initialCategory = activeTab.dataset.category;
        items.forEach(item => {
            const itemCategory = item.dataset.category;
            if (itemCategory !== initialCategory) {
                item.classList.add('hidden');
            }
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Orchestrate staggered filtering animation
            let delayIndex = 0;

            // First pass: Hide and reset all
            items.forEach(item => {
                const itemCategory = item.dataset.category;
                if (itemCategory !== category) {
                    item.classList.add('hidden');
                } else {
                    item.classList.remove('hidden');
                    item.classList.remove('animate-in'); // Reset for re-trigger
                }
            });

            // Second pass: Trigger reflow and apply animation classes with staggered delays
            items.forEach(item => {
                const itemCategory = item.dataset.category;
                if (itemCategory === category) {
                    void item.offsetWidth; // Force a CSS reflow
                    item.style.animationDelay = `${delayIndex * 0.05}s`;
                    item.classList.add('animate-in');
                    delayIndex++;
                }
            });
        });
    });
}

// Initialize gallery tabs when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGalleryTabs);
} else {
    initGalleryTabs();
}

// ========================================
// PAGE LOAD ANIMATIONS
// ========================================

// Handle initial scroll state
if (document.getElementById('hero-particles') || document.getElementById('shader-loader')) {
    // Keep locked for loader on homepage (CSS has overflow-y: hidden by default)
    document.body.style.overflow = 'hidden';
} else {
    // Unlock immediately on gallery/other pages where no loader exists
    document.body.style.overflowY = 'auto';
}

// Reveal hero section explicitly after loader finishes
// NOTE: The actual hero text animations (FEFU letter-split, eyebrow, subtitle, stats)
// are handled by background-paths.js — do NOT add competing GSAP animations here.
document.addEventListener('loader-finished', () => {
    const heroSection = document.getElementById('hero');
    if (heroSection) heroSection.classList.add('revealed');
});

// ========================================
// PREMIUM HERO PARALLAX & MAGNETIC BUTTON
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.getElementById('hero');
    const heroContent = document.querySelector('.hero-content');
    const heroParticles = document.getElementById('hero-particles');
    const btnDiscoverWrap = document.querySelector('.btn-discover-wrap');
    const btnDiscover = document.querySelector('.btn-discover');

    // Hero parallax scroll is handled by background-paths.js — do NOT duplicate here.

    // 2. Magnetic Button Effect
    if (btnDiscoverWrap && btnDiscover && window.matchMedia("(hover: hover)").matches) {
        btnDiscoverWrap.addEventListener('mousemove', (e) => {
            const rect = btnDiscoverWrap.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Move button slightly towards cursor
            gsap.to(btnDiscover, {
                x: x * 0.4,
                y: y * 0.4,
                duration: 0.4,
                ease: "power3.out"
            });
            // Move text/icon slightly more for depth
            gsap.to(btnDiscover.querySelectorAll('span'), {
                x: x * 0.2,
                y: y * 0.2,
                duration: 0.4,
                ease: "power3.out"
            });
        });

        btnDiscoverWrap.addEventListener('mouseleave', () => {
            // Reset to center
            gsap.to([btnDiscover, btnDiscover.querySelectorAll('span')], {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: "elastic.out(1, 0.3)"
            });
        });
    }
});

console.log('MBBS Consultancy Website Loaded Successfully! 🎓');
console.log('Ready for Three.js integration in the hero-canvas element');

// ========================================
// CAMPUS NATURE CAROUSEL — Osmo Crisp Slideshow
// ========================================

function initCampusSlideShow(el) {
    if (!el) return;

    // Register GSAP CustomEase if available
    if (typeof CustomEase !== 'undefined') {
        CustomEase.create('slideshow-wipe', '0.625, 0.05, 0, 1');
    }
    const EASE = typeof CustomEase !== 'undefined' ? 'slideshow-wipe' : 'power3.inOut';
    const DURATION = 1.4;

    const slides = Array.from(el.querySelectorAll('.carousel-slide'));
    const parallaxImgs = Array.from(el.querySelectorAll('[data-slideshow="parallax"]'));
    const thumbs = Array.from(el.querySelectorAll('.carousel-thumb'));
    const prevBtn = el.querySelector('.carousel-prev');
    const nextBtn = el.querySelector('.carousel-next');
    const counter = el.querySelector('#carouselCounter');

    let current = 0;
    let animating = false;
    let autoTimer = null;
    const total = slides.length;

    // Attribute data-index on slides for lookup
    slides.forEach((s, i) => s.setAttribute('data-index', i));

    // Set initial state — first slide visible
    slides.forEach((s, i) => {
        if (i === 0) {
            s.classList.add('is--current');
        } else {
            gsap.set(s, { xPercent: 100 });
        }
    });

    function updateUI(idx) {
        thumbs.forEach(t => t.classList.toggle('is--current', parseInt(t.dataset.index) === idx));
        if (counter) counter.textContent = `${idx + 1} / ${total}`;
    }

    function navigate(direction, targetIndex = null) {
        if (animating) return;
        animating = true;

        // Clear mobile text toggle on slide change
        slides.forEach(s => s.classList.remove('show-mobile-text'));

        const previous = current;
        if (targetIndex !== null) {
            current = targetIndex;
        } else {
            current = direction === 1
                ? (current < total - 1 ? current + 1 : 0)
                : (current > 0 ? current - 1 : total - 1);
        }

        const outSlide = slides[previous];
        const outImg = parallaxImgs[previous];
        const inSlide = slides[current];
        const inImg = parallaxImgs[current];

        // Position incoming slide just off screen in the right direction
        gsap.set(inSlide, { xPercent: direction * 100 });

        const tl = gsap.timeline({
            defaults: { duration: DURATION, ease: EASE },
            onStart() {
                inSlide.classList.add('is--current');
                updateUI(current);
            },
            onComplete() {
                outSlide.classList.remove('is--current');
                gsap.set(outSlide, { xPercent: -direction * 100 });
                animating = false;
            }
        })
            .to(outSlide, { xPercent: -direction * 100 }, 0)
            .to(inSlide, { xPercent: 0 }, 0);

        // Only apply parallax if the image elements exist
        if (outImg) tl.to(outImg, { xPercent: direction * 60 }, 0);
        if (inImg) tl.fromTo(inImg, { xPercent: -direction * 60 }, { xPercent: 0 }, 0);
    }

    // Thumb clicks
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const targetIdx = parseInt(thumb.dataset.index, 10);
            if (targetIdx === current || animating) return;
            const dir = targetIdx > current ? 1 : -1;
            stopAuto();
            navigate(dir, targetIdx);
            startAuto();
        });
    });

    // Arrow buttons
    if (prevBtn) prevBtn.addEventListener('click', () => { stopAuto(); navigate(-1); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { stopAuto(); navigate(1); startAuto(); });

    // Keyboard
    el.setAttribute('tabindex', '0');
    el.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') { stopAuto(); navigate(-1); startAuto(); }
        if (e.key === 'ArrowRight') { stopAuto(); navigate(1); startAuto(); }
    });

    // Mobile Tap Toggle (Only if screen <= 991px)
    slides.forEach(slide => {
        slide.addEventListener('click', () => {
            if (window.innerWidth <= 991 && slide.classList.contains('is--current')) {
                slide.classList.toggle('show-mobile-text');
            }
        });
    });

    // Touch swipe
    let touchStartX = 0;
    el.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; stopAuto(); }, { passive: true });
    el.addEventListener('touchend', e => {
        const delta = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(delta) > 50) navigate(delta > 0 ? 1 : -1);
        startAuto();
    }, { passive: true });

    // Pause on hover
    el.addEventListener('mouseenter', stopAuto);
    el.addEventListener('mouseleave', startAuto);

    // Auto-slide (only when in viewport)
    function startAuto() {
        stopAuto();
        autoTimer = setInterval(() => navigate(1), 6000);
    }
    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    const vpObserver = new IntersectionObserver(entries => {
        entries.forEach(e => e.isIntersecting ? startAuto() : stopAuto());
    }, { threshold: 0.4 });
    vpObserver.observe(el);

    // ── Lazy-load carousel images independently of start-heavy-loading event ──
    // Load the first (visible) slide immediately, observe the rest
    function loadLazyImage(img) {
        if (!img) return;
        const src = img.getAttribute('data-src');
        if (!src) return;

        img.src = src;
        img.removeAttribute('data-src');

        // If image is already cached (complete), onload won't fire — check immediately
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.onload = () => img.classList.add('loaded');
            // Even if the image errors, show the slot (don't leave it invisible)
            img.onerror = () => img.classList.add('loaded');
        }
    }

    // Load slide 1 image right now
    const firstImg = slides[0] ? slides[0].querySelector('img[data-src]') : null;
    loadLazyImage(firstImg);

    // Observe remaining slides and load 500px before they enter viewport
    const carouselImgObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target.querySelector('img[data-src]');
                loadLazyImage(img);
                obs.unobserve(entry.target);
            }
        });
    }, { rootMargin: '500px' });

    slides.forEach((slide, i) => {
        if (i !== 0) carouselImgObserver.observe(slide);
    });
    // ─────────────────────────────────────────────────────────────────────────

    updateUI(0);
    console.log(`🎞️ Osmo Slideshow '${el.id}' initialized with ${total} slides`);
}

// Initialize on DOMContentLoaded or loader-finished
function startCarouselInit() {
    initCampusSlideShow(document.getElementById('campusCarousel'));
}
if (document.getElementById('shader-loader')) {
    document.addEventListener('loader-finished', startCarouselInit);
} else {
    document.addEventListener('DOMContentLoaded', startCarouselInit);
}


// ========================================
// CREEPY EYE BUTTON - PUPIL TRACKING
// ========================================
(function initCreepyButton() {
    const btn = document.getElementById('creepyBtn');
    const eyesContainer = document.getElementById('creepyEyes');
    if (!btn || !eyesContainer) return;

    const pupils = btn.querySelectorAll('.creepy-btn__pupil');

    function updateEyes(e) {
        const userEvent = e.touches ? e.touches[0] : e;
        const eyesRect = eyesContainer.getBoundingClientRect();
        const eyesCenterX = eyesRect.left + eyesRect.width / 2;
        const eyesCenterY = eyesRect.top + eyesRect.height / 2;

        const dx = userEvent.clientX - eyesCenterX;
        const dy = userEvent.clientY - eyesCenterY;
        const angle = Math.atan2(-dy, dx) + Math.PI / 2;
        const distance = Math.hypot(dx, dy);

        const visionRangeX = 80;
        const visionRangeY = 35;

        // Calculate raw position
        let x = Math.sin(angle) * distance / visionRangeX;
        let y = Math.cos(angle) * distance / visionRangeY;

        // Clamp values to keep pupil roughly within eye bounds
        // slightly > 1 allows it to disappear into the corner a bit which is realistic
        x = Math.max(-1.3, Math.min(1.3, x));
        y = Math.max(-1.3, Math.min(1.3, y));

        // Add random nervous jitter
        x += (Math.random() - 0.5) * 0.15;
        y += (Math.random() - 0.5) * 0.15;

        const translateX = `${-50 + x * 50}%`;
        const translateY = `${-50 + y * 50}%`;

        pupils.forEach(pupil => {
            pupil.style.transform = `translate(${translateX}, ${translateY})`;
        });
    }

    btn.addEventListener('mousemove', updateEyes, { passive: true });
    btn.addEventListener('touchmove', updateEyes, { passive: true });

    // Also track mouse anywhere near the button area
    document.addEventListener('mousemove', (e) => {
        const btnRect = btn.getBoundingClientRect();
        const proximity = 200; // Track within 200px of button
        if (
            e.clientX > btnRect.left - proximity &&
            e.clientX < btnRect.right + proximity &&
            e.clientY > btnRect.top - proximity &&
            e.clientY < btnRect.bottom + proximity
        ) {
            updateEyes(e);
        }
    }, { passive: true });

    console.log('👁️ Creepy eye button initialized');
})();


// ========================================
// LAZY LOADING HEAVY ASSETS
// ========================================
let __heavyLoadingExecuted = false;
window.addEventListener('start-heavy-loading', () => {
    if (__heavyLoadingExecuted) return;
    __heavyLoadingExecuted = true;

    console.log('🚀 Starting heavy asset loading...');

    // 1. Load Carousel Images
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.onload = () => img.classList.add('loaded'); // Optional for fade-in
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    }, { rootMargin: "200px" }); // Start loading 200px before they appear

    lazyImages.forEach(img => imageObserver.observe(img));

    // 2. Trigger any other deferred logic here (e.g. valid 3D model preloading if needed)
});

// ========================================
// HEAVY ASSET LOADING TRIGGER (ROBUST)
// ========================================
const heavyLoadTrigger = document.getElementById('about');
const heavyLoadFailsafe = document.getElementById('campus-nature'); // Nature section as failsafe

function triggerHeavyLoad(source) {
    if (window.__heavyLoadingStarted) return; // Prevent multiple triggers

    console.log(`⚡ Heavy assets triggered by: ${source}`);
    window.__heavyLoadingStarted = true;
    window.dispatchEvent(new Event('start-heavy-loading'));
}

// 1. Primary Trigger: "About" Section (Preload while reading)
if (heavyLoadTrigger) {
    const aboutObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                triggerHeavyLoad('About Section (Intersecting)');
                aboutObserver.disconnect();
            }
        });
    }, { rootMargin: "200px" }); // 200px before
    aboutObserver.observe(heavyLoadTrigger);

    // Check if we are already past it on load
    const rect = heavyLoadTrigger.getBoundingClientRect();
    if (rect.bottom < 0) {
        triggerHeavyLoad('About Section (Already Scrolled Past)');
    }
}

// 2. Secondary Trigger: "Hostel" Section (Preload Nature section before user reaches it)
const hostelSection = document.getElementById('hostels');
if (hostelSection) {
    const hostelObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                triggerHeavyLoad('Hostel Section Reached (Preloading Nature)');
                hostelObserver.disconnect();
            }
        });
    }, { rootMargin: "0px" });
    hostelObserver.observe(hostelSection);
}

// 3. Fallback: If no triggers found (different page), load immediately
if (!heavyLoadTrigger && !heavyLoadFailsafe) {
    triggerHeavyLoad('No Triggers Found (Immediate Load)');
}

// ========================================
// LIGHTBOX MODAL FUNCTIONALITY
// ========================================
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const lightboxLoader = document.getElementById('lightbox-loader');

    // Select all images from the gallery
    const galleryItems = Array.from(document.querySelectorAll('.gallery-grid-categorized .gallery-item-cat:not(.hidden) img'));
    let currentImageIndex = 0;

    // Function to update gallery items (since filtering hides some)
    function updateGalleryItems() {
        return Array.from(document.querySelectorAll('.gallery-grid-categorized .gallery-item-cat:not(.hidden) img'));
    }

    function openLightbox(index) {
        const visibleItems = updateGalleryItems();
        if (visibleItems.length === 0) return;

        currentImageIndex = index;
        const img = visibleItems[currentImageIndex];

        // Animate out
        lightboxImg.style.opacity = '0';

        if (lightboxLoader) lightboxLoader.classList.add('active');

        setTimeout(() => {
            lightboxImg.src = img.src;
            lightboxCaption.textContent = img.alt || 'Gallery Image';

            if (lightboxCounter) {
                lightboxCounter.textContent = `${currentImageIndex + 1} / ${visibleItems.length}`;
            }

            // Animate in after src changes
            lightboxImg.onload = () => {
                if (lightboxLoader) lightboxLoader.classList.remove('active');
                lightboxImg.style.opacity = '1';
            };
        }, 150);

        if (!lightbox.classList.contains('active')) {
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            // If opening for the first time, fade in immediately
            setTimeout(() => {
                lightboxImg.style.opacity = '1';
            }, 100);
        }
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflowY = 'auto'; // Restore vertical scrolling explicitly
        setTimeout(() => {
            lightboxImg.src = '';
            lightboxCaption.textContent = '';
        }, 400);
    }

    function showNext() {
        const visibleItems = updateGalleryItems();
        currentImageIndex = (currentImageIndex + 1) % visibleItems.length;
        openLightbox(currentImageIndex);
    }

    function showPrev() {
        const visibleItems = updateGalleryItems();
        currentImageIndex = (currentImageIndex - 1 + visibleItems.length) % visibleItems.length;
        openLightbox(currentImageIndex);
    }

    // Attach click events to the parent containers to capture clicks properly
    document.querySelectorAll('.gallery-item-cat').forEach(item => {
        item.addEventListener('click', function (e) {
            const visibleItems = updateGalleryItems();
            const imgElement = this.querySelector('img');
            const index = visibleItems.indexOf(imgElement);
            if (index !== -1) {
                openLightbox(index);
            }
        });
    });

    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showNext();
    });
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrev();
    });

    // Close on clicking outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content-wrapper')) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });

    // Touch / Swipe Navigation for Mobile
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            showNext(); // Swiped left
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            showPrev(); // Swiped right
        }
    }
}

// Re-initialize lightbox when DOM is fully loaded to ensure all images are attached
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
} else {
    initLightbox();
}

// ========================================
// GALLERY FILTERING FUNCTIONALITY
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const galleryTabs = document.querySelectorAll('.gallery-tab');
    const galleryItems = document.querySelectorAll('.gallery-item-cat');

    if (galleryTabs.length > 0 && galleryItems.length > 0) {
        galleryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filterValue = tab.getAttribute('data-category');

                // Remove active class from all tabs
                galleryTabs.forEach(t => t.classList.remove('active'));

                // Add active class to all tabs that share this category (sync top & bottom)
                document.querySelectorAll(`.gallery-tab[data-category="${filterValue}"]`).forEach(t => {
                    t.classList.add('active');
                });

                galleryItems.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.style.display = 'block';
                        // Add a small animation effect
                        item.style.animation = 'none'; // reset
                        item.offsetHeight; /* trigger reflow */
                        item.style.animation = 'galleryScaleIn 0.4s ease-out forwards';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });

        // Ensure initially active tab triggers filtering
        const activeTab = document.querySelector('.gallery-tab.active') || document.querySelector('.gallery-tab');
        if (activeTab) {
            activeTab.click();
        }
    }
});

// ========================================
// FMGE PASSING STUDENTS TESTIMONIALS 2025
// ========================================
(function initFMGETestimonials() {

    // ── Data ──────────────────────────────────────────────────────────────────
    // Replace src with real photos when available.
    const fmgeStudents = [
        {
            name: "Arjun Mehta",
            designation: "FMGE Qualified — March 2025 | Batch of 2024, FEFU",
            quote: "Clearing FMGE on my first attempt after FEFU was a proud moment. The clinical training and problem-solving approach at FEFU prepared me exceptionally well for the exam.",
            src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=500&auto=format&fit=crop"
        },
        {
            name: "Priya Sharma",
            designation: "FMGE Qualified — March 2025 | Batch of 2024, FEFU",
            quote: "FEFU's structured curriculum and dedicated professors made all the difference. I always felt confident going into FMGE because of the strong foundation built during my six years.",
            src: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=500&auto=format&fit=crop"
        },
        {
            name: "Rohan Nair",
            designation: "FMGE Qualified — August 2025 | Batch of 2024, FEFU",
            quote: "The hands-on clinical rotations gave me real-world patient exposure very early. That practical confidence is what carried me through FMGE. Grateful to FEFU and my consultancy.",
            src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=500&auto=format&fit=crop"
        },
        {
            name: "Sneha Reddy",
            designation: "FMGE Qualified — August 2025 | Batch of 2024, FEFU",
            quote: "Studying in Russia sounds daunting, but FEFU made it feel like home. The English-medium program meant zero language barrier, and the FMGE coaching guidance from our seniors was invaluable.",
            src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500&auto=format&fit=crop"
        },
        {
            name: "Karthik Iyer",
            designation: "FMGE Qualified — March 2025 | Batch of 2024, FEFU",
            quote: "The quality of education at FEFU is truly global. Professors who've practised internationally, advanced labs, and a community of over 1,000 Indian students — it all adds up to FMGE success.",
            src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500&auto=format&fit=crop"
        }
    ];

    const container = document.getElementById('fmge-images-container');
    const contentContainer = document.getElementById('fmge-content-container');
    const prevBtn = document.getElementById('fmge-prev');
    const nextBtn = document.getElementById('fmge-next');

    if (!container || !contentContainer || !prevBtn || !nextBtn) return;

    let active = 0;
    let autoTimer = null;
    const total = fmgeStudents.length;

    // ── Helper: random tilt for inactive cards ────────────────────────────────
    function randomRotateY() {
        return Math.floor(Math.random() * 21) - 10;
    }

    // ── Build image slides ────────────────────────────────────────────────────
    function buildSlides() {
        container.innerHTML = '';
        fmgeStudents.forEach((student, index) => {
            const div = document.createElement('div');
            div.className = 'fmge-image-slide';
            div.setAttribute('data-index', index);

            const img = document.createElement('img');
            img.src = student.src;
            img.alt = student.name;
            img.loading = 'lazy';
            div.appendChild(img);
            container.appendChild(div);
        });
    }

    // ── Apply transform to each slide based on active index ───────────────────
    function updateSlides() {
        const slides = container.querySelectorAll('.fmge-image-slide');
        slides.forEach((slide, index) => {
            const isActive = index === active;
            const rot = isActive ? 0 : randomRotateY();
            const scale = isActive ? 1 : 0.95;
            const opacity = isActive ? 1 : 0.7;
            const zIndex = isActive ? 999 : (total + 2 - index);

            slide.style.transform = `rotate(${rot}deg) scale(${scale})`;
            slide.style.opacity = opacity;
            slide.style.zIndex = zIndex;
            slide.style.transition = 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';

            // Bounce-up animation for active slide
            if (isActive) {
                slide.style.transform = `rotate(0deg) scale(1) translateY(0px)`;
                // Tiny bounce using keyframe via class toggle
                slide.classList.add('fmge-active');
                // Remove bounce so it can retrigger next time
                setTimeout(() => slide.classList.remove('fmge-active'), 420);
            } else {
                slide.classList.remove('fmge-active');
            }
        });
    }

    // ── Render quote text with stagger blur-reveal ────────────────────────────
    function renderContent() {
        const student = fmgeStudents[active];
        const words = student.quote.split(' ');

        contentContainer.style.opacity = '0';
        contentContainer.style.transform = 'translateY(20px)';

        setTimeout(() => {
            contentContainer.innerHTML = `
                <h3 class="fmge-student-name">${student.name}</h3>
                <p class="fmge-student-year">${student.designation}</p>
                <p class="fmge-quote">
                    ${words.map((word, i) =>
                        `<span style="filter:blur(8px);opacity:0;transform:translateY(4px);transition:filter 0.25s ease ${i * 0.02}s, opacity 0.25s ease ${i * 0.02}s, transform 0.25s ease ${i * 0.02}s;">${word}&nbsp;</span>`
                    ).join('')}
                </p>`;

            contentContainer.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            contentContainer.style.opacity = '1';
            contentContainer.style.transform = 'translateY(0)';

            // Stagger-reveal each word
            requestAnimationFrame(() => {
                contentContainer.querySelectorAll('.fmge-quote span').forEach(span => {
                    span.style.filter = 'blur(0px)';
                    span.style.opacity = '1';
                    span.style.transform = 'translateY(0)';
                });
            });

            // Re-run lucide icons if they exist (for the nav buttons)
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 200);
    }

    // ── Navigation ────────────────────────────────────────────────────────────
    function goTo(index) {
        active = (index + total) % total;
        updateSlides();
        renderContent();
    }

    function goNext() { goTo(active + 1); }
    function goPrev() { goTo(active - 1); }

    nextBtn.addEventListener('click', () => { stopAuto(); goNext(); startAuto(); });
    prevBtn.addEventListener('click', () => { stopAuto(); goPrev(); startAuto(); });

    // ── Autoplay ──────────────────────────────────────────────────────────────
    function startAuto() {
        stopAuto();
        autoTimer = setInterval(goNext, 5000);
    }
    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    // Pause on hover
    const section = document.querySelector('.fmge-testimonials-section');
    if (section) {
        section.addEventListener('mouseenter', stopAuto);
        section.addEventListener('mouseleave', startAuto);
    }

    // Pause when not visible
    const vpObs = new IntersectionObserver(entries => {
        entries.forEach(e => e.isIntersecting ? startAuto() : stopAuto());
    }, { threshold: 0.3 });
    if (section) vpObs.observe(section);

    // ── Init ──────────────────────────────────────────────────────────────────
    function init() {
        buildSlides();
        updateSlides();
        renderContent();
        startAuto();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Kick off after loader or DOMContentLoaded
    if (document.getElementById('shader-loader')) {
        document.addEventListener('loader-finished', init);
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

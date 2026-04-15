// ============================================
// Hero Section — Static Stars, Title Animation,
// Globe Animation, Stats Counter
// ============================================

function initHeroBackground() {
    const heroSection = document.querySelector('.hero-section');

    // ---- 1. Static Stars (CSS-only, dark mode) ----
    // Stars are handled purely via CSS on .hero-stars-layer
    // No JS needed — just tiny white dots via box-shadow
    // They auto-hide in light mode via theme.css

    // Nothing else to initialize for the background.
    // SVG paths and canvas particles have been removed for performance.
}

function startHeroTextAnimations() {
    const titleEl = document.getElementById('animated-hero-title');
    if (titleEl) {

        titleEl.style.webkitTextFillColor = 'unset';
        titleEl.style.color = '#fff';
        titleEl.innerHTML = '';

        // Create container for the expanding text
        const textWrapper = document.createElement('div');
        textWrapper.className = 'fefu-expand-wrapper';
        textWrapper.style.display = 'flex';
        textWrapper.style.justifyContent = 'center';
        textWrapper.style.flexWrap = 'wrap';
        titleEl.appendChild(textWrapper);

        // Define the words and their target states
        const wordsData = [
            { letter: 'F', rest: 'ar', full: 'Far' },
            { letter: 'E', rest: 'astern', full: 'Eastern' },
            { letter: 'F', rest: 'ederal', full: 'Federal' },
            { letter: 'U', rest: 'niversity', full: 'University' }
        ];

        wordsData.forEach((wData, index) => {
            const wordContainer = document.createElement('div');
            wordContainer.style.display = 'inline-flex';
            wordContainer.style.marginRight = index < 3 ? '0em' : '0';
            wordContainer.className = 'fefu-word-container';

            const mainLetter = document.createElement('span');
            mainLetter.textContent = wData.letter;
            mainLetter.className = 'fefu-main-letter';
            mainLetter.style.display = 'inline-block';
            mainLetter.style.opacity = '0';

            const restOfWord = document.createElement('span');
            restOfWord.textContent = wData.rest;
            restOfWord.className = 'fefu-rest-word';
            restOfWord.style.display = 'inline-block';
            restOfWord.style.opacity = '0';
            restOfWord.style.width = '0px';
            restOfWord.style.overflow = 'hidden';

            wordContainer.appendChild(mainLetter);
            wordContainer.appendChild(restOfWord);
            textWrapper.appendChild(wordContainer);
        });
    }

    if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline();

        // ---- Text Splitting Helper for Eyebrow & Subtitle ----
        const splitTextIntoSpans = (element) => {
            if (!element) return [];
            const text = element.innerText.trim();
            element.innerHTML = '';
            const words = text.split(/\s+/);
            const spans = [];
            words.forEach((word) => {
                const span = document.createElement('span');
                span.style.display = 'inline-block';
                span.style.marginRight = '0.25em';
                span.style.opacity = '0';
                span.innerText = word;
                element.appendChild(span);
                spans.push(span);
            });
            return spans;
        };

        const eyebrow = document.getElementById('hero-eyebrow');
        let eyebrowSpans = [];
        if (eyebrow) {
            eyebrow.style.opacity = '1';
            eyebrowSpans = splitTextIntoSpans(eyebrow);
        }

        const subtitle = document.getElementById('hero-subtitle');
        let subtitleSpans = [];
        if (subtitle) {
            subtitle.style.opacity = '1';
            subtitleSpans = splitTextIntoSpans(subtitle);
        }

        // Setup 3D Perspective for the massive title
        gsap.set('.fefu-expand-wrapper', { perspective: 800 });

        // 0. Reveal Eyebrow stagger
        if (eyebrowSpans.length > 0) {
            tl.to(eyebrowSpans, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(1.7)' }, 'start');
        }

        // 1. Reveal "F E F U" with a cinematic 3D focus pull
        tl.fromTo('.fefu-main-letter', {
            y: 60,
            opacity: 0,
            rotateX: -80,
            transformOrigin: "50% 50% -50px",
            filter: "blur(15px)",
            scale: 1.2
        }, {
            y: 0,
            opacity: 1,
            rotateX: 0,
            filter: "blur(0px)",
            scale: 1,
            duration: 1.6,
            ease: "expo.out",
            stagger: 0.15
        }, 'start+=0.2');

        // 2. Pause to build anticipation
        tl.to({}, { duration: 0.15 });

        // Globe placement: purely touch vs mouse — no arbitrary pixel breakpoints
        // pointer:coarse = any touch device (phone, tablet, iPad in any orientation)
        // pointer:fine   = mouse/trackpad = desktop
        const isTouchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
        const isMobile = window.innerWidth <= 768;          // phones (touch + small screen)
        const isTablet = isTouchDevice && !isMobile;        // any touch device larger than a phone
        const isDesktop = !isTouchDevice;                   // mouse/trackpad device

        // GLOBE ANIMATION (Deep Space Zoom + Fast-to-Slow Spin)
        if (!window.globeSettings) window.globeSettings = {};
        window.globeSettings.speed = 0.3;

        // Shared initial states (all devices)
        gsap.set('#animated-hero-title', { filter: 'drop-shadow(0px 0px 0px rgba(0,0,0,0))' });
        gsap.set('.hero-subtitle', { textShadow: '0px 0px 0px rgba(0,0,0,0)' });
        gsap.set('.theme-toggle', { opacity: 0, pointerEvents: 'none' });
        gsap.set('.hero-stars-layer', { scale: 0.85, opacity: 0, rotate: -5 });

        // Stars Phase 1 (all devices)
        tl.to('.hero-stars-layer', {
            opacity: 0.4, scale: 0.95, rotate: -2, duration: 0.4, ease: "power2.inOut"
        }, 'start');

        if (isDesktop) {
            // ── DESKTOP: container = full viewport (transparent wrapper)
            //    Canvas is animated directly so globe stays proportional on window resize.
            gsap.set('.globe-container', { opacity: 0, filter: "blur(20px)" });
            gsap.set('.globe-canvas', {
                x: 0,           // CSS left:9% already positions it; no extra offset needed
                y: "-30vh",     // start above, animate down into position
                scale: 0.1,
                rotate: 0
            });

            // Phase 1: Emerge from deep space
            tl.to('.globe-container', {
                opacity: 1,
                filter: "blur(10px)",
                duration: 0.4,
                ease: "power2.inOut"
            }, 'start');
            tl.to('.globe-canvas', {
                scale: 0.2,
                duration: 0.4,
                ease: "power2.inOut"
            }, 'start');

            // Phase 2: Snap into final position
            tl.to('.globe-container', {
                opacity: 0.90,
                filter: "blur(0px)",
                duration: 1.1,
                ease: "expo.inOut"
            }, 'expand');
            tl.to('.globe-canvas', {
                x: 0,
                y: 0,
                scale: 1.09,
                rotate: 0,
                duration: 1.1,
                ease: "expo.inOut"
            }, 'expand');

        } else {
            // ── TOUCH (tablet / mobile): container is full-screen, GSAP moves container
            gsap.set('.globe-container', {
                x: 6,
                y: isMobile ? -54 : -54,
                xPercent: -50,
                scale: 0.1,
                rotate: 0,
                opacity: 0,
                filter: "blur(20px)"
            });

            // Phase 1: Emerge from deep space
            tl.to('.globe-container', {
                opacity: 1,
                filter: "blur(10px)",
                scale: 0.4,
                xPercent: -50,
                duration: 0.4,
                ease: "power2.inOut"
            }, 'start');

            // Phase 2: Snap into final position
            tl.to('.globe-container', {
                x: 6,
                y: 214,
                xPercent: -50,
                scale: 1.46,
                rotate: 0,
                opacity: 0.90,
                filter: "blur(0px)",
                duration: 1.1,
                ease: "expo.inOut"
            }, 'expand');
        }

        tl.to('.hero-stars-layer', {
            opacity: 0.9,
            scale: 1,
            rotate: 0,
            duration: 1.1,
            ease: "expo.out"
        }, 'expand');

        // Restore text shadows and theme toggle slowly as globe expands
        tl.to('#animated-hero-title', { 
            filter: 'drop-shadow(0px 2px 20px rgba(0,0,0,0.8))', 
            duration: 1.1, 
            ease: "power2.inOut" 
        }, 'expand');
        tl.to('.hero-subtitle', { 
            textShadow: '0px 2px 12px rgba(0,0,0,0.7)', 
            duration: 1.1, 
            ease: "power2.inOut"
        }, 'expand+=0.2');
        tl.to('.theme-toggle', { 
            opacity: 1, 
            pointerEvents: 'auto', 
            duration: 1.0, 
            ease: "power2.out" 
        }, 'expand+=0.5');

        // Fast-to-Slow Spin physics: Apply dramatic friction over time
        tl.to(window.globeSettings, {
            speed: 0.012, // The normal, majestic resting speed
            duration: 1.5, // Friction lasts the exact 1.5s entry sequence
            ease: "expo.out"
        }, 'start');

        // 3. Expand the words gracefully
        tl.to('.fefu-word-container', {
            marginRight: (i) => i < 3 ? '0.35em' : '0',
            duration: 1.1,
            ease: "power4.inOut"
        }, 'expand');

        // 4. Reveal the rest of the letters
        tl.fromTo('.fefu-rest-word', {
            width: '0px',
            opacity: 0,
            filter: "blur(6px)",
            color: "#6b96e6"
        }, {
            width: 'auto',
            opacity: 1,
            filter: "blur(0px)",
            color: "#ffffff",
            duration: 1.1,
            ease: "power4.inOut"
        }, 'expand');

        // 5. Reveal Subtitle words elegantly
        if (subtitleSpans.length > 0) {
            tl.fromTo(subtitleSpans,
                { opacity: 0, y: 15, filter: "blur(4px)" },
                { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.03, ease: 'power2.out' }, 'expand+=0.5');
        }

        const ctaRow = document.querySelector('.hero-cta-row');
        if (ctaRow) tl.to(ctaRow, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 'expand+=1.0');

        const statsRow = document.getElementById('hero-stats-row');
        if (statsRow) tl.to(statsRow, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 'expand+=1.2');

        const scrollInd = document.getElementById('hero-scroll-indicator');
        const swipeInd = document.querySelector('.hero-swipe-indicator');
        if (scrollInd) tl.to(scrollInd, { opacity: 1, duration: 0.5 }, 'expand+=1.5');
        if (swipeInd) tl.to(swipeInd, { opacity: 1, duration: 0.5 }, 'expand+=1.5');

        // ---- Stats Counter ----
        tl.add(() => {
            let isReload = false;
            if (performance.navigation && performance.navigation.type === 1) {
                isReload = true;
            } else if (window.performance && performance.getEntriesByType && performance.getEntriesByType("navigation").length > 0) {
                isReload = performance.getEntriesByType("navigation")[0].type === "reload";
            }
            
            const isAlreadyAnimated = !isReload && sessionStorage.getItem('heroAnimated');
            const statNumbers = document.querySelectorAll('.hero-stat-number[data-count]');
            statNumbers.forEach(el => {
                const target = parseInt(el.getAttribute('data-count'), 10);
                if (isAlreadyAnimated) {
                    el.textContent = target.toLocaleString();
                } else {
                    const obj = { val: 0 };
                    gsap.to(obj, {
                        val: target, duration: 1.5,
                        ease: 'power2.out',
                        onUpdate: () => {
                            el.textContent = Math.round(obj.val).toLocaleString();
                        }
                    });
                }
            });
        }, 'expand+=1.2');

        // Check if the user explicitly refreshed/reloaded the page
        let isReload = false;
        if (performance.navigation && performance.navigation.type === 1) {
            isReload = true;
        } else if (window.performance && performance.getEntriesByType && performance.getEntriesByType("navigation").length > 0) {
            isReload = performance.getEntriesByType("navigation")[0].type === "reload";
        }

        if (!isReload && sessionStorage.getItem('heroAnimated')) {
            tl.progress(1);
            // On instant skip, ensure toggles/shadows are fully restored
            gsap.set('#animated-hero-title', { filter: 'drop-shadow(0px 2px 20px rgba(0,0,0,0.8))' });
            gsap.set('.hero-subtitle', { textShadow: '0px 2px 12px rgba(0,0,0,0.7)' });
            gsap.set('.theme-toggle', { opacity: 1, pointerEvents: 'auto' });
        } else {
            sessionStorage.setItem('heroAnimated', 'true');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Hide original text to avoid flicker
    const titleEl = document.getElementById('animated-hero-title');
    if (titleEl && !titleEl.innerHTML.includes('anim-word')) {
        titleEl.style.color = "transparent";
    }

    if (document.getElementById('shader-loader')) {
        document.addEventListener('loader-finished', () => {
            const hero = document.getElementById('hero');
            if (hero) hero.classList.add('revealed');

            initHeroBackground();
            if (titleEl) titleEl.style.color = "";
            startHeroTextAnimations();
        });
    } else {
        const hero = document.getElementById('hero');
        if (hero) hero.classList.add('revealed');

        initHeroBackground();
        if (titleEl) titleEl.style.color = "";
        startHeroTextAnimations();
    }
});

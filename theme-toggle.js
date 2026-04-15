/**
 * Theme Toggle — Premium Light/Dark Mode Switcher
 * ─────────────────────────────────────────────────
 * ✦ Morphing Sun ↔ Moon icon inside the thumb
 * ✦ Cinematic radial ripple page transition
 * ✦ Contextual warm/cool glow aura
 * ✦ Spring physics with overshoot bounce
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'fefu-theme';

    /* ── Helpers ───────────────────────────── */

    function getInitialTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
        return 'dark';
    }

    function setThemeAttribute(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        refreshLordIcons();
    }

    function refreshLordIcons() {
        // Some lord-icons need a push to re-read CSS variables in the 'colors' attribute
        const icons = document.querySelectorAll('lord-icon');
        icons.forEach(icon => {
            const colors = icon.getAttribute('colors');
            if (colors) {
                icon.setAttribute('colors', colors); // Trigger attribute change
            }
        });
    }

    /* ── Radial Ripple Transition ──────────── */

    function performRadialTransition(newTheme, btnRect, onApply) {
        // Respect reduced-motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            onApply();
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'theme-ripple-overlay';

        // Origin = center of the toggle button
        const x = btnRect.left + btnRect.width / 2;
        const y = btnRect.top + btnRect.height / 2;

        // Radius large enough to cover the whole viewport
        const maxRadius = Math.ceil(Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        ));

        overlay.style.setProperty('--ripple-color', newTheme === 'light' ? '#f5f5f7' : '#0a0a0f');
        overlay.style.setProperty('--ripple-x', x + 'px');
        overlay.style.setProperty('--ripple-y', y + 'px');
        overlay.style.setProperty('--ripple-radius', maxRadius + 'px');

        document.body.appendChild(overlay);
        overlay.offsetHeight; // force reflow
        overlay.classList.add('expanding');

        // Apply the actual theme while the overlay still covers the viewport
        setTimeout(onApply, 350);

        // Clean up
        overlay.addEventListener('animationend', () => overlay.remove());
        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 1200);
    }

    /* ── Apply Theme ──────────────────────── */

    function applyTheme(theme, animate, btnRect) {
        const apply = () => {
            setThemeAttribute(theme);
            updateButtonIcon(theme);

            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.setAttribute('content', theme === 'light' ? '#f5f5f7' : '#000000');
            }
        };

        if (animate && btnRect) {
            document.documentElement.classList.add('theme-transitioning');
            setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 800);
            performRadialTransition(theme, btnRect, apply);
        } else {
            apply();
        }

        localStorage.setItem(STORAGE_KEY, theme);
    }

    /* ── Update Button State ──────────────── */

    function updateButtonIcon(theme) {
        const btn = document.getElementById('theme-toggle-btn');
        if (!btn) return;

        btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        btn.title = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';

        if (theme === 'light') {
            btn.classList.add('is-light');
        } else {
            btn.classList.remove('is-light');
        }
    }

    /* ── Create Toggle Button ─────────────── */

    function createToggleButton() {
        const btn = document.createElement('button');
        btn.id = 'theme-toggle-btn';
        btn.className = 'theme-toggle';
        btn.setAttribute('aria-label', 'Toggle theme');
        btn.type = 'button';

        // Fix visibility on non-homepage pages 
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || document.getElementById('globe-container')) {
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
        } else {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'all';
        }

        btn.innerHTML = `
            <div class="theme-toggle-track">
                <div class="toggle-scene-stars"></div>
                <div class="toggle-scene-clouds"></div>
                <div class="theme-toggle-thumb">
                    <div class="toggle-icon-wrap">
                        <svg class="toggle-icon sun-icon" viewBox="0 0 24 24" fill="none">
                            <circle class="sun-core" cx="12" cy="12" r="5" fill="currentColor"/>
                            <g class="sun-rays">
                                <line x1="12" y1="1"  x2="12" y2="3"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <line x1="1"  y1="12" x2="3"  y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </g>
                        </svg>
                        <svg class="toggle-icon moon-icon" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="thumb-glow-aura"></div>
                </div>
            </div>
        `;

        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            const rect = btn.getBoundingClientRect();
            applyTheme(next, true, rect);
        });

        function placeToggle() {
            const mobileNav = document.querySelector('.sidebar-mobile');
            if (window.innerWidth <= 1024 && mobileNav) {
                mobileNav.appendChild(btn);
            } else {
                document.body.appendChild(btn);
            }
        }
        
        placeToggle();
        
        // Handle screen resizing
        window.addEventListener('resize', () => {
            placeToggle();
        });
    }

    /* ── Init ──────────────────────────────── */

    function init() {
        const theme = getInitialTheme();
        applyTheme(theme, false);
        createToggleButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

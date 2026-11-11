/**
 * Sidebar Vanilla JS
 * Handles mobile drawer open/close and scroll effects
 */
(function() {
    'use strict';

    function initSidebar() {
        const closeToggle = document.getElementById('sidebar-close-toggle');
        const drawer = document.getElementById('sidebar-mobile-drawer');
        const mobileBar = document.querySelector('.sidebar-mobile');

        if (!drawer) return;

        const inertBackground = new Map();

        function getMenuToggle() {
            return document.getElementById('sidebar-menu-toggle');
        }

        function syncMenuToggle() {
            const menuToggle = getMenuToggle();
            if (!menuToggle) return false;

            const isOpen = drawer.classList.contains('open');
            menuToggle.setAttribute('aria-controls', drawer.id);
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
            return true;
        }

        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', 'Site navigation');
        drawer.setAttribute('aria-hidden', 'true');
        drawer.inert = true;

        if (!syncMenuToggle()) {
            const toggleObserver = new MutationObserver(() => {
                if (syncMenuToggle()) toggleObserver.disconnect();
            });
            toggleObserver.observe(document.documentElement, { childList: true, subtree: true });
        }

        function setBackgroundInert(isInert) {
            Array.from(document.body.children).forEach((element) => {
                if (element === drawer || element.contains(drawer) || ['SCRIPT', 'STYLE', 'TEMPLATE'].includes(element.tagName)) return;

                if (isInert) {
                    if (!inertBackground.has(element)) {
                        inertBackground.set(element, {
                            ariaHidden: element.getAttribute('aria-hidden'),
                            supportsInert: 'inert' in element,
                            inert: 'inert' in element ? element.inert : false
                        });
                    }
                    const previousState = inertBackground.get(element);
                    if (previousState.supportsInert) element.inert = true;
                    element.setAttribute('aria-hidden', 'true');
                } else if (inertBackground.has(element)) {
                    const previousState = inertBackground.get(element);
                    if (previousState.supportsInert) element.inert = previousState.inert;
                    if (previousState.ariaHidden === null) {
                        element.removeAttribute('aria-hidden');
                    } else {
                        element.setAttribute('aria-hidden', previousState.ariaHidden);
                    }
                    inertBackground.delete(element);
                }
            });
        }

        function focusElement(element) {
            if (element) element.focus({ preventScroll: true });
        }

        function getDrawerFocusableElements() {
            return Array.from(drawer.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )).filter((element) => element.getClientRects().length > 0);
        }

        function openDrawer() {
            if (drawer.classList.contains('open')) return;

            drawer.inert = false;
            drawer.setAttribute('aria-hidden', 'false');
            drawer.classList.add('open');
            document.body.classList.add('mobile-drawer-open');
            syncMenuToggle();
            if (mobileBar) {
                mobileBar.classList.remove('nav-hidden');
            }
            focusElement(document.getElementById('sidebar-close-toggle') || getDrawerFocusableElements()[0]);
            setBackgroundInert(true);
        }

        function closeDrawer({ restoreFocus = false } = {}) {
            if (!drawer.classList.contains('open')) return;

            const focusWasInside = drawer.contains(document.activeElement);
            drawer.classList.remove('open');
            document.body.classList.remove('mobile-drawer-open');
            drawer.setAttribute('aria-hidden', 'true');
            drawer.inert = true;
            setBackgroundInert(false);
            syncMenuToggle();

            const menuToggle = getMenuToggle();
            if ((restoreFocus || focusWasInside) && menuToggle) {
                focusElement(menuToggle);
            }
        }

        if (closeToggle) {
            closeToggle.addEventListener('click', () => closeDrawer({ restoreFocus: true }));
        }

        document.addEventListener('click', (e) => {
            if (e.target.closest('#sidebar-menu-toggle')) {
                if (drawer.classList.contains('open')) {
                    closeDrawer({ restoreFocus: true });
                } else {
                    openDrawer();
                }
                return;
            }

            if (drawer.classList.contains('open') && !e.target.closest('#sidebar-mobile-drawer')) {
                closeDrawer();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (!drawer.classList.contains('open')) return;

            if (e.key === 'Escape') {
                closeDrawer({ restoreFocus: true });
                return;
            }

            if (e.key !== 'Tab') return;

            const focusableElements = getDrawerFocusableElements();
            if (!focusableElements.length) {
                e.preventDefault();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const focusIsOutsideDrawer = !drawer.contains(document.activeElement);

            if (e.shiftKey && (document.activeElement === firstElement || focusIsOutsideDrawer)) {
                e.preventDefault();
                focusElement(lastElement);
            } else if (!e.shiftKey && (document.activeElement === lastElement || focusIsOutsideDrawer)) {
                e.preventDefault();
                focusElement(firstElement);
            }
        });

        // Scroll effect for mobile top bar
        if (mobileBar) {
            let lastScroll = window.scrollY;
            let ticking = false;

            function updateMobileBar() {
                const currentScroll = window.scrollY;
                const delta = currentScroll - lastScroll;

                mobileBar.classList.toggle('scrolled', currentScroll > 32);

                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (prefersReducedMotion) {
                    mobileBar.classList.remove('nav-hidden');
                } else if (!drawer.classList.contains('open')) {
                    if (delta > 8 && currentScroll > 180) {
                        mobileBar.classList.add('nav-hidden');
                    } else if (delta < -8 || currentScroll < 140) {
                        mobileBar.classList.remove('nav-hidden');
                    }
                }

                lastScroll = currentScroll;
                ticking = false;
            }

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(updateMobileBar);
                    ticking = true;
                }
            }, { passive: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }
})();

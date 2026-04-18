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

        function openDrawer() {
            drawer.classList.add('open');
            document.body.classList.add('mobile-drawer-open');
            if (mobileBar) {
                mobileBar.classList.remove('nav-hidden');
            }
        }

        function closeDrawer() {
            drawer.classList.remove('open');
            document.body.classList.remove('mobile-drawer-open');
        }

        if (closeToggle) {
            closeToggle.addEventListener('click', closeDrawer);
        }

        document.addEventListener('click', (e) => {
            if (e.target.closest('#sidebar-menu-toggle')) {
                openDrawer();
                return;
            }

            if (drawer.classList.contains('open') && !e.target.closest('#sidebar-mobile-drawer')) {
                closeDrawer();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && drawer.classList.contains('open')) {
                closeDrawer();
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

                if (!drawer.classList.contains('open')) {
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

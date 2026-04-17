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
            let lastScroll = 0;
            
            window.addEventListener('scroll', () => {
                const currentScroll = window.scrollY;
                
                if (currentScroll > 100) {
                    mobileBar.classList.add('scrolled');
                } else {
                    mobileBar.classList.remove('scrolled');
                }
                
                if (currentScroll > lastScroll && currentScroll > 200) {
                    mobileBar.classList.add('nav-hidden');
                } else {
                    mobileBar.classList.remove('nav-hidden');
                }
                
                lastScroll = currentScroll;
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }
})();

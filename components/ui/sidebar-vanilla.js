/* Sidebar Vanilla JS - Robust Version */
document.addEventListener('click', (e) => {
    const menuToggle = e.target.closest('#sidebar-menu-toggle');
    const closeToggle = e.target.closest('#sidebar-close-toggle');
    const mobileDrawer = document.getElementById('sidebar-mobile-drawer');

    if (menuToggle && mobileDrawer) {
        mobileDrawer.classList.toggle('open');
        document.body.classList.toggle('mobile-drawer-open');
    }

    if (closeToggle && mobileDrawer) {
        mobileDrawer.classList.remove('open');
        document.body.classList.remove('mobile-drawer-open');
    }

    // Auto-close drawer when clicking on links
    const sidebarLink = e.target.closest('.sidebar-mobile-drawer .sidebar-link');
    if (sidebarLink && mobileDrawer) {

        // Let CSS animate out smoothly instead of a harsh clip
        mobileDrawer.classList.remove('open');

        // Wait just a moment for the drawer to visibly slide away before snapping the background scroll
        setTimeout(() => {
            document.body.classList.remove('mobile-drawer-open');
        }, 300); // 300ms matches the CSS transition time
    }
});

/* ========================================
   MOBILE NAVBAR — Smart Scroll Behavior
   ======================================== */
(function () {
    const mobileNav = document.querySelector('.sidebar-mobile');
    if (!mobileNav) return;

    let lastScrollY = 0;
    let ticking = false;
    const SCROLL_THRESHOLD = 40;   // px before "scrolled" pill activates
    const DELTA_THRESHOLD = 8;     // px scroll delta to trigger hide/show

    function onScroll() {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY;
        const drawerOpen = document.body.classList.contains('mobile-drawer-open');

        // Don't hide/show when drawer is open
        if (!drawerOpen) {
            // Floating pill state
            if (currentY > SCROLL_THRESHOLD) {
                mobileNav.classList.add('scrolled');
            } else {
                mobileNav.classList.remove('scrolled');
            }

            // Hide on scroll down, show on scroll up
            if (delta > DELTA_THRESHOLD && currentY > 80) {
                mobileNav.classList.add('nav-hidden');
            } else if (delta < -DELTA_THRESHOLD) {
                mobileNav.classList.remove('nav-hidden');
            }
        }

        lastScrollY = currentY;
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });
})();

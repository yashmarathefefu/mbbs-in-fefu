/**
 * Hostel Section — Clickable Tab Pills
 * ─────────────────────────────────────
 * Left side: Canvas/Video stays sticky via CSS.
 * Right side: Tab pills at the top let users click to switch between
 *             Dorms / Safety / Pricing cards with smooth fade transitions.
 *
 * No scroll hijacking — clean tab-based navigation.
 */
document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('hostels');
    if (!section) return;

    const tabsContainer = document.getElementById('hostelTabs');
    const indicator = document.getElementById('hostelTabIndicator');
    const tabs = tabsContainer ? tabsContainer.querySelectorAll('.hostel-tab') : [];
    const cards = section.querySelectorAll('.hostel-text-column .timeline-entry');

    if (!tabs.length || !cards.length || !indicator) return;



    let activeIndex = 0;

    /**
     * Move the sliding indicator behind the active tab
     */
    function moveIndicator(index) {
        const tab = tabs[index];
        if (!tab || !indicator) return;

        const tabRect = tab.getBoundingClientRect();
        const containerRect = tabsContainer.getBoundingClientRect();

        const offsetLeft = tab.offsetLeft - 5; // 5px = container padding
        indicator.style.width = `${tabRect.width}px`;
        indicator.style.transform = `translateX(${offsetLeft}px)`;
    }

    /**
     * Activate a card by index
     */
    function activateCard(index) {
        if (index === activeIndex && cards[index].classList.contains('tab-active')) return;

        activeIndex = index;

        // Update tabs
        tabs.forEach((tab, i) => {
            tab.classList.toggle('active', i === index);
        });

        // Update cards
        cards.forEach((card, i) => {
            if (i === index) {
                card.classList.add('tab-active');
                card.classList.add('active'); // For .timeline-entry.active CSS styles
                card.classList.add('revealed');
            } else {
                card.classList.remove('tab-active');
                card.classList.remove('active');
            }
        });

        // Move indicator
        moveIndicator(index);
    }

    function init() {
        activateCard(0);
        // Small delay to let layout settle before positioning indicator
        requestAnimationFrame(() => {
            moveIndicator(0);
        });
    }

    // ── Tab click handlers ──
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            activateCard(index);
        });
    });

    // ── Keyboard navigation ──
    tabsContainer.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = (activeIndex + 1) % cards.length;
            activateCard(next);
            tabs[next].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = (activeIndex - 1 + cards.length) % cards.length;
            activateCard(prev);
            tabs[prev].focus();
        }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            activateCard(activeIndex);
        }, 150);
    });

    // ── Init ──
    init();
});

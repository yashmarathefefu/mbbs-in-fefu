document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('timelineContainer');
    const timelineProgress = document.getElementById('timelineProgress');
    const allEntries = document.querySelectorAll('.timeline-entry');
    // Hostel entries are managed by hostel-scroll.js tabs on desktop
    const isHostelEntry = (el) => el.closest('.hostel-text-column');
    const timelineEntries = [...allEntries].filter(el => !isHostelEntry(el));

    if (!timelineContainer || !timelineProgress) return;

    // Intersection Observer for Reveal Animations (non-hostel entries)
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.15
    });

    timelineEntries.forEach(entry => revealObserver.observe(entry));

    function updateTimeline() {
        const containerRect = timelineContainer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const startPoint = windowHeight * 0.85;
        const endPoint = windowHeight * 0.15;
        const containerTop = containerRect.top;
        const containerHeight = containerRect.height;

        // Progress bar (non-hostel timelines only)
        if (!timelineContainer.closest('.hostel-text-column')) {
            let progress = 0;
            if (containerTop < startPoint) {
                const scrolledDistance = startPoint - containerTop;
                const totalScrollableDistance = containerHeight + (startPoint - endPoint);
                progress = (scrolledDistance / totalScrollableDistance) * 100;
            }
            progress = Math.max(0, Math.min(100, progress));
            requestAnimationFrame(() => {
                timelineProgress.style.height = `${progress}%`;
            });
        }

        // Active state (non-hostel only)
        timelineEntries.forEach((entry) => {
            const entryRect = entry.getBoundingClientRect();
            const entryCenter = entryRect.top + (entryRect.height / 2);
            const viewportCenter = windowHeight / 2;

            if (Math.abs(entryCenter - viewportCenter) < 200) {
                entry.classList.add('active');
            } else {
                entry.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', updateTimeline);
    updateTimeline();
});

(function () {
    'use strict';

    function init() {
        if (window.lucide) window.lucide.createIcons();

        if (window.gsap && window.ScrollTrigger) {
            window.gsap.registerPlugin(window.ScrollTrigger);
            document.querySelectorAll('.text-highlight').forEach(function (highlight) {
                window.ScrollTrigger.create({
                    trigger: highlight,
                    start: window.innerWidth < 768 ? 'top 95%' : 'top 86%',
                    onEnter: function () { highlight.classList.add('active'); }
                });
            });
        } else {
            document.querySelectorAll('.text-highlight').forEach(function (highlight) {
                highlight.classList.add('active');
            });
        }

        var galleryBtn = document.getElementById('gallery-btn');
        if (galleryBtn) {
            var pupils = galleryBtn.querySelectorAll('.creepy-btn__pupil');
            galleryBtn.addEventListener('mousemove', function (event) {
                var rect = galleryBtn.getBoundingClientRect();
                var x = (event.clientX - rect.left) / rect.width - 0.5;
                var y = (event.clientY - rect.top) / rect.height - 0.5;
                pupils.forEach(function (pupil) {
                    pupil.style.transform = 'translate(calc(-50% + ' + (x * 6) + 'px), calc(-50% + ' + (y * 6) + 'px))';
                });
            });
            galleryBtn.addEventListener('mouseleave', function () {
                pupils.forEach(function (pupil) {
                    pupil.style.transform = 'translate(-50%, -50%)';
                });
            });
        }

        if (window.supabase && window.supabase.createClient && !window.supabaseClient) {
            window.supabaseClient = window.supabase.createClient(
                'https://ibspwomnrilukdcumsix.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic3B3b21ucmlsdWtkY3Vtc2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjUxMTUsImV4cCI6MjA4NjU0MTExNX0.ScRhoEVYXABEozmUpQbEktsBD6twvF8lHdD4xXr5rpY'
            );
            window.dispatchEvent(new CustomEvent('supabase-ready', { detail: { client: window.supabaseClient } }));
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

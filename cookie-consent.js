/**
 * FEFU Cookie Consent and Enhanced Analytics Initialization
 */
(function() {
    'use strict';

    const CONSENT_KEY = 'fefu_cookie_consent';

    function createBanner() {
        if (localStorage.getItem(CONSENT_KEY)) return;

        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <h4>🍪 Cookie Preferences</h4>
                <p>We use cookies and analytics to understand how students browse our site. This helps us provide better counseling for the 2026 intake. Read our <a href="privacy.html">Privacy Policy</a>.</p>
            </div>
            <div class="cookie-actions">
                <button class="cookie-btn btn-settings" id="cookieDecline">Later</button>
                <button class="cookie-btn btn-accept" id="cookieAccept">Accept All</button>
            </div>
        `;
        document.body.appendChild(banner);

        // Animate in
        setTimeout(() => banner.classList.add('active'), 1000);

        document.getElementById('cookieAccept').addEventListener('click', () => {
            localStorage.setItem(CONSENT_KEY, 'accepted');
            banner.classList.remove('active');
            setTimeout(() => banner.remove(), 500);
            initializeEnhancedTracking();
        });

        document.getElementById('cookieDecline').addEventListener('click', () => {
            localStorage.setItem(CONSENT_KEY, 'declined');
            banner.classList.remove('active');
            setTimeout(() => banner.remove(), 500);
        });
    }

    function initializeEnhancedTracking() {
        console.log("FEFU: Enhanced tracking enabled with user consent.");
        // We can add Google Analytics 4 or Meta Pixel here in the future
        // For now, we enhance our internal internal tracking
        window.fefuConsentGained = true;
    }

    // Tracking for specific interactive elements
    function trackInteractions() {
        // Track clicks on external links (like FEFU official site)
        document.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.href.indexOf(window.location.hostname) === -1) {
                    console.log('External Link Clicked:', link.href);
                    // This data can be pushed to Supabase if needed
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createBanner();
            trackInteractions();
            if (localStorage.getItem(CONSENT_KEY) === 'accepted') {
                initializeEnhancedTracking();
            }
        });
    } else {
        createBanner();
        trackInteractions();
        if (localStorage.getItem(CONSENT_KEY) === 'accepted') {
            initializeEnhancedTracking();
        }
    }
})();

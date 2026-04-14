/*
 * FEFU Page View Tracker
 * Tracks page views + time spent for analytics dashboard
 * Uses localStorage visitor_id and Supabase sendBeacon
 */
(function () {
    'use strict';

    var SUPABASE_URL = 'https://ibspwomnrilukdcumsix.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic3B3b21ucmlsdWtkY3Vtc2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjUxMTUsImV4cCI6MjA4NjU0MTExNX0.ScRhoEVYXABEozmUpQbEktsBD6twvF8lHdD4xXr5rpY';

    // Don't track admin page
    if (window.location.pathname.indexOf('admin') !== -1) return;

    // ---- Visitor ID ----
    var VID_KEY = 'fefu_visitor_id';
    var VISIT_COUNT_KEY = 'fefu_visit_count';
    var visitorId = localStorage.getItem(VID_KEY);
    if (!visitorId) {
        visitorId = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(VID_KEY, visitorId);
        localStorage.setItem(VISIT_COUNT_KEY, '0');
    }

    // Increment visit count (per-session via sessionStorage flag)
    if (!sessionStorage.getItem('fefu_session_counted')) {
        var count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
        localStorage.setItem(VISIT_COUNT_KEY, String(count));
        sessionStorage.setItem('fefu_session_counted', '1');
    }

    // ---- Track page view ----
    var pageStart = Date.now();
    var tracked = false;

    // Clean page URL (just the path)
    function getPagePath() {
        var path = window.location.pathname;
        // Normalize: /index.html -> Home, etc.
        if (path === '/' || path === '/index.html' || path.endsWith('/index.html')) return '/index.html';
        return path;
    }

    function sendPageView() {
        if (tracked) return;
        tracked = true;

        var timeSpent = Math.round((Date.now() - pageStart) / 1000);
        // Don't log tiny views (less than 1 second — probably a redirect)
        if (timeSpent < 1) timeSpent = 1;
        // Cap at 30 minutes to avoid stale tabs
        if (timeSpent > 1800) timeSpent = 1800;

        var payload = {
            visitor_id: visitorId,
            page_url: getPagePath(),
            page_title: document.title || '',
            time_spent_seconds: timeSpent,
            referrer: document.referrer || 'Direct'
        };

        var url = SUPABASE_URL + '/rest/v1/page_views';
        try {
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_KEY
                },
                body: JSON.stringify(payload),
                keepalive: true,
                credentials: 'omit' // Solves the wildcard CORS credentials error
            });
        } catch (e) { }
    }

    // Send on page unload
    window.addEventListener('beforeunload', sendPageView);

    // Also send when tab becomes hidden (mobile browsers don't always fire beforeunload)
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            sendPageView();
        }
    });

    // Safety: also send after 30 minutes in case user never leaves
    setTimeout(function () {
        sendPageView();
    }, 1800000);

    console.log('[Tracker] ✅ Tracking visitor ' + visitorId.substr(0, 8) + '...');
})();

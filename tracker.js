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

    // ---- Advanced Device Fingerprinting ----
    function getCanvasFingerprint() {
        try {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var txt = 'FEFU Medical, https://mbbsabroads.com';
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125,1,62,20);
            ctx.fillStyle = "#069";
            ctx.fillText(txt, 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText(txt, 4, 17);
            var str = canvas.toDataURL();
            // Simple hash
            var hash = 0;
            if (str.length === 0) return 'no-canvas';
            for (var i = 0; i < str.length; i++) {
                var char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return 'fp_' + Math.abs(hash).toString(16);
        } catch (e) { return 'fp_error'; }
    }

    var fingerprint = localStorage.getItem('fefu_fingerprint');
    if (!fingerprint) {
        fingerprint = getCanvasFingerprint();
        localStorage.setItem('fefu_fingerprint', fingerprint);
    }
    window.fefu_fingerprint = fingerprint;

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

        // ---- Silent Location Detection (Once per session) ----
        try {
            fetch('https://ipapi.co/json/')
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (data && data.city) {
                        var loc = {
                            city: data.city,
                            region: data.region,
                            country: data.country_name,
                            ip: data.ip
                        };
                        localStorage.setItem('fefu_location', JSON.stringify(loc));
                    }
                })
                .catch(function() { /* Silently fail to avoid console errors */ });
        } catch (e) { }
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
        if (timeSpent < 1) timeSpent = 1;
        if (timeSpent > 1800) timeSpent = 1800;

        var payload = {
            visitor_id: visitorId,
            page_url: getPagePath(),
            page_title: document.title || '',
            time_spent_seconds: timeSpent,
            referrer: document.referrer || 'Direct',
            visit_count: parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '1', 10)
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
                credentials: 'omit'
            });
        } catch (e) { }
    }

    // ---- Event Logger (Clicks, CTAs) ----
    function logEvent(name, data) {
        var eventUrl = SUPABASE_URL + '/rest/v1/page_events';
        var eventPayload = {
            visitor_id: visitorId,
            event_name: name,
            event_data: data || {},
            created_at: new Date().toISOString()
        };
        try {
            fetch(eventUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_KEY
                },
                body: JSON.stringify(eventPayload),
                keepalive: true,
                credentials: 'omit'
            });
        } catch (e) { }
    }

    // Auto-track important clicks
    document.addEventListener('click', function(e) {
        var target = e.target.closest('button, a.btn, .creepy-btn, .whatsapp-fab, .premium-submit-btn');
        if (target) {
            var label = target.innerText.trim() || target.getAttribute('aria-label') || 'Icon Button';
            logEvent('Button Click', {
                label: label,
                tag: target.tagName,
                url: window.location.href,
                id: target.id || 'No ID'
            });
        }
    });

    window.addEventListener('beforeunload', sendPageView);
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') sendPageView();
    });
    setTimeout(function () { sendPageView(); }, 1800000);
})();

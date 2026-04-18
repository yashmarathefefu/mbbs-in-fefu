(function () {
    'use strict';

    var SESSION_START_KEY = 'fefu_session_started_at';
    var LANDING_PAGE_KEY = 'fefu_landing_page';
    var LAST_PAGE_KEY = 'fefu_last_page';
    var REFERRER_KEY = 'fefu_session_referrer';
    var UTM_KEY = 'fefu_utm_params';

    function safeParse(json, fallback) {
        try {
            return JSON.parse(json);
        } catch (e) {
            return fallback;
        }
    }

    function getPagePath() {
        var path = window.location.pathname || '/';
        if (path === '/' || path === '/index.html' || path.slice(-11) === '/index.html') return '/index.html';
        return path;
    }

    function getConnectionInfo() {
        var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!connection) return 'unknown';
        var parts = [];
        if (connection.effectiveType) parts.push(connection.effectiveType);
        if (typeof connection.downlink === 'number') parts.push(connection.downlink + 'Mb/s');
        if (typeof connection.rtt === 'number') parts.push(connection.rtt + 'ms');
        if (connection.saveData) parts.push('save-data');
        return parts.length ? parts.join(' | ') : 'unknown';
    }

    function getTouchInfo() {
        var points = navigator.maxTouchPoints || 0;
        return points > 0 ? 'Yes (' + points + ')' : 'No';
    }

    function getOrientation() {
        if (screen.orientation && screen.orientation.type) return screen.orientation.type;
        return window.innerWidth > window.innerHeight ? 'portrait' : 'landscape';
    }

    function captureSessionContext() {
        var pagePath = getPagePath();
        if (!sessionStorage.getItem(SESSION_START_KEY)) sessionStorage.setItem(SESSION_START_KEY, new Date().toISOString());
        if (!sessionStorage.getItem(LANDING_PAGE_KEY)) sessionStorage.setItem(LANDING_PAGE_KEY, pagePath);
        sessionStorage.setItem(LAST_PAGE_KEY, pagePath);
        if (!sessionStorage.getItem(REFERRER_KEY)) sessionStorage.setItem(REFERRER_KEY, document.referrer || 'Direct');

        var params = new URLSearchParams(window.location.search);
        var utm = {
            utm_source: params.get('utm_source') || '',
            utm_medium: params.get('utm_medium') || '',
            utm_campaign: params.get('utm_campaign') || '',
            utm_term: params.get('utm_term') || '',
            utm_content: params.get('utm_content') || '',
            gclid: params.get('gclid') || '',
            fbclid: params.get('fbclid') || ''
        };
        var hasCampaignData = Object.keys(utm).some(function (key) { return !!utm[key]; });
        if (hasCampaignData) {
            sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
            localStorage.setItem(UTM_KEY, JSON.stringify(utm));
        } else if (!sessionStorage.getItem(UTM_KEY) && localStorage.getItem(UTM_KEY)) {
            sessionStorage.setItem(UTM_KEY, localStorage.getItem(UTM_KEY));
        }
    }

    function getSessionDurationSeconds() {
        var startedAt = sessionStorage.getItem(SESSION_START_KEY);
        if (!startedAt) return null;
        var started = new Date(startedAt).getTime();
        if (!started) return null;
        return Math.max(1, Math.round((Date.now() - started) / 1000));
    }

    function normalizeName(name) {
        return String(name || '').replace(/\s+/g, ' ').trim();
    }

    function normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    function getDigits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function normalizeIndianPhone(phone) {
        var digits = getDigits(phone);
        if (digits.length === 10) return '+91 ' + digits.replace(/(\d{5})(\d{5})/, '$1 $2');
        if (digits.length === 12 && digits.slice(0, 2) === '91') {
            return '+91 ' + digits.slice(2).replace(/(\d{5})(\d{5})/, '$1 $2');
        }
        return String(phone || '').trim();
    }

    function validateLeadInput(fields) {
        var errors = [];
        var normalized = {
            name: normalizeName(fields && fields.name),
            email: normalizeEmail(fields && fields.email),
            phone: normalizeIndianPhone(fields && fields.phone),
            message: String(fields && fields.message || '').trim(),
            country: String(fields && fields.country || '').trim()
        };
        var phoneDigits = getDigits(normalized.phone);

        if (!normalized.name || normalized.name.length < 2) {
            errors.push('Please enter your full name.');
        } else if (!/^[A-Za-z][A-Za-z\s.'-]{1,79}$/.test(normalized.name)) {
            errors.push('Please enter a valid full name.');
        }

        if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
            errors.push('Please enter a valid email address.');
        }

        if (phoneDigits.length !== 12 || phoneDigits.slice(0, 2) !== '91') {
            errors.push('Please enter a valid Indian phone number.');
        }

        if (normalized.message.length > 1200) {
            errors.push('Your message is too long. Please keep it under 1200 characters.');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            normalized: normalized,
            phoneDigits: phoneDigits
        };
    }

    function getSubmissionErrorMessage(error) {
        var raw = '';

        if (typeof error === 'string') {
            raw = error;
        } else if (error && typeof error.message === 'string') {
            raw = error.message;
        } else if (error && typeof error.error_description === 'string') {
            raw = error.error_description;
        }

        if (!raw) return '';

        var msg = raw.toLowerCase();

        if (msg.indexOf('invalid name supplied') !== -1) {
            return 'Please enter a valid full name.';
        }

        if (msg.indexOf('invalid email supplied') !== -1) {
            return 'Please enter a valid email address.';
        }

        if (msg.indexOf('invalid phone supplied') !== -1) {
            return 'Please enter a valid Indian phone number.';
        }

        if (msg.indexOf('message is too long') !== -1) {
            return 'Your message is too long. Please keep it under 1200 characters.';
        }

        if (msg.indexOf('too many submissions') !== -1) {
            return 'Too many submissions from this number or device. Please try again a little later.';
        }

        return '';
    }

    function buildLeadDeviceInfo(source, analytics, extras) {
        captureSessionContext();

        var info = {
            userAgent: navigator.userAgent,
            pageUrl: window.location.href,
            pagePath: getPagePath(),
            pageTitle: document.title || '',
            submittedAt: new Date().toISOString(),
            source: source || 'website_form',
            screenResolution: window.screen.width + 'x' + window.screen.height,
            windowSize: window.innerWidth + 'x' + window.innerHeight,
            language: navigator.language || 'unknown',
            platform: navigator.platform || 'unknown',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: 'UTC' + ((new Date().getTimezoneOffset() > 0 ? '-' : '+') + String(Math.abs(new Date().getTimezoneOffset() / 60)).padStart(2, '0') + ':00'),
            location: safeParse(localStorage.getItem('fefu_location'), null),
            fingerprint: localStorage.getItem('fefu_fingerprint'),
            ram: navigator.deviceMemory || 'unknown',
            cpu: navigator.hardwareConcurrency || 'unknown',
            connection: getConnectionInfo(),
            touchscreen: getTouchInfo(),
            orientation: getOrientation(),
            pixelRatio: window.devicePixelRatio || 1,
            colorScheme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
            reducedMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'no-preference',
            visitorId: localStorage.getItem('fefu_visitor_id') || null,
            visitCount: parseInt(localStorage.getItem('fefu_visit_count') || '1', 10),
            referrer: sessionStorage.getItem(REFERRER_KEY) || document.referrer || 'Direct',
            landingPage: sessionStorage.getItem(LANDING_PAGE_KEY) || getPagePath(),
            lastPage: sessionStorage.getItem(LAST_PAGE_KEY) || getPagePath(),
            sessionStartedAt: sessionStorage.getItem(SESSION_START_KEY),
            sessionDurationSeconds: getSessionDurationSeconds(),
            utm: safeParse(sessionStorage.getItem(UTM_KEY) || localStorage.getItem(UTM_KEY), null)
        };

        if (analytics) {
            if (analytics.formStartTime) info.formTimeSpent = Math.max(1, Math.round((Date.now() - analytics.formStartTime) / 1000)) + 's';
            if (analytics.firstField) info.firstFieldClicked = analytics.firstField;
            if (analytics.fieldInteractions) info.fieldInteractions = analytics.fieldInteractions;
            if (typeof analytics.maxScrollDepth === 'number') info.scrollDepth = analytics.maxScrollDepth + '%';
            if (typeof analytics.exitIntentTriggered !== 'undefined') info.exitIntent = analytics.exitIntentTriggered ? 'Yes' : 'No';
            if (analytics.selectedTopic) info.selectedTopic = analytics.selectedTopic;
        }

        if (extras) {
            for (var key in extras) {
                if (Object.prototype.hasOwnProperty.call(extras, key)) info[key] = extras[key];
            }
        }

        return info;
    }

    captureSessionContext();

    window.FEFULeadUtils = {
        captureSessionContext: captureSessionContext,
        buildLeadDeviceInfo: buildLeadDeviceInfo,
        getPagePath: getPagePath,
        normalizeName: normalizeName,
        normalizeEmail: normalizeEmail,
        normalizeIndianPhone: normalizeIndianPhone,
        validateLeadInput: validateLeadInput,
        getSubmissionErrorMessage: getSubmissionErrorMessage
    };
})();

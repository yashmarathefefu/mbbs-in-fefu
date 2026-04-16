/*
 * Contact Form — Final Production Version
 * Features: Auto +91, confetti, duplicate prevention, form analytics, WhatsApp
 */
(function () {
    'use strict';

    var SUPABASE_URL = 'https://ibspwomnrilukdcumsix.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic3B3b21ucmlsdWtkY3Vtc2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjUxMTUsImV4cCI6MjA4NjU0MTExNX0.ScRhoEVYXABEozmUpQbEktsBD6twvF8lHdD4xXr5rpY';

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
        var sb = window.supabaseClient;
        if (!sb) return;

        var form = document.getElementById('contactForm');
        if (!form) return;

        var formMsg = document.getElementById('form-message');
        var btn = form.querySelector('.premium-submit-btn');
        var nameInput = document.getElementById('contact_name');
        var phoneInput = document.getElementById('contact_phone');
        var emailInput = document.getElementById('contact_email');
        var countrySelect = document.getElementById('contact_country');
        var textarea = document.getElementById('contact_message');

        // ---- Form Analytics ----
        var formStartTime = null;
        var fieldInteractions = {};
        var firstField = null;
        var maxScrollDepth = 0;
        var exitIntentTriggered = false;

        // Track Scroll
        window.addEventListener('scroll', function () {
            var h = document.documentElement;
            var depth = Math.round((window.scrollY / (h.scrollHeight - h.clientHeight)) * 100);
            if (depth > maxScrollDepth && depth <= 100) maxScrollDepth = depth;
        }, { passive: true });

        // Track Exit Intent (Mouse moved off top screen)
        document.addEventListener('mouseleave', function (e) {
            if (e.clientY < 0) exitIntentTriggered = true;
        });

        // Basic AdBlock Check
        function checkAdblock() {
            var bait = document.createElement('div');
            bait.className = 'ad-banner ad-placement adsbox';
            bait.style.height = '1px';
            bait.style.width = '1px';
            bait.style.position = 'absolute';
            bait.style.left = '-999px';
            document.body.appendChild(bait);
            var isBlocked = bait.offsetHeight === 0;
            document.body.removeChild(bait);
            return isBlocked ? 'Yes' : 'No';
        }

        function trackField(fieldName) {
            if (!formStartTime) formStartTime = Date.now();
            if (!firstField) firstField = fieldName;
            fieldInteractions[fieldName] = (fieldInteractions[fieldName] || 0) + 1;
        }

        if (nameInput) nameInput.addEventListener('focus', function () { trackField('name'); });
        if (phoneInput) phoneInput.addEventListener('focus', function () { trackField('phone'); });
        if (emailInput) emailInput.addEventListener('focus', function () { trackField('email'); });
        if (textarea) textarea.addEventListener('focus', function () { trackField('message'); });
        if (countrySelect) countrySelect.addEventListener('focus', function () { trackField('country'); });

        // ---- Quick Topic Chips ----
        var chips = document.querySelectorAll('.topic-chip');
        for (var i = 0; i < chips.length; i++) {
            (function (chip) {
                chip.addEventListener('click', function () {
                    for (var j = 0; j < chips.length; j++) chips[j].classList.remove('active');
                    chip.classList.add('active');
                    if (textarea) {
                        textarea.value = chip.getAttribute('data-msg') || '';
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });
            })(chips[i]);
        }

        // ---- Live Validation ----
        if (nameInput) {
            nameInput.addEventListener('input', function () {
                toggleValid(nameInput, nameInput.value.trim().length >= 2);
            });
        }
        if (emailInput) {
            emailInput.addEventListener('input', function () {
                toggleValid(emailInput, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()));
            });
        }
        if (phoneInput) {
            phoneInput.addEventListener('input', function () {
                var raw = phoneInput.value;
                var cleaned = raw.replace(/[^\d+]/g, '');
                var digitsOnly = cleaned.replace(/\D/g, '');

                if (digitsOnly.length === 10 && !cleaned.startsWith('+')) {
                    phoneInput.value = '+91 ' + digitsOnly.replace(/(\d{5})(\d{5})/, '$1 $2');
                } else if (cleaned.startsWith('+91') && digitsOnly.length === 12) {
                    var num = digitsOnly.substring(2);
                    phoneInput.value = '+91 ' + num.replace(/(\d{5})(\d{5})/, '$1 $2');
                }

                var finalDigits = phoneInput.value.replace(/\D/g, '');
                var isValid = (finalDigits.length === 12 && phoneInput.value.startsWith('+91')) ||
                    finalDigits.length === 10 ||
                    (finalDigits.length >= 7 && finalDigits.length <= 15);
                toggleValid(phoneInput, isValid);
            });

            phoneInput.addEventListener('blur', function () {
                var digits = phoneInput.value.replace(/\D/g, '');
                if (digits.length === 10) {
                    phoneInput.value = '+91 ' + digits.replace(/(\d{5})(\d{5})/, '$1 $2');
                    toggleValid(phoneInput, true);
                }
            });
        }

        if (countrySelect) {
            countrySelect.addEventListener('change', function () {
                toggleValid(countrySelect, !!countrySelect.value);
            });
        }

        function toggleValid(el, isValid) {
            if (el && el.parentElement) {
                if (isValid) {
                    el.parentElement.classList.add('is-valid');
                    el.parentElement.classList.remove('is-invalid');
                } else if (el.value.trim().length > 0) {
                    el.parentElement.classList.remove('is-valid');
                    el.parentElement.classList.add('is-invalid');
                } else {
                    el.parentElement.classList.remove('is-valid');
                    el.parentElement.classList.remove('is-invalid');
                }
            }
        }

        // ---- Duplicate Prevention ----
        function isDuplicate(email, phone) {
            var key = 'fefu_submitted';
            var stored = localStorage.getItem(key);
            if (!stored) return false;
            try {
                var data = JSON.parse(stored);
                var now = Date.now();
                // 24 hour window
                if (now - data.time > 86400000) return false;
                if (data.email === email || data.phone === phone) return true;
            } catch (e) { }
            return false;
        }

        function markSubmitted(email, phone) {
            localStorage.setItem('fefu_submitted', JSON.stringify({
                email: email,
                phone: phone,
                time: Date.now()
            }));
        }

        // ---- Form Submit ----
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var name = nameInput ? nameInput.value.trim() : '';
            var phone = phoneInput ? phoneInput.value.trim() : '';
            var email = emailInput ? emailInput.value.trim() : '';
            var message = textarea ? textarea.value.trim() : '';
            var country = countrySelect ? countrySelect.value : '';

            // Auto +91
            var phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length === 10 && !phone.startsWith('+')) {
                phone = '+91 ' + phoneDigits.replace(/(\d{5})(\d{5})/, '$1 $2');
            }

            // Duplicate check
            if (isDuplicate(email, phone)) {
                showMsg('⏳ You have already submitted an inquiry. We will contact you soon!', 'error');
                return;
            }

            // Loading
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span>Sending...</span> <div class="spinner"></div>';
            }
            if (formMsg) { formMsg.textContent = ''; formMsg.className = 'form-status-message'; }

            // Analytics
            var timeSpent = formStartTime ? Math.round((Date.now() - formStartTime) / 1000) : 0;

            var deviceInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform || 'Unknown',
                screenResolution: screen.width + 'x' + screen.height,
                windowSize: window.innerWidth + 'x' + window.innerHeight,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: 'UTC' + (new Date().getTimezoneOffset() <= 0 ? '+' : '-') + Math.abs(Math.floor(new Date().getTimezoneOffset() / 60)),
                language: navigator.language,
                referrer: document.referrer || 'Direct',
                connection: (navigator.connection ? navigator.connection.effectiveType : 'unknown'),
                touchscreen: ('ontouchstart' in window) ? 'Yes' : 'No',
                pageUrl: window.location.href,
                submittedAt: new Date().toISOString(),
                formTimeSpent: timeSpent + 's',
                firstFieldClicked: firstField || 'unknown',
                fieldInteractions: fieldInteractions,
                scrollDepth: maxScrollDepth + '%',
                exitIntent: exitIntentTriggered ? 'Yes' : 'No',
                adblockDetected: checkAdblock()
            };

            sb.from('form_submissions')
                .insert([{
                    name: name,
                    phone: phone,
                    email: email,
                    message: message || null,
                    country: country || null,
                    device_info: deviceInfo,
                    visitor_id: localStorage.getItem('fefu_visitor_id') || null
                }])
                .then(function (result) {
                    if (result.error) {
                        showMsg('❌ Something went wrong. Please try again.', 'error');
                    } else {
                        markSubmitted(email, phone);
                        showMsg('✅ Thank you, ' + name.split(' ')[0] + '! We will contact you shortly.', 'success');
                        launchConfetti();
                        form.reset();
                        var groups = document.querySelectorAll('.premium-form .form-group');
                        for (var k = 0; k < groups.length; k++) {
                            groups[k].classList.remove('is-valid');
                            groups[k].classList.remove('is-invalid');
                        }
                        for (var k = 0; k < chips.length; k++) chips[k].classList.remove('active');
                        if (countrySelect) countrySelect.selectedIndex = 0;
                        formStartTime = null; fieldInteractions = {}; firstField = null;
                    }
                })
                .catch(function () {
                    showMsg('❌ Network error. Please check your connection.', 'error');
                })
                .finally(function () {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = '<span>Send Inquiry</span> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
                    }
                });
        });

        function showMsg(text, type) {
            if (!formMsg) return;
            formMsg.textContent = text;
            formMsg.className = 'form-status-message ' + (type || '');
        }

        // ---- Confetti ----
        function launchConfetti() {
            var canvas = document.createElement('canvas');
            canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
            document.body.appendChild(canvas);
            var ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            var colors = ['#a78bfa', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#fff'];
            var pieces = [];
            for (var i = 0; i < 150; i++) {
                pieces.push({
                    x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
                    y: canvas.height * 0.6,
                    vx: (Math.random() - 0.5) * 16,
                    vy: -Math.random() * 18 - 5,
                    w: Math.random() * 10 + 4,
                    h: Math.random() * 6 + 3,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    rotation: Math.random() * 360,
                    rotSpeed: (Math.random() - 0.5) * 10,
                    gravity: 0.25 + Math.random() * 0.15,
                    opacity: 1
                });
            }

            var frame = 0;
            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                var alive = false;
                pieces.forEach(function (p) {
                    p.x += p.vx;
                    p.vy += p.gravity;
                    p.y += p.vy;
                    p.rotation += p.rotSpeed;
                    p.vx *= 0.99;
                    if (frame > 60) p.opacity -= 0.015;
                    if (p.opacity <= 0) return;
                    alive = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    ctx.restore();
                });
                frame++;
                if (alive && frame < 200) requestAnimationFrame(animate);
                else document.body.removeChild(canvas);
            }
            requestAnimationFrame(animate);
        }

    });
})();

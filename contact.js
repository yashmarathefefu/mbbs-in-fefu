/*
 * Contact Form — Final Production Version
 * Features: Auto +91, confetti, duplicate prevention, form analytics, WhatsApp
 */
(function () {
    'use strict';

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
        var form = document.getElementById('contactForm');
        if (!form) return;

        /**
         * Setup the form once Supabase is ready
         */
        function initFormLogic(sb) {
            if (!sb || form.hasAttribute('data-initialized')) return;
            form.setAttribute('data-initialized', 'true');

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

            // Track Exit Intent
            document.addEventListener('mouseleave', function (e) {
                if (e.clientY < 0) exitIntentTriggered = true;
            });

            function checkAdblock() {
                var bait = document.createElement('div');
                bait.className = 'ad-banner ad-placement adsbox';
                bait.style.height = '1px'; bait.style.width = '1px';
                bait.style.position = 'absolute'; bait.style.left = '-999px';
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
            if (nameInput) nameInput.addEventListener('input', function () { toggleValid(nameInput, nameInput.value.trim().length >= 2); });
            if (emailInput) emailInput.addEventListener('input', function () { toggleValid(emailInput, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())); });
            if (phoneInput) {
                phoneInput.addEventListener('input', function () {
                    var raw = phoneInput.value;
                    var cleaned = raw.replace(/[^\d+]/g, '');
                    var digitsOnly = cleaned.replace(/\D/g, '');
                    if (digitsOnly.length === 10 && !cleaned.startsWith('+')) {
                        phoneInput.value = '+91 ' + digitsOnly.replace(/(\d{5})(\d{5})/, '$1 $2');
                    }
                    var finalDigits = phoneInput.value.replace(/\D/g, '');
                    var isValid = (finalDigits.length === 12 && phoneInput.value.startsWith('+91')) || finalDigits.length === 10 || (finalDigits.length >= 7 && finalDigits.length <= 15);
                    toggleValid(phoneInput, isValid);
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
                    if (Date.now() - data.time > 86400000) return false;
                    if (data.email === email || data.phone === phone) return true;
                } catch (e) { }
                return false;
            }

            // ---- Form Submit ----
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var name = nameInput ? nameInput.value.trim() : '';
                var phone = phoneInput ? phoneInput.value.trim() : '';
                var email = emailInput ? emailInput.value.trim() : '';
                var message = textarea ? textarea.value.trim() : '';
                var country = countrySelect ? countrySelect.value : '';

                if (isDuplicate(email, phone)) {
                    showMsg('⏳ You have already submitted an inquiry. We will contact you soon!', 'error');
                    return;
                }

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<span>Sending...</span> <div class="spinner"></div>';
                }

                var deviceInfo = {
                    userAgent: navigator.userAgent,
                    pageUrl: window.location.href,
                    submittedAt: new Date().toISOString(),
                    adblockDetected: checkAdblock(),
                    screenResolution: window.screen.width + 'x' + window.screen.height,
                    windowSize: window.innerWidth + 'x' + window.innerHeight,
                    language: navigator.language,
                    platform: navigator.platform,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    location: JSON.parse(localStorage.getItem('fefu_location') || 'null')
                };

                sb.from('form_submissions').insert([{
                    name: name,
                    phone: phone,
                    email: email,
                    message: message || null,
                    country: country || null,
                    device_info: deviceInfo,
                    visitor_id: localStorage.getItem('fefu_visitor_id') || null
                }]).then(function (result) {
                    if (result.error) {
                        showMsg('❌ Something went wrong. Please try again.', 'error');
                    } else {
                        localStorage.setItem('fefu_submitted', JSON.stringify({ email: email, phone: phone, time: Date.now() }));
                        showMsg('✅ Thank you, ' + name.split(' ')[0] + '! We will contact you shortly.', 'success');
                        if (typeof launchConfetti === 'function') launchConfetti();
                        form.reset();
                    }
                }).catch(function () {
                    showMsg('❌ Network error. Please try again.', 'error');
                }).finally(function () {
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
        }

        // ---- BOOTSTRAP ----
        // If Supabase is already ready, init now
        if (window.supabaseClient) {
            initFormLogic(window.supabaseClient);
        } else {
            // Otherwise wait for the custom event
            window.addEventListener('supabase-ready', function (e) {
                initFormLogic(e.detail.client);
            });
        }
    });

    // Helper: Confetti (kept globally for simple access)
    function launchConfetti() {
        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
        document.body.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        var colors = ['#a78bfa', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
        var pieces = [];
        for (var i = 0; i < 100; i++) {
            pieces.push({
                x: canvas.width * 0.5, y: canvas.height * 0.5,
                vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 20,
                w: 10, h: 6, color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 1, gravity: 0.25
            });
        }
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var alive = false;
            pieces.forEach(function (p) {
                p.x += p.vx; p.y += p.vy; p.vy += p.gravity;
                p.opacity -= 0.01;
                if (p.opacity > 0) {
                    alive = true;
                    ctx.globalAlpha = p.opacity;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, p.w, p.h);
                }
            });
            if (alive) requestAnimationFrame(animate);
            else if (canvas.parentNode) document.body.removeChild(canvas);
        }
        animate();
    }
    window.launchConfetti = launchConfetti;

})();

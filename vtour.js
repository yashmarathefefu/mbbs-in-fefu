/*
 * Virtual Tour Modal — Premium Production Version
 * Features: Modal open/close, +91 auto-format, validation, Supabase submission,
 *           redirect to 360° tour, Escape key close, input animations
 */
(function () {
    'use strict';

    var TOUR_URL = 'https://kraizemli.ru/vtour/dvfu/tour.html';
    var REDIRECT_FAILSAFE_MS = 1200;

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
        var openBtn = document.getElementById('open-vtour-modal');
        var modal = document.getElementById('vtour-modal');
        var closeBtn = document.getElementById('vtour-close-btn');
        var backdrop = document.getElementById('vtour-modal-backdrop');
        var form = document.getElementById('vtourForm');

        var nameInput = document.getElementById('vtour_name');
        var phoneInput = document.getElementById('vtour_phone');
        var formMsg = document.getElementById('vtour-form-message');
        var submitBtn = form ? form.querySelector('.vtour-submit-btn') : null;
        var formStartTime = null;
        var firstField = null;
        var fieldInteractions = {};
        var maxScrollDepth = 0;
        var exitIntentTriggered = false;

        /**
         * Setup the form once Supabase is ready
         */
        var localSb = window.supabaseClient || null;

        // Listen for Supabase ready event
        window.addEventListener('supabase-ready', function(e) {
            localSb = e.detail.client;
        });

        function trackField(name) {
            if (!formStartTime) formStartTime = Date.now();
            if (!firstField) firstField = name;
            fieldInteractions[name] = (fieldInteractions[name] || 0) + 1;
        }

        if (nameInput) nameInput.addEventListener('focus', function () { trackField('name'); });
        if (phoneInput) phoneInput.addEventListener('focus', function () { trackField('phone'); });

        window.addEventListener('scroll', function () {
            var h = document.documentElement;
            var denominator = h.scrollHeight - h.clientHeight;
            if (denominator <= 0) return;
            var depth = Math.round((window.scrollY / denominator) * 100);
            if (depth > maxScrollDepth && depth <= 100) maxScrollDepth = depth;
        }, { passive: true });

        document.addEventListener('mouseleave', function (e) {
            if (e.clientY < 0) exitIntentTriggered = true;
        });

        // ---- OPEN MODAL ----
        if (openBtn && modal) {
            openBtn.addEventListener('click', function (e) {
                e.preventDefault();
                modal.style.display = 'flex';
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        modal.classList.add('active');
                    });
                });
                setTimeout(function () { 
                    if (nameInput && window.innerWidth > 768) nameInput.focus(); 
                }, 400);
            });
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.remove('active');
            setTimeout(function () {
                modal.style.display = 'none';
            }, 350);
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
                closeModal();
            }
        });

        // ---- PHONE AUTO +91 ----
        if (phoneInput) {
            phoneInput.addEventListener('input', function () {
                var raw = phoneInput.value;
                var cleaned = raw.replace(/[^\d+]/g, '');
                var digitsOnly = cleaned.replace(/\D/g, '');
                if (digitsOnly.length === 10 && !cleaned.startsWith('+')) {
                    phoneInput.value = '+91 ' + digitsOnly.replace(/(\d{5})(\d{5})/, '$1 $2');
                }
            });
        }

        function showMsg(text, type) {
            if (!formMsg) return;
            formMsg.textContent = text;
            formMsg.className = 'form-status-message ' + (type || '');
            formMsg.style.display = 'block';
        }

        function resetSubmitButton() {
            if (!submitBtn) return;
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Open Virtual Tour</span>';
        }

        function goToTour() {
            window.location.href = TOUR_URL;
        }

        // ---- FORM SUBMIT ----
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();

                var name = nameInput ? nameInput.value.trim() : '';
                var phone = phoneInput ? phoneInput.value.trim() : '';
                var validation = window.FEFULeadUtils && window.FEFULeadUtils.validateLeadInput
                    ? window.FEFULeadUtils.validateLeadInput({
                        name: name,
                        phone: phone,
                        email: '',
                        message: '',
                        country: ''
                    })
                    : null;

                if (validation && !validation.valid) {
                    showMsg(validation.errors[0], 'error');
                    return;
                }

                if (validation) {
                    name = validation.normalized.name;
                    phone = validation.normalized.phone;
                    if (nameInput) nameInput.value = name;
                    if (phoneInput) phoneInput.value = phone;
                }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span>Processing...</span> <div class="spinner"></div>';
                }

                var deviceInfo = window.FEFULeadUtils && window.FEFULeadUtils.buildLeadDeviceInfo
                    ? window.FEFULeadUtils.buildLeadDeviceInfo('virtual_tour_form', {
                        formStartTime: formStartTime,
                        firstField: firstField,
                        fieldInteractions: fieldInteractions,
                        maxScrollDepth: maxScrollDepth,
                        exitIntentTriggered: exitIntentTriggered
                    })
                    : {
                        userAgent: navigator.userAgent,
                        submittedAt: new Date().toISOString(),
                        source: 'virtual_tour_form',
                        pageUrl: window.location.href
                    };

                // Keep lead capture, but don't make users wait several seconds.
                var redirectTimer = setTimeout(function () {
                    goToTour();
                }, REDIRECT_FAILSAFE_MS);

                if (localSb) {
                    localSb.from('form_submissions').insert([{
                        name: name,
                        phone: phone,
                        email: '',
                        message: 'Requested Virtual Tour Access',
                        country: '',
                        device_info: deviceInfo,
                        visitor_id: localStorage.getItem('fefu_visitor_id') || null
                    }]).then(function (result) {
                        if (result && result.error) {
                            clearTimeout(redirectTimer);
                            var friendlyMsg = window.FEFULeadUtils && window.FEFULeadUtils.getSubmissionErrorMessage
                                ? window.FEFULeadUtils.getSubmissionErrorMessage(result.error)
                                : '';

                            if (friendlyMsg) {
                                showMsg(friendlyMsg, 'error');
                                resetSubmitButton();
                                return;
                            }
                        }

                        clearTimeout(redirectTimer);
                        goToTour();
                    }).catch(function () {
                        clearTimeout(redirectTimer);
                        goToTour();
                    });
                } else {
                    clearTimeout(redirectTimer);
                    goToTour();
                }
            });
        }
    });
})();

/*
 * Virtual Tour Modal — Premium Production Version
 * Features: Modal open/close, +91 auto-format, validation, Supabase submission,
 *           redirect to 360° tour, Escape key close, input animations
 */
(function () {
    'use strict';

    var TOUR_URL = 'https://kraizemli.ru/vtour/dvfu/tour.html';

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

        /**
         * Setup the form once Supabase is ready
         */
        var localSb = window.supabaseClient || null;

        // Listen for Supabase ready event
        window.addEventListener('supabase-ready', function(e) {
            localSb = e.detail.client;
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

        // ---- FORM SUBMIT ----
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();

                var name = nameInput ? nameInput.value.trim() : '';
                var phone = phoneInput ? phoneInput.value.trim() : '';

                if (!name || name.length < 2) {
                    showMsg('Please enter your full name.', 'error');
                    return;
                }

                var phoneDigits = phone.replace(/\D/g, '');
                if (phoneDigits.length < 10) {
                    showMsg('Please enter a valid phone number.', 'error');
                    return;
                }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span>Processing...</span> <div class="spinner"></div>';
                }

                var deviceInfo = {
                    userAgent: navigator.userAgent,
                    submittedAt: new Date().toISOString(),
                    source: 'virtual_tour_form',
                    pageUrl: window.location.href,
                    screenResolution: window.screen.width + 'x' + window.screen.height,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    location: JSON.parse(localStorage.getItem('fefu_location') || 'null'),
                    fingerprint: localStorage.getItem('fefu_fingerprint'),
                    ram: navigator.deviceMemory || 'unknown',
                    cpu: navigator.hardwareConcurrency || 'unknown'
                };

                // Safety redirect
                var redirectTimer = setTimeout(function () {
                    window.location.href = TOUR_URL;
                }, 3000);

                if (localSb) {
                    localSb.from('form_submissions').insert([{
                        name: name,
                        phone: phone,
                        email: '',
                        message: 'Requested Virtual Tour Access',
                        country: '',
                        device_info: deviceInfo,
                        visitor_id: localStorage.getItem('fefu_visitor_id') || null
                    }]).then(function () {
                        clearTimeout(redirectTimer);
                        window.location.href = TOUR_URL;
                    }).catch(function () {
                        clearTimeout(redirectTimer);
                        window.location.href = TOUR_URL;
                    });
                } else {
                    // If SB still not ready, just redirect
                    setTimeout(function() {
                         window.location.href = TOUR_URL;
                    }, 500);
                }
            });
        }
    });
})();

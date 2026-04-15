/*
 * Virtual Tour Modal — Premium Production Version
 * Features: Modal open/close, +91 auto-format, validation, Supabase submission,
 *           redirect to 360° tour, Escape key close, input animations
 */
(function () {
    'use strict';

    var SUPABASE_URL = 'https://ibspwomnrilukdcumsix.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic3B3b21ucmlsdWtkY3Vtc2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjUxMTUsImV4cCI6MjA4NjU0MTExNX0.ScRhoEVYXABEozmUpQbEktsBD6twvF8lHdD4xXr5rpY';
    var TOUR_URL = 'https://kraizemli.ru/vtour/dvfu/tour.html';

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
        var sb = (typeof supabase !== 'undefined' && supabase.createClient)
            ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
            : null;

        var openBtn = document.getElementById('open-vtour-modal');
        var modal = document.getElementById('vtour-modal');
        var closeBtn = document.getElementById('vtour-close-btn');
        var backdrop = document.getElementById('vtour-modal-backdrop');
        var form = document.getElementById('vtourForm');

        var nameInput = document.getElementById('vtour_name');
        var phoneInput = document.getElementById('vtour_phone');
        var formMsg = document.getElementById('vtour-form-message');
        var submitBtn = form ? form.querySelector('.vtour-submit-btn') : null;

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
                // Auto-focus name field for quick entry on desktop only to avoid keyboard popup shift on mobile
                setTimeout(function () { 
                    if (nameInput && window.innerWidth > 768) nameInput.focus(); 
                }, 400);
            });
        }

        // ---- CLOSE MODAL ----
        function closeModal() {
            if (!modal) return;
            modal.classList.remove('active');
            setTimeout(function () {
                modal.style.display = 'none';
            }, 350);
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);

        // Escape key closes modal
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
                } else if (cleaned.startsWith('+91') && digitsOnly.length === 12) {
                    var num = digitsOnly.substring(2);
                    phoneInput.value = '+91 ' + num.replace(/(\d{5})(\d{5})/, '$1 $2');
                }
            });

            phoneInput.addEventListener('blur', function () {
                var digits = phoneInput.value.replace(/\D/g, '');
                if (digits.length === 10) {
                    phoneInput.value = '+91 ' + digits.replace(/(\d{5})(\d{5})/, '$1 $2');
                }
            });
        }

        // ---- VALIDATION ----
        function validateForm(name, phone) {
            if (!name || name.length < 2) {
                showMsg('Please enter your full name.', 'error');
                if (nameInput) nameInput.focus();
                return false;
            }
            var phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length < 7 || phoneDigits.length > 15) {
                showMsg('Please enter a valid phone number.', 'error');
                if (phoneInput) phoneInput.focus();
                return false;
            }
            return true;
        }

        function showMsg(text, type) {
            if (!formMsg) return;
            formMsg.textContent = text;
            formMsg.className = 'form-status-message ' + (type || '');
            formMsg.style.display = 'block';
        }

        var DEFAULT_BTN_HTML = '<span>Unlock Virtual Tour</span> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';

        function resetButton() {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = DEFAULT_BTN_HTML;
            }
        }

        // ---- FORM SUBMIT ----
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();

                var name = nameInput ? nameInput.value.trim() : '';
                var phone = phoneInput ? phoneInput.value.trim() : '';

                // Auto-prefix +91
                var phoneDigits = phone.replace(/\D/g, '');
                if (phoneDigits.length === 10 && !phone.startsWith('+')) {
                    phone = '+91 ' + phoneDigits.replace(/(\d{5})(\d{5})/, '$1 $2');
                }

                if (!validateForm(name, phone)) return;

                // Set loading state
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span>Processing...</span> <div class="spinner"></div>';
                }

                if (formMsg) {
                    formMsg.textContent = '';
                    formMsg.className = 'form-status-message';
                    formMsg.style.display = 'none';
                }

                var deviceInfo = {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform || 'Unknown',
                    screenResolution: screen.width + 'x' + screen.height,
                    windowSize: window.innerWidth + 'x' + window.innerHeight,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: navigator.language,
                    referrer: document.referrer || 'Direct',
                    submittedAt: new Date().toISOString(),
                    source: 'virtual_tour_form',
                    pageUrl: window.location.href
                };

                // Safety redirect: if Supabase takes >4s, redirect anyway
                var redirectTimer = setTimeout(function () {
                    window.location.href = TOUR_URL;
                }, 4000);

                if (sb) {
                    sb.from('form_submissions')
                        .insert([{
                            name: name,
                            phone: phone,
                            email: '',
                            message: 'Requested Virtual Tour Access',
                            country: '',
                            device_info: deviceInfo,
                            visitor_id: localStorage.getItem('fefu_visitor_id') || null
                        }])
                        .then(function (result) {
                            clearTimeout(redirectTimer);
                            if (result.error) {
                                console.error('[VTour] Supabase error:', result.error);
                                showMsg('❌ Something went wrong. Redirecting...', 'error');
                                setTimeout(function () {
                                    window.location.href = TOUR_URL;
                                }, 1500);
                            } else {
                                window.location.href = TOUR_URL;
                            }
                        })
                        .catch(function (err) {
                            clearTimeout(redirectTimer);
                            console.error('[VTour] Network error:', err);
                            // Even on error, redirect so user gets the tour
                            window.location.href = TOUR_URL;
                        });
                } else {
                    clearTimeout(redirectTimer);
                    window.location.href = TOUR_URL;
                }
            });
        }

        console.log('[VTour] ✅ Virtual Tour module ready');
    });
})();

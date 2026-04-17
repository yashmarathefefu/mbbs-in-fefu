/**
 * Universal Blog Inquiry Form Handler
 * Handles submissions for all blog inquiry forms across the site.
 */
(function() {
    'use strict';

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function() {
        const blogForm = document.getElementById('blogInquiryForm');
        if (!blogForm) return;

        const blogMsg = document.getElementById('blogFormMsg');
        const blogBtn = document.getElementById('blogFormBtn');
        const phoneInput = document.getElementById('blog_phone');
        
        let localSb = window.supabaseClient || null;

        // Listen for Supabase ready event
        window.addEventListener('supabase-ready', function(e) {
            localSb = e.detail.client;
        });

        // Phone Auto-format
        if (phoneInput) {
            phoneInput.addEventListener('blur', function () {
                const digits = phoneInput.value.replace(/\D/g, '');
                if (digits.length === 10) {
                    phoneInput.value = '+91 ' + digits.replace(/(\d{5})(\d{5})/, '$1 $2');
                }
            });
        }

        // Duplicate Check
        function isDuplicate(email, phone) {
            try {
                const stored = JSON.parse(localStorage.getItem('fefu_submitted') || 'null');
                if (!stored || Date.now() - stored.time > 86400000) return false;
                return stored.email === email || stored.phone === phone;
            } catch (e) { return false; }
        }

        blogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!localSb) {
                if (blogMsg) {
                    blogMsg.textContent = '⏳ Connection initializing... please wait a second.';
                    blogMsg.className = 'blog-form-msg error';
                }
                return;
            }

            const name = document.getElementById('blog_name').value.trim();
            let phone = document.getElementById('blog_phone').value.trim();
            const email = document.getElementById('blog_email').value.trim();
            const country = document.getElementById('blog_country').value;

            // Auto +91
            const digits = phone.replace(/\D/g, '');
            if (digits.length === 10 && !phone.startsWith('+')) {
                phone = '+91 ' + digits.replace(/(\d{5})(\d{5})/, '$1 $2');
            }

            if (isDuplicate(email, phone)) {
                if (blogMsg) {
                    blogMsg.textContent = '⏳ You have already submitted. We will contact you soon!';
                    blogMsg.className = 'blog-form-msg error';
                }
                return;
            }

            // Loading
            if (blogBtn) {
                blogBtn.disabled = true;
                blogBtn.innerHTML = '<span>Sending...</span>';
            }

            try {
                const { error } = await localSb.from('form_submissions').insert([{
                    name: name,
                    phone: phone,
                    email: email,
                    country: country || null,
                    message: 'Inquiry from Blog: ' + (document.title || 'Unknown Post'),
                    device_info: {
                        source: 'blog',
                        pageUrl: window.location.href,
                        userAgent: navigator.userAgent
                    },
                    visitor_id: localStorage.getItem('fefu_visitor_id') || null
                }]);

                if (error) {
                    if (blogMsg) {
                        blogMsg.textContent = '❌ Something went wrong. Please try again.';
                        blogMsg.className = 'blog-form-msg error';
                    }
                } else {
                    localStorage.setItem('fefu_submitted', JSON.stringify({
                        email, phone, time: Date.now()
                    }));
                    if (blogMsg) {
                        blogMsg.textContent = '✅ Thank you! Our counselor will call you within 24 hours.';
                        blogMsg.className = 'blog-form-msg success';
                    }
                    blogForm.reset();
                }
            } catch (err) {
                if (blogMsg) {
                    blogMsg.textContent = '❌ Network error. Please try again.';
                    blogMsg.className = 'blog-form-msg error';
                }
            } finally {
                if (blogBtn) {
                    blogBtn.disabled = false;
                    blogBtn.innerHTML = '<span>Get Free Counseling</span> <i data-lucide="send" style="width:18px;height:18px;"></i>';
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        });
    });
})();

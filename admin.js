/*
 * Admin Dashboard — Full CRM
 * Features: Detail modal, delete, notes, WhatsApp, email templates,
 * real-time polling, bulk actions, search, CSV export
 */
(function () {
    'use strict';

    var SUPABASE_URL = 'https://ibspwomnrilukdcumsix.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic3B3b21ucmlsdWtkY3Vtc2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjUxMTUsImV4cCI6MjA4NjU0MTExNX0.ScRhoEVYXABEozmUpQbEktsBD6twvF8lHdD4xXr5rpY';
    var AUTH_KEY = 'fefu_admin_logged_in';

    if (typeof supabase === 'undefined' || !supabase.createClient) return;
    var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // DOM refs
    var $ = function (id) { return document.getElementById(id); };
    var loginOverlay = $('loginOverlay'), loginForm = $('loginForm'), loginError = $('loginError');
    var logoutBtn = $('logoutBtn'), refreshBtn = $('refreshBtn'), exportBtn = $('exportBtn');
    var searchInput = $('searchInput'), tableBody = $('tableBody');
    var totalCount = $('totalCount'), todayCount = $('todayCount'), weekCount = $('weekCount'), pendingCount = $('pendingCount');
    var tableBadge = $('tableBadge');
    var bulkBar = $('bulkBar'), bulkCount = $('bulkCount'), selectAll = $('selectAll');
    var detailModal = $('detailModal'), modalBody = $('modalBody'), modalActions = $('modalActions'), modalClose = $('modalClose');
    var emailModal = $('emailModal'), emailTemplates = $('emailTemplates');
    var toastEl = $('newLeadToast'), toastMsg = $('toastMsg');

    var allRows = [];
    var selectedIds = new Set();
    var lastKnownCount = 0;
    var pollTimer = null;

    /* ======== EMAIL TEMPLATES ======== */
    var templates = [
        { name: 'Admission Info', subject: 'MBBS Admission at FEFU — Details', body: 'Dear {name},\n\nThank you for your interest in MBBS at Far Eastern Federal University (FEFU). Here are the key details:\n\n• Duration: 6 years (including internship)\n• Medium: English\n• Intake: September\n• Eligibility: 12th with Biology, min 50%\n\nWe would be happy to guide you through the application process.\n\nBest regards,\nFEFU Admissions Team' },
        { name: 'Fee Structure', subject: 'FEFU MBBS Fee Structure', body: 'Dear {name},\n\nPlease find below the fee structure for MBBS at FEFU:\n\n• Tuition Fee: $X,XXX per year\n• Hostel: $XXX per year\n• Insurance: $XXX per year\n\nScholarships are available for eligible students.\n\nFeel free to reach out for more details.\n\nBest regards,\nFEFU Admissions Team' },
        { name: 'Follow Up', subject: 'Following Up — FEFU MBBS', body: 'Dear {name},\n\nI hope this message finds you well. I wanted to follow up on your recent inquiry about MBBS at FEFU.\n\nDo you have any questions I can help with? We are here to assist you every step of the way.\n\nBest regards,\nFEFU Admissions Team' },
        { name: 'Visa & Travel', subject: 'Visa & Travel Info — FEFU', body: 'Dear {name},\n\nHere is the visa and travel information for studying at FEFU:\n\n• Visa Type: Student Visa\n• Processing Time: 2-4 weeks\n• Documents: Passport, Invitation Letter, Medical Certificate\n• Nearest Airport: Vladivostok International (VVO)\n\nWe assist with the complete visa process.\n\nBest regards,\nFEFU Admissions Team' }
    ];

    /* ======== AUTH ======== */
    function checkAuth() {
        if (localStorage.getItem(AUTH_KEY) === 'true') {
            loginOverlay.style.display = 'none';
            loadSubmissions();
            startPolling();
        }
    }

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if ($('username').value === 'admin' && $('password').value === 'admin') {
            localStorage.setItem(AUTH_KEY, 'true');
            loginOverlay.style.display = 'none';
            loadSubmissions();
            startPolling();
        } else {
            loginError.style.display = 'block';
            setTimeout(function () { loginError.style.display = 'none'; }, 3000);
        }
    });

    logoutBtn.addEventListener('click', function () {
        localStorage.removeItem(AUTH_KEY);
        stopPolling();
        window.location.reload();
    });

    refreshBtn.addEventListener('click', function () {
        refreshBtn.style.opacity = '0.5';
        refreshBtn.disabled = true;
        loadSubmissions().finally(function () {
            refreshBtn.style.opacity = '1';
            refreshBtn.disabled = false;
        });
    });

    /* ======== REAL-TIME POLLING ======== */
    function startPolling() {
        pollTimer = setInterval(function () {
            sb.from('form_submissions').select('id, name', { count: 'exact', head: true })
                .then(function (res) {
                    var count = res.count || 0;
                    if (lastKnownCount > 0 && count > lastKnownCount) {
                        showToast('New lead received!');
                        playNotifSound();
                        loadSubmissions();
                    }
                    lastKnownCount = count;
                });
        }, 15000); // every 15 seconds
    }

    function stopPolling() { if (pollTimer) clearInterval(pollTimer); }

    function showToast(msg) {
        toastMsg.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(function () { toastEl.classList.remove('show'); }, 4000);
    }

    function playNotifSound() {
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 800; osc.type = 'sine';
            gain.gain.value = 0.1;
            osc.start(); osc.stop(ctx.currentTime + 0.15);
            setTimeout(function () {
                var osc2 = ctx.createOscillator();
                var gain2 = ctx.createGain();
                osc2.connect(gain2); gain2.connect(ctx.destination);
                osc2.frequency.value = 1200; osc2.type = 'sine';
                gain2.gain.value = 0.1;
                osc2.start(); osc2.stop(ctx.currentTime + 0.15);
            }, 150);
        } catch (e) { }
    }

    /* ======== SEARCH ======== */
    searchInput.addEventListener('input', function () {
        var q = searchInput.value.toLowerCase().trim();
        if (!q) { renderTable(allRows); tableBadge.innerText = allRows.length + ' entries'; return; }
        var filtered = allRows.filter(function (r) {
            return (r.name || '').toLowerCase().indexOf(q) !== -1 ||
                (r.email || '').toLowerCase().indexOf(q) !== -1 ||
                (r.phone || '').toLowerCase().indexOf(q) !== -1 ||
                (r.country || '').toLowerCase().indexOf(q) !== -1 ||
                (r.message || '').toLowerCase().indexOf(q) !== -1;
        });
        renderTable(filtered);
        tableBadge.innerText = filtered.length + '/' + allRows.length;
    });

    /* ======== BULK ACTIONS ======== */
    selectAll.addEventListener('change', function () {
        var cbs = tableBody.querySelectorAll('.row-cb');
        for (var i = 0; i < cbs.length; i++) {
            cbs[i].checked = selectAll.checked;
            var id = cbs[i].getAttribute('data-id');
            if (selectAll.checked) selectedIds.add(id); else selectedIds.delete(id);
            cbs[i].closest('tr').classList.toggle('selected', selectAll.checked);
        }
        updateBulkBar();
    });

    $('bulkClearBtn').addEventListener('click', function () {
        selectedIds.clear();
        selectAll.checked = false;
        var cbs = tableBody.querySelectorAll('.row-cb');
        for (var i = 0; i < cbs.length; i++) { cbs[i].checked = false; cbs[i].closest('tr').classList.remove('selected'); }
        updateBulkBar();
    });

    $('bulkDeleteBtn').addEventListener('click', function () {
        if (selectedIds.size === 0) return;
        if (!confirm('Delete ' + selectedIds.size + ' lead(s)? This cannot be undone.')) return;
        var ids = Array.from(selectedIds);
        sb.from('form_submissions').delete().in('id', ids)
            .then(function (res) {
                if (res.error) throw res.error;
                selectedIds.clear();
                selectAll.checked = false;
                updateBulkBar();
                loadSubmissions();
            })
            .catch(function (err) { alert('Delete failed: ' + err.message); });
    });

    $('bulkStatusBtn').addEventListener('click', function () {
        if (selectedIds.size === 0) return;
        var status = prompt('Enter new status (New / In Progress / Contacted / Resolved):');
        if (!status) return;
        var ids = Array.from(selectedIds);
        sb.from('form_submissions').update({ status: status }).in('id', ids)
            .then(function (res) {
                if (res.error) throw res.error;
                selectedIds.clear();
                selectAll.checked = false;
                updateBulkBar();
                loadSubmissions();
            })
            .catch(function (err) { alert('Update failed: ' + err.message); });
    });

    function updateBulkBar() {
        bulkBar.classList.toggle('active', selectedIds.size > 0);
        bulkCount.textContent = selectedIds.size + ' selected';
    }

    /* ======== CSV EXPORT ======== */
    exportBtn.addEventListener('click', function () {
        if (allRows.length === 0) { alert('No data.'); return; }
        var h = ['Date', 'Name', 'Email', 'Phone', 'Country', 'Message', 'Status', 'Notes'];
        var csv = [h.join(',')];
        allRows.forEach(function (r) {
            var d = new Date(r.created_at);
            csv.push([
                '"' + fmtDate(d) + ' ' + fmtTime(d) + '"',
                '"' + esc(r.name) + '"', '"' + esc(r.email) + '"', '"' + esc(r.phone) + '"',
                '"' + esc(r.country) + '"', '"' + esc(r.message) + '"',
                '"' + esc(r.status || 'New') + '"', '"' + esc(r.notes) + '"'
            ].join(','));
        });
        var blob = new Blob([csv.join('\n')], { type: 'text/csv' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'fefu-leads-' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
    });

    /* ======== LOAD DATA ======== */
    function loadSubmissions() {
        return sb.from('form_submissions').select('*').order('created_at', { ascending: false })
            .then(function (res) {
                if (res.error) throw res.error;
                allRows = res.data || [];
                lastKnownCount = allRows.length;

                totalCount.innerText = allRows.length;
                tableBadge.innerText = allRows.length + ' entries';

                var now = new Date();
                var sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                var sow = new Date(sod); sow.setDate(sod.getDate() - sod.getDay());

                todayCount.innerText = allRows.filter(function (r) { return new Date(r.created_at) >= sod; }).length;
                weekCount.innerText = allRows.filter(function (r) { return new Date(r.created_at) >= sow; }).length;
                pendingCount.innerText = allRows.filter(function (r) { return !r.status || r.status === 'New' || r.status === 'In Progress'; }).length;

                renderTable(allRows);
            })
            .catch(function (err) {
                tableBody.innerHTML = '<tr><td colspan="8" class="empty-state"><h3 style="color:var(--red)">Error</h3><p>' + escHTML(err.message || '') + '</p></td></tr>';
            });
    }

    /* ======== RENDER TABLE ======== */
    function renderTable(data) {
        selectedIds.clear();
        selectAll.checked = false;
        updateBulkBar();

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="empty-state"><h3>No submissions</h3><p>Form submissions will appear here.</p></td></tr>';
            return;
        }

        var html = '';
        data.forEach(function (r) {
            var d = new Date(r.created_at);
            var initials = getInitials(r.name);
            var color = hashColor(r.name);
            var hasMsg = r.message && r.message.trim();
            var status = r.status || 'New';

            html += '<tr data-visitor="' + (r.visitor_id || '') + '" data-rowid="' + r.id + '">' +
                '<td class="cb-cell"><input type="checkbox" class="row-cb" data-id="' + r.id + '"></td>' +
                '<td class="date-cell">' + fmtDate(d) + '<br><small>' + fmtTime(d) + '</small><br><small class="ago">' + timeAgo(d) + '</small></td>' +
                '<td><div class="name-cell">' +
                '<div class="avatar" style="background:' + color + '">' + initials + '</div>' +
                '<div>' +
                '<div style="font-weight:700;font-size:14px;color:#fff;">' + escHTML(r.name || '—') + '</div>' +
                (r.device_info && r.device_info.source === 'virtual_tour_form' ? '<span class="country-badge" style="background:rgba(37,99,235,0.15);color:#60a5fa;border-color:rgba(37,99,235,0.3);">🎥 VTour</span>' : '') +
                (r.country ? '<span class="country-badge">' + escHTML(r.country) + '</span>' : '') +
                '</div>' +
                '</div></td>' +
                '<td class="contact-cell">' +
                '<div><span class="icon">📧</span> ' + (r.email ? '<a href="mailto:' + escHTML(r.email) + '" style="color:#a78bfa;font-weight:600;font-size:13px;">' + escHTML(r.email) + '</a>' : '—') + '</div>' +
                '<div><span class="icon">📞</span> ' + (r.phone ? '<a href="tel:' + escHTML(r.phone) + '" style="color:#10b981;font-weight:600;font-size:13px;">' + escHTML(r.phone) + '</a>' : '—') + '</div>' +
                '</td>' +
                '<td class="engagement-col" id="eng-' + r.id + '"><span style="color:var(--text-muted);font-size:11px;">—</span></td>' +
                '<td class="msg-cell"><div class="msg-box ' + (hasMsg ? '' : 'empty') + '">' + (hasMsg ? escHTML(r.message) : 'No message') + '</div></td>' +
                '<td><select class="status-select" data-id="' + r.id + '">' +
                '<option value="New"' + (status === 'New' ? ' selected' : '') + '>🔵 New</option>' +
                '<option value="In Progress"' + (status === 'In Progress' ? ' selected' : '') + '>🟡 In Progress</option>' +
                '<option value="Contacted"' + (status === 'Contacted' ? ' selected' : '') + '>🟢 Contacted</option>' +
                '<option value="Resolved"' + (status === 'Resolved' ? ' selected' : '') + '>⚪ Resolved</option>' +
                '</select></td>' +
                '<td><div class="row-actions">' +
                '<button class="view-btn" data-id="' + r.id + '" title="View Details">👁</button>' +
                '<button class="wa-btn" data-phone="' + escHTML(r.phone || '') + '" data-name="' + escHTML(r.name || '') + '" title="WhatsApp">💬</button>' +
                '<button class="del-btn" data-id="' + r.id + '" title="Delete">🗑</button>' +
                '</div></td>' +
                '</tr>';
        });

        tableBody.innerHTML = html;

        // Enrich table with analytics data
        enrichTableWithAnalytics();

        // Checkboxes
        var cbs = tableBody.querySelectorAll('.row-cb');
        for (var i = 0; i < cbs.length; i++) {
            cbs[i].addEventListener('change', function () {
                var id = this.getAttribute('data-id');
                if (this.checked) selectedIds.add(id); else selectedIds.delete(id);
                this.closest('tr').classList.toggle('selected', this.checked);
                updateBulkBar();
            });
        }

        // Status selects
        var selects = tableBody.querySelectorAll('.status-select');
        for (var i = 0; i < selects.length; i++) {
            selects[i].addEventListener('change', function () {
                var el = this, id = el.getAttribute('data-id'), val = el.value;
                el.disabled = true; el.style.opacity = '0.5';
                sb.from('form_submissions').update({ status: val }).eq('id', id)
                    .then(function (res) {
                        if (res.error) throw res.error;
                        var row = allRows.find(function (r) { return r.id === id; });
                        if (row) row.status = val;
                        pendingCount.innerText = allRows.filter(function (r) { return !r.status || r.status === 'New' || r.status === 'In Progress'; }).length;
                    })
                    .catch(function () { alert('Status update failed.'); loadSubmissions(); })
                    .finally(function () { el.disabled = false; el.style.opacity = '1'; });
            });
        }

        // Tap message to open modal (mobile optimization)
        var msgBoxes = tableBody.querySelectorAll('.msg-box:not(.empty)');
        for (var i = 0; i < msgBoxes.length; i++) {
            msgBoxes[i].addEventListener('click', function () {
                var tr = this.closest('tr');
                if (tr) {
                    var viewBtn = tr.querySelector('.view-btn');
                    if (viewBtn) viewBtn.click();
                }
            });
        }

        // View buttons
        var viewBtns = tableBody.querySelectorAll('.view-btn');
        for (var i = 0; i < viewBtns.length; i++) {
            viewBtns[i].addEventListener('click', function () {
                var id = this.getAttribute('data-id');
                var row = allRows.find(function (r) { return r.id === id; });
                if (row) openDetailModal(row);
            });
        }

        // WhatsApp buttons
        var waBtns = tableBody.querySelectorAll('.wa-btn');
        for (var i = 0; i < waBtns.length; i++) {
            waBtns[i].addEventListener('click', function () {
                var phone = this.getAttribute('data-phone').replace(/[\s\-]/g, '');
                var name = this.getAttribute('data-name');
                if (!phone) { alert('No phone number.'); return; }
                if (!phone.startsWith('+')) phone = '+91' + phone;
                var msg = encodeURIComponent('Hi ' + name + '! Thank you for your interest in MBBS at FEFU. How can I help you?');
                window.open('https://wa.me/' + phone.replace('+', '') + '?text=' + msg, '_blank');
            });
        }

        // Delete buttons
        var delBtns = tableBody.querySelectorAll('.del-btn');
        for (var i = 0; i < delBtns.length; i++) {
            delBtns[i].addEventListener('click', function () {
                var id = this.getAttribute('data-id');
                if (!confirm('Delete this lead? This cannot be undone.')) return;
                sb.from('form_submissions').delete().eq('id', id)
                    .then(function (res) { if (res.error) throw res.error; loadSubmissions(); })
                    .catch(function () { alert('Delete failed.'); });
            });
        }
    }

    /* ======== DETAIL MODAL ======== */
    function openDetailModal(row) {
        var d = new Date(row.created_at);
        var device = row.device_info || {};
        var tz = device.timezone || '';
        var city = tz.split('/').pop().replace(/_/g, ' ');

        var html = '<div class="detail-grid">' +
            detailItem('Full Name', row.name || '—') +
            detailItem('Email', row.email ? '<a href="mailto:' + escHTML(row.email) + '">' + escHTML(row.email) + '</a>' : '—') +
            detailItem('Phone', row.phone ? '<a href="tel:' + escHTML(row.phone) + '">' + escHTML(row.phone) + '</a>' : '—') +
            detailItem('Country', row.country || '—') +
            detailItem('Status', row.status || 'New') +
            detailItem('Submitted', fmtDate(d) + ' ' + fmtTime(d) + ' (' + timeAgo(d) + ')') +
            '</div>';

        if (row.message) {
            html += '<div class="detail-msg">' + escHTML(row.message) + '</div>';
        }

        // Notes
        html += '<div class="notes-section">' +
            '<h4>📝 Internal Notes</h4>' +
            '<textarea class="notes-textarea" id="notesInput" placeholder="Add private notes about this lead...">' + escHTML(row.notes || '') + '</textarea>' +
            '<button class="notes-save" id="notesSaveBtn">Save Notes</button>' +
            '</div>';

        // Device Info
        html += '<h4 style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;font-weight:600;">📊 Device & Analytics</h4>';
        html += '<div class="device-grid">';
        if (device.source) html += '<span class="device-tag" style="background:var(--blue);color:#fff;border-color:var(--blue);">📌 Source: ' + escHTML(device.source === 'virtual_tour_form' ? 'Virtual Tour Form' : device.source) + '</span>';
        if (device.screenResolution) html += '<span class="device-tag">🖥 Screen: ' + escHTML(device.screenResolution) + '</span>';
        if (device.windowSize) html += '<span class="device-tag">📐 Window: ' + escHTML(device.windowSize) + '</span>';
        html += '<span class="device-tag">🌐 ' + parseBrowser(device.userAgent) + '</span>';
        if (city) html += '<span class="device-tag">🕐 ' + escHTML(city) + (device.timezoneOffset ? ' (' + device.timezoneOffset + ')' : '') + '</span>';
        if (device.platform) html += '<span class="device-tag">💻 ' + escHTML(device.platform) + '</span>';
        if (device.connection && device.connection !== 'unknown') html += '<span class="device-tag">📶 ' + escHTML(device.connection) + '</span>';
        if (device.touchscreen) html += '<span class="device-tag">📱 Touch: ' + device.touchscreen + '</span>';
        if (device.language) html += '<span class="device-tag">🗣 ' + escHTML(device.language) + '</span>';
        if (device.formTimeSpent) html += '<span class="device-tag">⏱ Form: ' + escHTML(device.formTimeSpent) + '</span>';
        if (device.firstFieldClicked) html += '<span class="device-tag">🎯 First: ' + escHTML(device.firstFieldClicked) + '</span>';
        if (device.scrollDepth) html += '<span class="device-tag">📜 Max Scroll Depth: ' + escHTML(device.scrollDepth) + '</span>';
        if (device.exitIntent) html += '<span class="device-tag">🚪 Exit Intent Triggered: ' + escHTML(device.exitIntent) + '</span>';
        if (device.adblockDetected) html += '<span class="device-tag">🛑 Adblock/Plugins: ' + escHTML(device.adblockDetected) + '</span>';
        if (device.referrer) html += '<span class="device-tag ref-tag">🔗 ' + escHTML(device.referrer === 'Direct' ? 'Direct' : device.referrer) + '</span>';
        html += '</div>';

        // Lead Intelligence Section
        html += '<h4 style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 8px;font-weight:600;">📊 Lead Intelligence</h4>';
        html += '<div id="leadIntelContainer"><span style="color:var(--text-muted);font-size:12px;">Analyzing browsing data…</span></div>';

        // Browsing History
        html += '<h4 style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 8px;font-weight:600;">🗺️ Browsing Journey</h4>';
        html += '<div id="browsingHistoryContainer"><span style="color:var(--text-muted);font-size:12px;">Loading browsing data…</span></div>';

        modalBody.innerHTML = html;

        // Load browsing data and intelligence if visitor_id exists
        if (row.visitor_id) {
            loadLeadIntelligence(row.visitor_id, $('leadIntelContainer'));
            loadBrowsingHistory(row.visitor_id, $('browsingHistoryContainer'));
        } else {
            $('leadIntelContainer').innerHTML = '<p style="color:var(--text-muted);font-size:12px;">No linked analytics. Visitor did not have tracker cookies.</p>';
            $('browsingHistoryContainer').innerHTML = '<p style="color:var(--text-muted);font-size:12px;">No browsing journey available.</p>';
        }

        // Modal actions
        modalActions.innerHTML =
            '<button class="btn-wa" onclick="window.open(\'https://wa.me/' + (row.phone || '').replace(/[\s\-+]/g, '') + '?text=' + encodeURIComponent('Hi ' + (row.name || '') + '! Thank you for your interest in MBBS at FEFU.') + '\', \'_blank\')">💬 WhatsApp</button>' +
            '<button class="btn-email" id="openEmailTpl">📧 Email Reply</button>' +
            '<button class="btn-del" id="modalDeleteBtn">🗑 Delete Lead</button>';

        detailModal.classList.add('active');

        // Notes save handler
        $('notesSaveBtn').addEventListener('click', function () {
            var btn = this;
            btn.disabled = true; btn.textContent = 'Saving...';
            var notes = $('notesInput').value;
            sb.from('form_submissions').update({ notes: notes }).eq('id', row.id)
                .then(function (res) {
                    if (res.error) throw res.error;
                    btn.textContent = '✅ Saved!';
                    row.notes = notes;
                    setTimeout(function () { btn.textContent = 'Save Notes'; btn.disabled = false; }, 1500);
                })
                .catch(function () { btn.textContent = 'Error'; btn.disabled = false; });
        });

        // Delete from modal
        $('modalDeleteBtn').addEventListener('click', function () {
            if (!confirm('Delete this lead permanently?')) return;
            sb.from('form_submissions').delete().eq('id', row.id)
                .then(function (res) {
                    if (res.error) throw res.error;
                    detailModal.classList.remove('active');
                    loadSubmissions();
                })
                .catch(function () { alert('Delete failed.'); });
        });

        // Email templates
        $('openEmailTpl').addEventListener('click', function () {
            renderEmailTemplates(row);
            emailModal.classList.add('active');
        });
    }

    function detailItem(label, value) {
        return '<div class="detail-item"><label>' + label + '</label><div class="val">' + value + '</div></div>';
    }

    modalClose.addEventListener('click', function () { detailModal.classList.remove('active'); });
    detailModal.addEventListener('click', function (e) { if (e.target === detailModal) detailModal.classList.remove('active'); });
    emailModal.addEventListener('click', function (e) { if (e.target === emailModal) emailModal.classList.remove('active'); });

    /* ======== EMAIL TEMPLATES ======== */
    function renderEmailTemplates(row) {
        var html = '';
        templates.forEach(function (tpl) {
            var body = tpl.body.replace(/\{name\}/g, row.name || 'Student');
            var mailto = 'mailto:' + (row.email || '') + '?subject=' + encodeURIComponent(tpl.subject) + '&body=' + encodeURIComponent(body);
            html += '<a href="' + mailto + '" class="email-tpl" style="text-decoration:none;">' +
                '<h5>' + tpl.name + '</h5>' +
                '<p>' + escHTML(tpl.body.substring(0, 120)) + '...</p>' +
                '</a>';
        });
        emailTemplates.innerHTML = html;
    }

    /* ======== HELPERS ======== */
    function escHTML(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function esc(s) { return (s || '').replace(/"/g, '""'); }
    function fmtDate(d) { return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    function fmtTime(d) { return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }

    function timeAgo(d) {
        var s = Math.floor((Date.now() - d.getTime()) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return Math.floor(s / 60) + 'm ago';
        if (s < 86400) return Math.floor(s / 3600) + 'h ago';
        if (s < 604800) return Math.floor(s / 86400) + 'd ago';
        return Math.floor(s / 604800) + 'w ago';
    }

    function getInitials(n) {
        if (!n) return '?';
        return n.split(' ').filter(Boolean).map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
    }

    function hashColor(s) {
        if (!s) return 'rgba(139,92,246,0.3)';
        var h = 0; for (var i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
        return 'hsl(' + (Math.abs(h) % 360) + ', 60%, 35%)';
    }

    function parseBrowser(ua) {
        if (!ua) return 'Unknown';
        if (ua.indexOf('Edg') !== -1) return 'Edge';
        if (ua.indexOf('Chrome') !== -1) return 'Chrome';
        if (ua.indexOf('Firefox') !== -1) return 'Firefox';
        if (ua.indexOf('Safari') !== -1) return 'Safari';
        return 'Other';
    }

    /* ======== ANALYTICS ======== */
    var analyticsBtn = $('analyticsBtn');
    var analyticsSection = $('analyticsSection');
    var dateRangeBtns = $('dateRangeBtns');
    var currentRange = 7; // default 7 days

    analyticsBtn.addEventListener('click', function () {
        var isActive = analyticsSection.classList.toggle('active');
        if (isActive) loadAnalytics();
    });

    // Date range buttons
    dateRangeBtns.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        var btns = dateRangeBtns.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
        btn.classList.add('active');
        currentRange = btn.getAttribute('data-range');
        loadAnalytics();
    });

    function getDateFilter() {
        if (currentRange === 'all') return null;
        var d = new Date();
        d.setDate(d.getDate() - parseInt(currentRange));
        return d.toISOString();
    }

    function loadAnalytics() {
        var since = getDateFilter();
        var query = sb.from('page_views').select('*').order('created_at', { ascending: false });
        if (since) query = query.gte('created_at', since);
        query.limit(5000).then(function (res) {
            if (res.error) { console.error(res.error); return; }
            var views = res.data || [];
            renderTopPages(views);
            renderReferrers(views);
            renderFunnel(views);
        });
    }

    function renderTopPages(views) {
        // Aggregate by page_url
        var pages = {};
        views.forEach(function (v) {
            var url = v.page_url || 'unknown';
            if (!pages[url]) pages[url] = { views: 0, totalTime: 0, bounces: 0 };
            pages[url].views++;
            pages[url].totalTime += (v.time_spent_seconds || 0);
            if ((v.time_spent_seconds || 0) <= 10) pages[url].bounces++;
        });

        var sorted = Object.keys(pages).sort(function (a, b) { return pages[b].views - pages[a].views; });
        var maxViews = sorted.length > 0 ? pages[sorted[0]].views : 1;
        var body = $('topPagesBody');

        if (sorted.length === 0) {
            body.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted)">No data yet. Visit your website!</td></tr>';
            return;
        }

        var html = '';
        sorted.slice(0, 10).forEach(function (url) {
            var p = pages[url];
            var avg = Math.round(p.totalTime / p.views);
            var bounceRate = Math.round((p.bounces / p.views) * 100);
            var barW = Math.round((p.views / maxViews) * 100);
            var bounceClass = bounceRate <= 30 ? 'bounce-low' : bounceRate <= 60 ? 'bounce-mid' : 'bounce-high';
            var pageName = prettyPageName(url);

            html += '<tr>' +
                '<td style="font-weight:600;">' + escHTML(pageName) + '</td>' +
                '<td>' + p.views + '</td>' +
                '<td>' + formatTime(avg) + '</td>' +
                '<td><span class="bounce-tag ' + bounceClass + '">' + bounceRate + '%</span></td>' +
                '<td class="bar-cell"><div class="mini-bar"><div class="mini-bar-fill" style="width:' + barW + '%"></div></div></td>' +
                '</tr>';
        });
        body.innerHTML = html;
    }

    function renderReferrers(views) {
        var refs = {};
        views.forEach(function (v) {
            var ref = v.referrer || 'Direct';
            if (ref === 'Direct' || ref === '') ref = '🎯 Direct';
            else {
                try {
                    var hostname = new URL(ref).hostname;
                    if (hostname.indexOf('google') !== -1) ref = '🔍 Google';
                    else if (hostname.indexOf('instagram') !== -1) ref = '📷 Instagram';
                    else if (hostname.indexOf('facebook') !== -1) ref = '📘 Facebook';
                    else if (hostname.indexOf('whatsapp') !== -1) ref = '💬 WhatsApp';
                    else if (hostname.indexOf('youtube') !== -1) ref = '▶️ YouTube';
                    else ref = '🌐 ' + hostname;
                } catch (e) { ref = '🌐 ' + ref.substring(0, 30); }
            }
            refs[ref] = (refs[ref] || 0) + 1;
        });

        var sorted = Object.keys(refs).sort(function (a, b) { return refs[b] - refs[a]; });
        var el = $('referrerList');

        if (sorted.length === 0) {
            el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">No data yet.</div>';
            return;
        }

        var html = '';
        sorted.forEach(function (name) {
            html += '<div class="referrer-item">' +
                '<span class="referrer-name">' + escHTML(name) + '</span>' +
                '<span class="referrer-count">' + refs[name] + '</span>' +
                '</div>';
        });
        el.innerHTML = html;
    }

    function renderFunnel(views) {
        // Unique visitors
        var visitors = {};
        var contactVisitors = {};
        views.forEach(function (v) {
            visitors[v.visitor_id] = true;
            if (v.page_url && v.page_url.indexOf('index.html') !== -1) {
                // Check if scroll depth suggests they reached contact section
                // For simplicity: anyone visiting index counts as potential
            }
            if (v.page_url && (v.page_url.indexOf('contact') !== -1 || v.page_url.indexOf('index.html') !== -1)) {
                contactVisitors[v.visitor_id] = true;
            }
        });

        var totalVisitors = Object.keys(visitors).length;
        var contactCount = Object.keys(contactVisitors).length;
        var formCount = allRows.length; // from the submissions data

        var funnelAll = $('funnelAll');
        var funnelContact = $('funnelContact');
        var funnelSubmitted = $('funnelSubmitted');

        funnelAll.textContent = totalVisitors;
        funnelAll.style.width = '100%';

        var contactPct = totalVisitors > 0 ? Math.round((contactCount / totalVisitors) * 100) : 0;
        funnelContact.textContent = contactCount + ' (' + contactPct + '%)';
        funnelContact.style.width = Math.max(contactPct, 5) + '%';

        var formPct = totalVisitors > 0 ? Math.round((formCount / totalVisitors) * 100) : 0;
        funnelSubmitted.textContent = formCount + ' (' + formPct + '%)';
        funnelSubmitted.style.width = Math.max(formPct, 5) + '%';
    }

    function prettyPageName(url) {
        if (!url || url === '/' || url === '/index.html') return '🏠 Home';
        if (url.indexOf('gallery') !== -1) return '🖼️ Gallery';
        if (url.indexOf('blog-post') !== -1) return '📖 Blog Post';
        if (url.indexOf('blog') !== -1) return '📝 Blog';
        if (url.indexOf('is-mbbs') !== -1) return '📄 Safety Blog';
        if (url.indexOf('mbbs-in-russia') !== -1) return '📄 Top 10 Blog';
        return url.replace(/\//g, '').replace('.html', '') || url;
    }

    function formatTime(seconds) {
        if (seconds < 60) return seconds + 's';
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        return m + 'm ' + s + 's';
    }

    /* ======== LIVE VISITOR COUNTER ======== */
    function updateLiveCount() {
        var fiveMinAgo = new Date(Date.now() - 300000).toISOString();
        sb.from('page_views').select('visitor_id', { count: 'exact', head: false })
            .gte('created_at', fiveMinAgo)
            .then(function (res) {
                if (res.error) return;
                var uniqueVisitors = {};
                (res.data || []).forEach(function (r) { uniqueVisitors[r.visitor_id] = true; });
                var count = Object.keys(uniqueVisitors).length;
                var el = $('liveCount');
                if (el) el.textContent = count;
            });
    }

    /* ======== ENRICHMENT: TABLE BADGES ======== */
    function enrichTableWithAnalytics() {
        // Collect all visitor_ids from the table
        var visitorIds = [];
        var visitorToRowId = {};
        allRows.forEach(function (r) {
            if (r.visitor_id) {
                visitorIds.push(r.visitor_id);
                visitorToRowId[r.visitor_id] = r.id;
            }
        });

        if (visitorIds.length === 0) return;

        // Batch fetch all page_views for these visitor_ids
        sb.from('page_views').select('*')
            .in('visitor_id', visitorIds)
            .order('created_at', { ascending: true })
            .limit(10000)
            .then(function (res) {
                if (res.error || !res.data) return;

                // Group by visitor_id
                var byVisitor = {};
                res.data.forEach(function (v) {
                    if (!byVisitor[v.visitor_id]) byVisitor[v.visitor_id] = [];
                    byVisitor[v.visitor_id].push(v);
                });

                // Compute and render for each row
                allRows.forEach(function (r) {
                    if (!r.visitor_id) return;
                    var views = byVisitor[r.visitor_id] || [];
                    if (views.length === 0) return;
                    var intel = computeLeadIntel(views);
                    var cell = $('eng-' + r.id);
                    if (!cell) return;

                    var engClass = intel.score >= 7 ? 'eng-hot' : intel.score >= 4 ? 'eng-warm' : 'eng-cold';
                    var engLabel = intel.score >= 7 ? '🔥 Hot' : intel.score >= 4 ? '🌤️ Warm' : '❄️ Cold';

                    var html = '<span class="engagement-badge ' + engClass + '">' + engLabel + '</span>';
                    html += '<div class="lead-stats">' + intel.pageCount + ' pages · ' + formatTime(intel.totalTime) + '</div>';
                    html += '<div class="lead-tags">';
                    intel.tags.forEach(function (t) {
                        html += '<span class="lead-tag ' + t.cls + '">' + t.label + '</span>';
                    });
                    html += '</div>';
                    cell.innerHTML = html;
                });
            });
    }

    function computeLeadIntel(views) {
        var totalTime = 0;
        var pageCount = views.length;
        var visitDays = {};
        var pages = {};
        var hasBlog = false, hasGallery = false;
        var entryPage = views[0] ? views[0].page_url : '';
        var lastPage = views[views.length - 1] ? views[views.length - 1].page_url : '';
        var referrer = views[0] ? (views[0].referrer || 'Direct') : 'Direct';

        views.forEach(function (v) {
            totalTime += (v.time_spent_seconds || 0);
            var day = new Date(v.created_at).toDateString();
            visitDays[day] = true;
            var url = v.page_url || '';
            if (!pages[url]) pages[url] = { time: 0, views: 0 };
            pages[url].time += (v.time_spent_seconds || 0);
            pages[url].views++;
            if (url.indexOf('blog') !== -1) hasBlog = true;
            if (url.indexOf('gallery') !== -1) hasGallery = true;
        });

        var dayCount = Object.keys(visitDays).length;

        // Most interested page (highest total time)
        var mostInterestedPage = '';
        var maxTime = 0;
        Object.keys(pages).forEach(function (url) {
            if (pages[url].time > maxTime) {
                maxTime = pages[url].time;
                mostInterestedPage = url;
            }
        });

        // Interest Score (1-10)
        var score = 1;
        if (pageCount >= 2) score += 1;
        if (pageCount >= 4) score += 1;
        if (pageCount >= 6) score += 1;
        if (totalTime >= 60) score += 1;
        if (totalTime >= 180) score += 1;
        if (totalTime >= 300) score += 1;
        if (dayCount >= 2) score += 1;
        if (dayCount >= 3) score += 1;
        if (hasBlog || hasGallery) score += 1;
        score = Math.min(score, 10);

        // Auto Tags
        var tags = [];
        if (dayCount > 1) tags.push({ label: '🔄 Returning', cls: 'tag-returning' });
        if (hasBlog) tags.push({ label: '📄 Blog Reader', cls: 'tag-blog' });
        if (hasGallery) tags.push({ label: '🖼️ Gallery Viewer', cls: 'tag-gallery' });

        // Referrer tag
        try {
            if (referrer && referrer !== 'Direct') {
                var hostname = new URL(referrer).hostname;
                if (hostname.indexOf('google') !== -1) tags.push({ label: '🔍 Google', cls: '' });
                else if (hostname.indexOf('instagram') !== -1) tags.push({ label: '📷 Insta', cls: '' });
                else if (hostname.indexOf('facebook') !== -1) tags.push({ label: '📘 FB', cls: '' });
            }
        } catch (e) { /* ignore */ }

        return {
            score: score,
            totalTime: totalTime,
            pageCount: pageCount,
            dayCount: dayCount,
            entryPage: entryPage,
            lastPage: lastPage,
            mostInterestedPage: mostInterestedPage,
            mostInterestedTime: maxTime,
            tags: tags,
            referrer: referrer
        };
    }

    /* ======== LEAD INTELLIGENCE IN DETAIL MODAL ======== */
    function loadLeadIntelligence(visitorId, container) {
        sb.from('page_views').select('*')
            .eq('visitor_id', visitorId)
            .order('created_at', { ascending: true })
            .limit(200)
            .then(function (res) {
                if (res.error || !res.data || res.data.length === 0) {
                    container.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">No analytics data found.</p>';
                    return;
                }

                var intel = computeLeadIntel(res.data);

                var scoreColor = intel.score >= 7 ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                    intel.score >= 4 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                        'linear-gradient(135deg, #64748b, #475569)';

                var html = '<div class="lead-analytics-grid">';

                // Interest Score
                html += '<div class="lead-stat-card">' +
                    '<div class="interest-score-ring" style="background:' + scoreColor + '">' + intel.score + '/10</div>' +
                    '<div class="stat-label">Interest Score</div></div>';

                // Total Time
                html += '<div class="lead-stat-card">' +
                    '<div class="stat-icon">⏱️</div>' +
                    '<div class="stat-value">' + formatTime(intel.totalTime) + '</div>' +
                    '<div class="stat-label">Total Time on Site</div></div>';

                // Pages Visited
                html += '<div class="lead-stat-card">' +
                    '<div class="stat-icon">📄</div>' +
                    '<div class="stat-value">' + intel.pageCount + '</div>' +
                    '<div class="stat-label">Pages Visited</div></div>';

                // Visit Days
                html += '<div class="lead-stat-card">' +
                    '<div class="stat-icon">📅</div>' +
                    '<div class="stat-value">' + intel.dayCount + '</div>' +
                    '<div class="stat-label">Separate Visits</div></div>';

                // Most Interested Page
                html += '<div class="lead-stat-card">' +
                    '<div class="stat-icon">🏆</div>' +
                    '<div class="stat-value" style="font-size:14px;">' + prettyPageName(intel.mostInterestedPage) + '</div>' +
                    '<div class="stat-label">Most Time (' + formatTime(intel.mostInterestedTime) + ')</div></div>';

                // Entry Page
                html += '<div class="lead-stat-card">' +
                    '<div class="stat-icon">📍</div>' +
                    '<div class="stat-value" style="font-size:14px;">' + prettyPageName(intel.entryPage) + '</div>' +
                    '<div class="stat-label">First Page Visited</div></div>';

                // Last Page Before Form
                html += '<div class="lead-stat-card">' +
                    '<div class="stat-icon">🎯</div>' +
                    '<div class="stat-value" style="font-size:14px;">' + prettyPageName(intel.lastPage) + '</div>' +
                    '<div class="stat-label">Last Page Before Form</div></div>';

                // Traffic Source
                var sourceLabel = 'Direct';
                try {
                    if (intel.referrer && intel.referrer !== 'Direct') {
                        var h = new URL(intel.referrer).hostname;
                        if (h.indexOf('google') !== -1) sourceLabel = '🔍 Google';
                        else if (h.indexOf('instagram') !== -1) sourceLabel = '📷 Instagram';
                        else if (h.indexOf('facebook') !== -1) sourceLabel = '📘 Facebook';
                        else sourceLabel = '🌐 ' + h;
                    } else sourceLabel = '🎯 Direct';
                } catch (e) { sourceLabel = '🎯 Direct'; }

                html += '<div class="lead-stat-card">' +
                    '<div class="stat-icon">🔗</div>' +
                    '<div class="stat-value" style="font-size:14px;">' + sourceLabel + '</div>' +
                    '<div class="stat-label">Traffic Source</div></div>';

                html += '</div>';
                container.innerHTML = html;
            });
    }

    /* ======== BROWSING HISTORY IN DETAIL MODAL ======== */
    function loadBrowsingHistory(visitorId, container) {
        sb.from('page_views').select('*')
            .eq('visitor_id', visitorId)
            .order('created_at', { ascending: true })
            .limit(50)
            .then(function (res) {
                if (res.error || !res.data || res.data.length === 0) {
                    container.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">No browsing data found.</p>';
                    return;
                }

                var visitDates = {};
                res.data.forEach(function (v) {
                    var day = new Date(v.created_at).toDateString();
                    visitDates[day] = true;
                });
                var visitCount = Object.keys(visitDates).length;

                var html = '';
                if (visitCount > 1) {
                    html += '<span class="return-badge">🔄 ' + visitCount + ' separate visit sessions</span>';
                }
                html += '<div class="browsing-history">';
                res.data.forEach(function (v) {
                    var d = new Date(v.created_at);
                    html += '<div class="history-item">' +
                        '<span class="history-page">' + prettyPageName(v.page_url) + '</span>' +
                        '<div class="history-meta">' +
                        '<span class="history-time">⏱ ' + formatTime(v.time_spent_seconds || 0) + '</span>' +
                        '<span class="history-date">' + fmtDate(d) + ' ' + fmtTime(d) + '</span>' +
                        '</div></div>';
                });
                html += '</div>';
                container.innerHTML = html;
            });
    }

    checkAuth();

    // Start live counter polling after auth
    if (localStorage.getItem(AUTH_KEY) === 'true') {
        updateLiveCount();
        setInterval(updateLiveCount, 30000);
    }
})();

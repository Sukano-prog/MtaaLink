/* ============================================================
MtaaLink - Event Detail Page
============================================================ */
import { getEvent, updateEvent, deleteEvent } from '../core/api.js';
import { getMembers } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showConfirm, showModal, showFormModal } from '../components/modal.js';
import { createSearchableSelect } from '../components/searchable_select.js';

let currentEvent = null;
let eventMembers = [];
let eventContributions = [];
let allMembers = [];
let eventId = null;
let currentTab = 'overview';

export async function renderEventDetail(id) {
    eventId = id;
    const content = document.getElementById('pageContent');
    
    try {
        // Force fresh data with cache-busting
        const eventData = await getEvent(eventId);
        currentEvent = eventData;
        eventMembers = eventData.attendance || [];
        eventContributions = eventData.contributions || [];
        allMembers = await getMembers().catch(() => []);
        
        content.innerHTML = `
            <div class="page-header">
                <button class="btn btn-outline" onclick="navigateTo('events')">Back</button>
                <h2>${currentEvent.title}</h2>
                <div>
                    <button class="btn btn-primary" onclick="editEvent()">Edit</button>
                    <button class="btn btn-danger" onclick="deleteEvent()">Delete</button>
                    <button class="btn btn-success" onclick="exportPDF()">Export PDF</button>
                </div>
            </div>
            <div style="display:flex;gap:4px;border-bottom:2px solid var(--gray-200);margin-bottom:20px;overflow-x:auto;">
                <button class="tab-btn active" data-tab="overview" onclick="switchTab('overview')">Overview</button>
                <button class="tab-btn" data-tab="attendees" onclick="switchTab('attendees')">Attendees (${eventMembers.length})</button>
                <button class="tab-btn" data-tab="payments" onclick="switchTab('payments')">Payments (${eventContributions.length})</button>
                <button class="tab-btn" data-tab="report" onclick="switchTab('report')">Report</button>
            </div>
            <div id="tabContent">
                ${renderOverview()}
            </div>
        `;
        
        // Add styles
        if (!document.getElementById('eventDetailStyles')) {
            const style = document.createElement('style');
            style.id = 'eventDetailStyles';
            style.textContent = `
                .tab-btn {
                    padding: 10px 20px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--gray-500);
                    border-bottom: 3px solid transparent;
                    white-space: nowrap;
                }
                .tab-btn.active {
                    color: var(--primary);
                    border-bottom-color: var(--primary);
                }
                .check-in-btn {
                    padding: 4px 12px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .check-in-btn.checked {
                    background: #d4edda;
                    color: #155724;
                }
                .check-in-btn.unchecked {
                    background: #f8d7da;
                    color: #721c24;
                }
                .visitor-badge {
                    background: #f3f4f6;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    color: #6b7280;
                    margin-left: 6px;
                }
                .modal-body {
                    overflow: visible !important;
                }
                .searchable-select-container {
                    position: relative;
                    z-index: 9999;
                }
                .searchable-select-dropdown {
                    position: absolute !important;
                    z-index: 99999 !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Switch to stored tab after render
        setTimeout(function() {
            switchTab(currentTab);
        }, 50);
        
    } catch (error) {
        content.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <p style="color:var(--danger);">Failed to load event: ${error.message}</p>
                    <button class="btn btn-primary" onclick="renderEventDetail('${eventId}')">Retry</button>
                </div>
            </div>
        `;
    }
}

// ===== OVERVIEW TAB =====
function renderOverview() {
    const e = currentEvent;
    const checkedIn = eventMembers.filter(function(m) { return m.attended; }).length;
    const totalCollected = eventContributions.reduce(function(sum, c) { return sum + (c.amount || 0); }, 0);
    
    return `
        <div class="card">
            <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;">
                    <div style="background:var(--gray-50);padding:16px;border-radius:8px;text-align:center;">
                        <div style="font-size:24px;font-weight:700;color:var(--primary);">${eventMembers.length}</div>
                        <div style="font-size:13px;color:var(--gray-500);">Attendees</div>
                    </div>
                    <div style="background:var(--gray-50);padding:16px;border-radius:8px;text-align:center;">
                        <div style="font-size:24px;font-weight:700;color:var(--success);">${checkedIn}</div>
                        <div style="font-size:13px;color:var(--gray-500);">Checked In</div>
                    </div>
                    <div style="background:var(--gray-50);padding:16px;border-radius:8px;text-align:center;">
                        <div style="font-size:24px;font-weight:700;color:var(--info);">KES ${totalCollected}</div>
                        <div style="font-size:13px;color:var(--gray-500);">Collected</div>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
                    <div><strong>Type:</strong> ${e.event_type || 'General'}</div>
                    <div><strong>Date:</strong> ${e.date ? new Date(e.date).toLocaleDateString() : 'Not set'}</div>
                    <div><strong>Time:</strong> ${e.time || 'Not set'}</div>
                    <div><strong>Location:</strong> ${e.location || 'Not set'}</div>
                    <div><strong>Status:</strong> <span class="badge badge-${e.status === 'completed' ? 'success' : e.status === 'ongoing' ? 'warning' : 'primary'}">${e.status || 'Upcoming'}</span></div>
                    <div><strong>Organizer:</strong> ${e.organizer_name || 'Not set'}</div>
                </div>
                ${e.description ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--gray-200);"><strong>Description</strong><p style="margin-top:4px;color:var(--gray-600);">${e.description}</p></div>` : ''}
            </div>
        </div>
    `;
}

// ===== ATTENDEES TAB =====
function renderAttendees() {
    if (eventMembers.length === 0) {
        return `
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;">Attendees</h3>
                    <button class="btn btn-primary btn-sm" onclick="addAttendee()">+ Add</button>
                </div>
                <div class="card-body">
                    <p class="text-muted">No attendees yet.</p>
                </div>
            </div>
        `;
    }
    
    let html = `
        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <h3 style="margin:0;">Attendees (${eventMembers.length})</h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <input type="text" id="attendeeSearch" class="form-control" placeholder="Search attendees..." style="width:200px;padding:4px 10px;font-size:13px;">
                    <button class="btn btn-primary btn-sm" onclick="addAttendee()">+ Add</button>
                </div>
            </div>
            <div class="card-body" style="padding:0;">
                <div style="overflow-x:auto;">
                    <table class="table" style="margin:0;" id="attendeeTable">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Gender</th>
                                <th>Age</th>
                                <th id="eventCustomFieldHeader" style="display:none;">Custom Field</th>
                <th>Phone</th>
                                <th>Status</th>
                                <th style="text-align:center;">Check In</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    for (var i = 0; i < eventMembers.length; i++) {
        var m = eventMembers[i];
        var isVisitor = m.is_visitor || false;
        var nameDisplay = m.member_name || 'Unknown';
        var badge = isVisitor ? ' <span class="visitor-badge">Visitor</span>' : '';
        var genderDisplay = m.member_gender || '-';
        var ageDisplay = m.member_age_category || '-';
        var phoneDisplay = m.phone || m.member_phone || '-';
        var statusText = m.attended ? 'Checked In' : 'Not Checked In';
        var statusColor = m.attended ? 'var(--success)' : 'var(--gray-400)';
        var btnClass = m.attended ? 'checked' : 'unchecked';
        var btnText = m.attended ? 'Checked In' : 'Check In';
        var typeDisplay = isVisitor ? 'Visitor' : 'Member';
        var memberId = m.record_id || m.member_id || m.id || 'unknown';
        
        html += `
            <tr>
                <td><strong>${nameDisplay}</strong>${badge}</td>
                <td>${typeDisplay}</td>
                <td>${genderDisplay}</td>
                <td>${ageDisplay}</td>
                <td class="event-custom-field-cell" style="display:none;">${m.custom_field || "-"}</td>
                <td>${phoneDisplay}</td>
                <td><span style="color:${statusColor};">${statusText}</span></td>
                <td style="text-align:center;">
                    <button class="check-in-btn ${btnClass}" onclick="toggleCheckIn('${memberId}')">${btnText}</button>
                </td>
            </tr>
        `;
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// ===== PAYMENTS TAB =====
function renderPayments() {
    if (eventContributions.length === 0) {
        return `
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;">Payments</h3>
                    <button class="btn btn-primary btn-sm" onclick="recordPayment()">+ Record</button>
                </div>
                <div class="card-body">
                    <p class="text-muted">No payments recorded.</p>
                </div>
            </div>
        `;
    }
    
    let html = `
        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <h3 style="margin:0;">Payments (${eventContributions.length})</h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <input type="text" id="paymentSearch" class="form-control" placeholder="Search payments..." style="width:200px;padding:4px 10px;font-size:13px;">
                    <button class="btn btn-primary btn-sm" onclick="recordPayment()">+ Record</button>
                </div>
            </div>
            <div class="card-body" style="padding:0;">
                <div style="overflow-x:auto;">
                    <table class="table" style="margin:0;" id="paymentTable">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Type</th>
                                <th id="paymentAgeHeader">Age Category</th>
                                <th id="paymentCustomFieldHeader" style="display:none;">Church/Custom Field</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    for (var i = 0; i < eventContributions.length; i++) {
        var c = eventContributions[i];
        var dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString() : '-';
        html += `
            <tr>
                <td><strong>${c.member_name || 'Anonymous'}</strong></td>
                <td>${c.member_phone || c.phone || '-'}</td>
                <td>${c.contribution_type || 'Money'}</td>
                <td>${c.member_age_category || '-'}</td>
                <td class="payment-custom-field-cell">${c.member_custom_field || '-'}</td>
                <td>KES ${c.amount || 0}</td>
                <td>${c.payment_method || 'Cash'}</td>
                <td>${dateStr}</td>
            </tr>
        `;
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// ===== REPORT TAB =====
function renderReport() {
    // Load settings for custom field visibility
    var showCustomField = false;
    var showAge = false;
    try {
        const settingsData = JSON.parse(localStorage.getItem('orgSettings') || '{}');
        showCustomField = settingsData.custom_field_enabled || false;
        showAge = settingsData.age_enabled || false;
    } catch(e) {}
    
    // Also fetch from API to be sure
    fetch('/api/v1/settings/', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    })
    .then(r => r.json())
    .then(settings => {
        showCustomField = settings.custom_field_enabled || false;
        showAge = settings.age_enabled || false;
        localStorage.setItem('orgSettings', JSON.stringify(settings));
    })
    .catch(() => {});
    var totalCollected = eventContributions.reduce(function(sum, c) { return sum + (c.amount || 0); }, 0);
    var checkedIn = eventMembers.filter(function(m) { return m.attended; }).length;
    
    var attendeesList = '';
    for (var i = 0; i < eventMembers.length; i++) {
        var m = eventMembers[i];
        var visitorTag = m.is_visitor ? ' (Visitor)' : '';
        attendeesList += `<li>${m.member_name || 'Unknown'} - ${m.attended ? 'Checked In' : 'Not Checked In'}${visitorTag}`;
        if (showAge) {
            attendeesList += ` - Age: ${m.member_age_category || '-'}`;
        }
        if (showCustomField) {
            attendeesList += ` - Church: ${m.custom_field || '-'}`;
        }
        attendeesList += `</li>`;
    }
    
    var contributionsList = '';
    for (var i = 0; i < eventContributions.length; i++) {
        var c = eventContributions[i];
        contributionsList += `<li>${c.member_name || 'Anonymous'}`;
        if (showAge) {
            contributionsList += ` - Age: ${c.member_age_category || '-'}`;
        }
        if (showCustomField) {
            contributionsList += ` - Church: ${c.member_custom_field || '-'}`;
        }
        contributionsList += ` - KES ${c.amount || 0}</li>`;
    }
    
    return `
        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;">Event Report</h3>
                <button class="btn btn-success btn-sm" onclick="exportPDF()">Export PDF</button>
            </div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;">
                    <div><strong>Total Attendees:</strong> ${eventMembers.length}</div>
                    <div><strong>Checked In:</strong> ${checkedIn}</div>
                    <div><strong>Total Collected:</strong> KES ${totalCollected}</div>
                </div>
                <div style="border-top:1px solid var(--gray-200);padding-top:16px;">
                    <h4>Attendees</h4>
                    <ul>${attendeesList}</ul>
                </div>
                <div style="border-top:1px solid var(--gray-200);padding-top:16px;margin-top:16px;">
                    <h4>Payments</h4>
                    <ul>${contributionsList}</ul>
                </div>
            </div>
        </div>
    `;
}

// ===== TAB SWITCHING =====
window.switchTab = function(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function(t) {
        t.classList.remove('active');
    });
    document.querySelector('.tab-btn[data-tab="' + tab + '"]').classList.add('active');
    
    var content = document.getElementById('tabContent');
    if (tab === 'overview') content.innerHTML = renderOverview();
    else if (tab === 'attendees') {
        content.innerHTML = renderAttendees();
        // Show/hide custom field based on settings
        setTimeout(function() {
            fetch('/api/v1/settings/', {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            })
            .then(r => r.json())
            .then(settings => {
                const showCustomField = settings.custom_field_enabled;
                const customHeader = document.getElementById('eventCustomFieldHeader');
                const customCells = document.querySelectorAll('.event-custom-field-cell');
                if (customHeader) {
                    customHeader.textContent = settings.custom_field_label || 'Custom Field';
                    customHeader.style.display = showCustomField ? '' : 'none';
                }
                customCells.forEach(cell => {
                    cell.style.display = showCustomField ? '' : 'none';
                });
            })
            .catch(() => {});
        }, 100);
        // Add search listener for attendees
        var searchInput = document.getElementById('attendeeSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterAttendeeTable(this.value);
            });
        }
    } else if (tab === 'payments') {
        content.innerHTML = renderPayments();
        // Show/hide custom field in payments based on settings
        setTimeout(function() {
            fetch('/api/v1/settings/', {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            })
            .then(r => r.json())
            .then(settings => {
                const showCustomField = settings.custom_field_enabled;
                const customHeader = document.getElementById('paymentCustomFieldHeader');
                const customCells = document.querySelectorAll('.payment-custom-field-cell');
                if (customHeader) {
                    customHeader.textContent = settings.custom_field_label || 'Custom Field';
                    customHeader.style.display = showCustomField ? '' : 'none';
                }
                customCells.forEach(cell => {
                    cell.style.display = showCustomField ? '' : 'none';
                });
                // Age category always shows if age_enabled
                const ageHeader = document.getElementById('paymentAgeHeader');
                if (ageHeader) {
                    ageHeader.style.display = settings.age_enabled ? '' : 'none';
                }
            })
            .catch(() => {});
        }, 100);
        // Add search listener for payments
        var searchInput = document.getElementById('paymentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterPaymentTable(this.value);
            });
        }
    } else if (tab === 'report') content.innerHTML = renderReport();
};

// ===== ADD ATTENDEE =====
window.addAttendee = function() {
    var available = allMembers.filter(function(m) {
        return !eventMembers.some(function(em) { return em.member_id === m.id; });
    });
    
    var memberOptions = available.map(function(m) {
        var name = m.full_name || (m.first_name || '') + ' ' + (m.last_name || '');
        return { value: m.id, label: name.trim() || 'Unknown Member' };
    });
    
    memberOptions.unshift({ value: '', label: '' });
    
    showFormModal({
        title: 'Add Attendee',
        fields: [
            {
                id: 'attendee_type',
                label: 'Attendee Type',
                type: 'select',
                value: 'member',
                required: true,
                options: [
                    { value: 'member', label: 'Existing Member' },
                    { value: 'visitor', label: 'Visitor/Guest' }
                ]
            },
            {
                id: 'member_id',
                label: 'Member',
                type: 'select',
                options: memberOptions,
                required: false
            },
            {
                id: 'visitor_name',
                label: 'Visitor Name',
                type: 'text',
                value: '',
                required: false,
                placeholder: 'Enter visitor name...'
            },
            {
                id: 'visitor_gender',
                label: 'Gender',
                type: 'select',
                value: '',
                required: false,
                options: [
                    { value: '', label: 'Select gender...' },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' }
                    
                ]
            },
            {
                id: 'visitor_age',
                label: 'Age Category',
                type: 'select',
                value: '',
                required: false,
                options: [
                    { value: '', label: 'Select age category...' },
                    { value: 'child', label: 'Child (0-12)' },
                    { value: 'teen', label: 'Teen (13-17)' },
                    { value: 'adult', label: 'Adult (18-59)' },
                    { value: 'elder', label: 'Elder (60+)' }
                ]
            },
            {
                id: 'visitor_phone',
                label: 'Phone (optional)',
                type: 'text',
                value: '',
                required: false,
                placeholder: '0712345678'
            }
        ],
        onShow: function() {
            setTimeout(function() {
                var typeSelect = document.getElementById('attendee_type');
                var memberSelect = document.getElementById('member_id');
                var visitorName = document.getElementById('visitor_name');
                var visitorGender = document.getElementById('visitor_gender');
                var visitorAge = document.getElementById('visitor_age');
                var visitorPhone = document.getElementById('visitor_phone');
                
                function toggleFields() {
                    if (typeSelect && typeSelect.value === 'visitor') {
                        if (memberSelect) {
                            var container = memberSelect.parentElement;
                            if (container) container.style.display = 'none';
                        }
                        if (visitorName) visitorName.parentElement.style.display = 'block';
                        if (visitorGender) visitorGender.parentElement.style.display = 'block';
                        if (visitorAge) visitorAge.parentElement.style.display = 'block';
                        if (visitorPhone) visitorPhone.parentElement.style.display = 'block';
                    } else {
                        if (memberSelect) {
                            var container = memberSelect.parentElement;
                            if (container) {
                                container.style.display = 'block';
                                container.style.overflow = 'visible';
                            }
                            var select = document.getElementById('member_id');
                            if (select) {
                                var container2 = select.parentElement;
                                var options = available.map(function(m) {
                                    var name = m.full_name || (m.first_name || '') + ' ' + (m.last_name || '');
                                    return { value: m.id, label: name.trim() || 'Unknown Member' };
                                });
                                options.unshift({ value: '', label: '' });
                                var searchable = createSearchableSelect(options, '', 'Search for a member...');
                                if (container2) {
                                    container2.style.overflow = 'visible';
                                    container2.style.position = 'relative';
                                    container2.style.zIndex = '99999';
                                    container2.replaceChild(searchable, select);
                                }
                            }
                        }
                        if (visitorName) visitorName.parentElement.style.display = 'none';
                        if (visitorGender) visitorGender.parentElement.style.display = 'none';
                        if (visitorAge) visitorAge.parentElement.style.display = 'none';
                        if (visitorPhone) visitorPhone.parentElement.style.display = 'none';
                    }
                }
                
                if (typeSelect) {
                    typeSelect.addEventListener('change', toggleFields);
                }
                toggleFields();
            }, 100);
        },
        onSubmit: async function(data, done) {
            try {
                var token = localStorage.getItem('token');
                var memberId = data.member_id;
                var memberContainer = document.querySelector('.searchable-select-container');
                if (memberContainer) {
                    var hiddenSelect = memberContainer.querySelector('.searchable-select-hidden');
                    if (hiddenSelect) {
                        memberId = hiddenSelect.value;
                    }
                }
                
                if (data.attendee_type === 'visitor') {
                    if (!data.visitor_name || data.visitor_name.trim() === '') {
                        showError('Please enter visitor name');
                        return;
                    }
                    var body = {
                        is_visitor: true,
                        visitor_name: data.visitor_name.trim(),
                        visitor_gender: data.visitor_gender || null,
                        visitor_age: data.visitor_age || null,
                        visitor_phone: data.visitor_phone || null,
                        attended: true
                    };
                    var response = await fetch('/api/v1/events/' + currentEvent.id + '/attendance', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify(body)
                    });
                    if (!response.ok) throw new Error('Failed to add visitor');
                    showSuccess('Visitor added');
                    done();
                    setTimeout(function() {
                        renderEventDetail(currentEvent.id, currentTab);
                    }, 300);
                } else {
                    if (!memberId) {
                        showError('Please select a member');
                        return;
                    }
                    var response = await fetch('/api/v1/events/' + currentEvent.id + '/attendance/' + memberId, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        }
                    });
                    if (!response.ok) throw new Error('Failed to add attendee');
                    showSuccess('Member added');
                    done();
                    setTimeout(function() {
                        renderEventDetail(currentEvent.id, currentTab);
                    }, 300);
                }
            } catch (error) {
                showError(error.message || 'Failed to add attendee');
            }
        }
    });
};

// ===== RECORD PAYMENT =====
window.recordPayment = function() {
    var memberOptions = eventMembers.map(function(m) {
        var label = m.member_name || 'Unknown';
        var value = m.member_id || m.id || m.record_id || 'unknown';
        return { value: value, label: label };
    });
    
    if (memberOptions.length === 0) {
        showError('No attendees to record payment for');
        return;
    }
    
    showFormModal({
        title: 'Record Payment',
        fields: [
            {
                id: 'member_id',
                label: 'Member/Visitor',
                type: 'select',
                options: memberOptions,
                required: true,
                placeholder: 'Search for a member...'
            },
            {
                id: 'age_category',
                label: 'Age Category',
                type: 'text',
                value: '',
                required: false,
                disabled: true,
                helper: 'Auto-filled from member profile'
            },
            {
                id: 'custom_field',
                label: 'Church/Custom Field',
                type: 'text',
                value: '',
                required: false,
                disabled: true,
                helper: 'Auto-filled from member profile'
            },
            {
                id: 'amount',
                label: 'Amount (KES)',
                type: 'number',
                required: true,
                placeholder: '0.00'
            },
            {
                id: 'payment_method',
                label: 'Payment Method',
                type: 'select',
                value: 'cash',
                required: true,
                options: [
                    { value: 'cash', label: 'Cash' },
                    { value: 'mpesa', label: 'M-PESA' },
                    { value: 'bank', label: 'Bank Transfer' }
                ]
            }
        ],
        onShow: function() {
            setTimeout(function() {
                var select = document.getElementById('member_id');
                if (select) {
                    var container = select.parentElement;
                    var options = memberOptions;
                    var searchable = createSearchableSelect(options, '', 'Search for a member...');
                    if (container) {
                        container.style.overflow = 'visible';
                        container.replaceChild(searchable, select);
                    }
                }
                // Auto-fill age and custom field when member is selected
                // Use mutation observer or event delegation for searchable select
                var memberContainer = document.querySelector('.searchable-select-container');
                if (memberContainer) {
                    // Listen for changes on the hidden input
                    var hiddenInput = memberContainer.querySelector('.searchable-select-hidden');
                    if (hiddenInput) {
                        hiddenInput.addEventListener('change', function() {
                            var selectedId = this.value;
                            var selectedMember = eventMembers.find(function(m) {
                                return (m.member_id === selectedId || m.id === selectedId || m.record_id === selectedId);
                            });
                            var ageField = document.getElementById('age_category');
                            var customField = document.getElementById('custom_field');
                            if (selectedMember) {
                                if (ageField) ageField.value = selectedMember.member_age_category || '';
                                if (customField) customField.value = selectedMember.custom_field || '';
                            } else {
                                if (ageField) ageField.value = '';
                                if (customField) customField.value = '';
                            }
                        });
                    }
                }
                if (select) {
                    var container = select.parentElement;
                    var options = memberOptions;
                    var searchable = createSearchableSelect(options, '', 'Search for a member...');
                    if (container) {
                        container.style.overflow = 'visible';
                        container.replaceChild(searchable, select);
                    }
                }
            }, 100);
        },
        onSubmit: async function(data, done) {
            try {
                var memberId = data.member_id;
                var visitorName = null;
                var selectedLabel = null;
                var memberContainer = document.querySelector('.searchable-select-container');
                
                if (memberContainer) {
                    var hiddenSelect = memberContainer.querySelector('.searchable-select-hidden');
                    if (hiddenSelect) {
                        memberId = hiddenSelect.value;
                    }
                    // Get the selected label from the input (this has the visitor name)
                    var searchInput = memberContainer.querySelector('.searchable-select-input');
                    if (searchInput && searchInput.value) {
                        selectedLabel = searchInput.value.trim();
                        visitorName = selectedLabel;
                    }
                    // If no input value, try display
                    if (!visitorName) {
                        var display = memberContainer.querySelector('.searchable-select-display');
                        if (display) {
                            selectedLabel = display.textContent.trim();
                            visitorName = selectedLabel;
                        }
                    }
                    // If still no name, try the selected option
                    if (!visitorName) {
                        var selectedOption = memberContainer.querySelector('.searchable-select-option.selected');
                        if (selectedOption) {
                            selectedLabel = selectedOption.textContent.trim();
                            visitorName = selectedLabel;
                        }
                    }
                }
                
                // Log what we found
                console.log('🔍 Payment - memberId:', memberId, 'visitorName:', visitorName, 'selectedLabel:', selectedLabel);
                
                // Determine if this is a visitor
                var isVisitor = false;
                
                // First, try to find the member in eventMembers by ID
                var foundMember = null;
                for (var i = 0; i < eventMembers.length; i++) {
                    var m = eventMembers[i];
                    if (m.member_id === memberId || m.id === memberId || m.record_id === memberId) {
                        foundMember = m;
                        break;
                    }
                }
                
                // If found and it's a visitor
                if (foundMember && foundMember.is_visitor) {
                    isVisitor = true;
                    visitorName = visitorName || foundMember.member_name || 'Visitor';
                }
                // If memberId is 'unknown' or null, it's a visitor
                else if (memberId === 'unknown' || memberId === null || memberId === undefined) {
                    isVisitor = true;
                }
                // If we have a visitor name AND the member is not found in the list, treat as visitor
                else if (!foundMember && visitorName && visitorName !== '' && visitorName !== 'Unknown') {
                    // Check if this name belongs to a visitor in the list
                    for (var i = 0; i < eventMembers.length; i++) {
                        var m = eventMembers[i];
                        if (m.member_name === visitorName && m.is_visitor) {
                            isVisitor = true;
                            break;
                        }
                    }
                    // If still not found, treat as visitor with the name
                    if (!isVisitor) {
                        isVisitor = true;
                    }
                }
                // If we have a valid memberId and it's not a visitor, it's a regular member
                else if (memberId && memberId !== 'unknown' && !foundMember) {
                    // Check if the memberId exists in eventMembers as a regular member
                    for (var i = 0; i < eventMembers.length; i++) {
                        var m = eventMembers[i];
                        if (m.member_id === memberId) {
                            isVisitor = false;
                            break;
                        }
                    }
                }
                
                var requestBody = {
                    contribution_type: 'money',
                    amount: parseFloat(data.amount),
                    payment_method: data.payment_method || 'cash'
                };
                
                if (isVisitor && visitorName && visitorName !== '' && visitorName !== 'Unknown') {
                    // Visitor: send member_name, member_id = null
                    requestBody.member_id = null;
                    requestBody.member_name = visitorName;
                    
                    // Find phone number from eventMembers
                    var foundPhone = '';
                    for (var i = 0; i < eventMembers.length; i++) {
                        var m = eventMembers[i];
                        if (m.member_name === visitorName || m.member_name === visitorName.replace(' (Visitor)', '')) {
                            foundPhone = m.phone || m.member_phone || '';
                            break;
                        }
                    }
                    if (foundPhone) {
                        requestBody.member_phone = foundPhone;
                    }
                    console.log('✅ Sending visitor payment - Name:', visitorName);
                    console.log('📦 Full requestBody:', JSON.stringify(requestBody));
                } else if (memberId && memberId !== 'unknown' && memberId !== '') {
                    // Regular member: send member_id
                    requestBody.member_id = memberId;
                    console.log('✅ Sending member payment - ID:', memberId);
                } else {
                    showError('Please select a valid member or enter a visitor name');
                    return;
                }
                
                var response = await fetch('/api/v1/events/' + currentEvent.id + '/contributions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify(requestBody)
                });
                
                if (!response.ok) {
                    var errData = await response.json();
                    throw new Error(errData.detail || 'Failed to record payment');
                }
                
                showSuccess('Payment recorded!');
                done();
                setTimeout(function() {
                    // Force reload with fresh data
                    renderEventDetail(currentEvent.id, currentTab);
                }, 500);
            } catch (error) {
                showError(error.message || 'Failed to record payment');
            }
        }
    });
};

// ===== TOGGLE CHECK-IN =====
window.toggleCheckIn = async function(memberId) {
    try {
        var attendee = null;
        for (var i = 0; i < eventMembers.length; i++) {
            var m = eventMembers[i];
            if (m.record_id === memberId || m.member_id === memberId || m.id === memberId) {
                attendee = m;
                break;
            }
        }
        if (!attendee) {
            showError('Attendee not found');
            return;
        }
        
        var token = localStorage.getItem('token');
        var response = await fetch('/api/v1/events/' + currentEvent.id + '/attendance/' + memberId + '/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
        if (!response.ok) throw new Error('Failed to update check-in');
        var data = await response.json();
        attendee.attended = data.attended;
        showSuccess(data.attended ? 'Checked in' : 'Check-in removed');
        setTimeout(function() {
            renderEventDetail(currentEvent.id, currentTab);
        }, 300);
    } catch (error) {
        showError(error.message || 'Failed to update check-in');
    }
};

// ===== EDIT & DELETE =====
window.editEvent = function() {
    import('./events.js').then(function(module) {
        module.openEventModal(currentEvent);
    }).catch(function() {
        showError('Failed to load edit function');
    });
};

window.deleteEvent = function() {
    showConfirm({
        title: 'Delete Event',
        message: 'Delete "' + currentEvent.title + '"?',
        confirmLabel: 'Delete',
        confirmClass: 'btn-danger',
        onConfirm: async function(done) {
            try {
                await deleteEvent(currentEvent.id);
                showSuccess('Event deleted');
                done();
                navigateTo('events');
            } catch (error) {
                showError(error.message || 'Failed to delete event');
            }
        }
    });
};

// ===== EXPORT PDF =====
window.exportPDF = function() {
    fetch('/api/v1/reports/export/events/pdf?event_id=' + currentEvent.id, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    })
    .then(function(response) {
        if (!response.ok) throw new Error('PDF generation failed');
        return response.blob();
    })
    .then(function(blob) {
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'event_' + currentEvent.title + '_report.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showSuccess('PDF downloaded');
    })
    .catch(function(error) {
        showError('Failed to download PDF: ' + error.message);
    });
};



// ===== FILTER FUNCTIONS =====
window.filterAttendeeTable = function(searchTerm) {
    var rows = document.querySelectorAll('#attendeeTable tbody tr');
    var term = searchTerm.toLowerCase().trim();
    rows.forEach(function(row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
};

window.filterPaymentTable = function(searchTerm) {
    var rows = document.querySelectorAll('#paymentTable tbody tr');
    var term = searchTerm.toLowerCase().trim();
    rows.forEach(function(row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
};


window.renderEventDetail = renderEventDetail;

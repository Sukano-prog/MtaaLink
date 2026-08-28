/* ============================================================
   MtaaLink - Event Detail Page (Tabs)
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


export async function renderEventDetail(id, tab = null) {
    eventId = id;
    const content = document.getElementById('pageContent');
    // Clear cached data to force reload
    currentEvent = null;
    eventMembers = [];
    eventContributions = [];
    
    // Set the tab to switch to after load
    if (tab) {
        currentTab = tab;
    }
    
    try {
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
                </div>
            </div>
            
            <div style="display:flex;gap:4px;border-bottom:2px solid var(--gray-200);margin-bottom:20px;overflow-x:auto;">
                <button class="tab-btn" data-tab="overview" onclick="switchTab('overview')">Overview</button>
                <button class="tab-btn" data-tab="attendees" onclick="switchTab('attendees')">Attendees (${eventMembers.length})</button>
                <button class="tab-btn" data-tab="payments" onclick="switchTab('payments')">Payments (${eventContributions.length})</button>
                <button class="tab-btn" data-tab="report" onclick="switchTab('report')">Report</button>
            </div>
            
            <div id="tabContent">
                ${renderOverview()}
            </div>
        `;
        
        // Switch to the stored tab after rendering
        setTimeout(function() {
            switchTab(currentTab);
        }, 50);
        
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
            `;
            document.head.appendChild(style);
        }
        
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

// ===== TAB 1: OVERVIEW =====

function renderOverview() {
    const e = currentEvent;
    const checkedIn = eventMembers.filter(m => m.attended).length;
    const totalCollected = eventContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    
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

// ===== TAB 2: ATTENDEES =====

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
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;">Attendees (${eventMembers.length})</h3>
                <button class="btn btn-primary btn-sm" onclick="addAttendee()">+ Add</button>
            </div>
            <div class="card-body" style="padding:0;">
                <div style="overflow-x:auto;">
                    <table class="table" style="margin:0;">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Gender</th>
                                <th>Age</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th style="text-align:center;">Check In</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    eventMembers.forEach(function(m) {
        const isVisitor = m.is_visitor || false;
        const nameDisplay = m.member_name || 'Unknown';
        const badge = isVisitor ? ' <span class="visitor-badge">Visitor</span>' : '';
        const genderDisplay = m.member_gender || '-';
        const ageDisplay = m.member_age_category || '-';
        const phoneDisplay = m.phone || m.member_phone || '-';
        const statusText = m.attended ? 'Checked In' : 'Not Checked In';
        const statusColor = m.attended ? 'var(--success)' : 'var(--gray-400)';
        const btnClass = m.attended ? 'checked' : 'unchecked';
        const btnText = m.attended ? 'Checked In' : 'Check In';
        const typeDisplay = isVisitor ? 'Visitor' : 'Member';
        const memberId = m.member_id || m.id || 'unknown';
        
        html += `
            <tr>
                <td><strong>${nameDisplay}</strong>${badge}</td>
                <td>${typeDisplay}</td>
                <td>${genderDisplay}</td>
                <td>${ageDisplay}</td>
                <td>${phoneDisplay}</td>
                <td><span style="color:${statusColor};">${statusText}</span></td>
                <td style="text-align:center;">
                    <button class="check-in-btn ${btnClass}" onclick="toggleCheckIn('${m.record_id || m.id || m.member_id || 'unknown'}')">${btnText}</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// ===== TAB 3: PAYMENTS =====

function renderPayments() {
    if (eventContributions.length === 0) {
        return `
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;">Payments</h3>
                    <button class="btn btn-primary btn-sm" onclick="addPayment()">+ Record</button>
                </div>
                <div class="card-body">
                    <p class="text-muted">No payments recorded.</p>
                </div>
            </div>
        `;
    }
    
    let html = `
        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;">Payments (${eventContributions.length})</h3>
                <button class="btn btn-primary btn-sm" onclick="addPayment()">+ Record</button>
            </div>
            <div class="card-body" style="padding:0;">
                <div style="overflow-x:auto;">
                    <table class="table" style="margin:0;">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    eventContributions.forEach(function(c) {
        const dateStr = c.payment_date ? new Date(c.payment_date).toLocaleDateString() : (c.created_at ? new Date(c.created_at).toLocaleDateString() : "-");
        html += `
            <tr>
                <td><strong>${c.member_name || 'Anonymous'}</strong></td>
                <td>${c.contribution_type || 'Money'}</td>
                <td>KES ${c.amount || 0}</td>
                <td>${c.payment_method || 'Cash'}</td>
                <td>${dateStr}</td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// ===== TAB 4: REPORT =====

function renderReport() {
    const totalCollected = eventContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const checkedIn = eventMembers.filter(m => m.attended).length;
    
    let attendeesList = '';
    eventMembers.forEach(function(m) {
        const visitorTag = m.is_visitor ? ' (Visitor)' : '';
        attendeesList += `<li>${m.member_name || 'Unknown'} - ${m.attended ? 'Checked In' : 'Not Checked In'}${visitorTag}</li>`;
    });
    
    let contributionsList = '';
    eventContributions.forEach(function(c) {
        contributionsList += `<li>${c.member_name || 'Anonymous'} - KES ${c.amount || 0}</li>`;
    });
    
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
    
    const content = document.getElementById('tabContent');
    if (tab === 'overview') content.innerHTML = renderOverview();
    else if (tab === 'attendees') content.innerHTML = renderAttendees();
    else if (tab === 'payments') content.innerHTML = renderPayments();
    else if (tab === 'report') content.innerHTML = renderReport();
};

// ===== ADD ATTENDEE =====

window.addAttendee = function() {
    const available = allMembers.filter(function(m) {
        return !eventMembers.some(function(em) { return em.member_id === m.id; });
    });
    
    const memberOptions = available.map(function(m) {
        const name = m.full_name || (m.first_name || '') + ' ' + (m.last_name || '');
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
                required: false,
                placeholder: 'Search for a member...'
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
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' }
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
            // Add CSS to fix dropdown overflow
            var style = document.createElement('style');
            style.textContent = '.modal-body { overflow: visible !important; } .searchable-select-dropdown { z-index: 99999 !important; }';
            document.head.appendChild(style);
            
            setTimeout(function() {
                const typeSelect = document.getElementById('attendee_type');
                const memberSelect = document.getElementById('member_id');
                const visitorName = document.getElementById('visitor_name');
                const visitorGender = document.getElementById('visitor_gender');
                const visitorAge = document.getElementById('visitor_age');
                const visitorPhone = document.getElementById('visitor_phone');
                
                function toggleFields() {
                    if (typeSelect && typeSelect.value === 'visitor') {
                        if (memberSelect) {
                            const container = memberSelect.parentElement;
                            if (container) container.style.display = 'none';
                        }
                        if (visitorName) visitorName.parentElement.style.display = 'block';
                        if (visitorGender) visitorGender.parentElement.style.display = 'block';
                        if (visitorAge) visitorAge.parentElement.style.display = 'block';
                        if (visitorPhone) visitorPhone.parentElement.style.display = 'block';
                    } else {
                        if (memberSelect) {
                            const container = memberSelect.parentElement;
                            if (container) {
                                container.style.display = 'block';
                                container.style.overflow = 'visible';
                            }
                            const select = document.getElementById('member_id');
                            if (select) {
                                const container2 = select.parentElement;
                                const options = available.map(function(m) {
                                    const name = m.full_name || (m.first_name || '') + ' ' + (m.last_name || '');
                                    return { value: m.id, label: name.trim() || 'Unknown Member' };
                                });
                                options.unshift({ value: '', label: '' });
                                const searchable = createSearchableSelect(options, '', 'Search for a member...');
                                if (container2) {
                                    container2.style.overflow = 'visible';
                                    // Set position relative for dropdown
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
            }, 150);
        },
        onSubmit: async function(data, done) {
            try {
                const token = localStorage.getItem('token');
                
                // Get the actual member_id from the searchable select
                let memberId = data.member_id;
                const memberContainer = document.querySelector('.searchable-select-container');
                if (memberContainer) {
                    const hiddenSelect = memberContainer.querySelector('.searchable-select-hidden');
                    if (hiddenSelect) {
                        memberId = hiddenSelect.value;
                    }
                }
                
                if (data.attendee_type === 'visitor') {
                    if (!data.visitor_name || data.visitor_name.trim() === '') {
                        showError('Please enter visitor name');
                        return;
                    }
                    const body = {
                        is_visitor: true,
                        visitor_name: data.visitor_name.trim(),
                        visitor_gender: data.visitor_gender || null,
                        visitor_age: data.visitor_age || null,
                        visitor_phone: data.visitor_phone || null,
                        attended: true
                    };
                    
                    const response = await fetch('/api/v1/events/' + currentEvent.id + '/attendance', {
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
                    // Force reload from API
                    setTimeout(function() {
                        renderEventDetail(currentEvent.id, currentTab);
                    }, 500);
                } else {
                    if (!memberId) {
                        showError('Please select a member');
                        return;
                    }
                    const response = await fetch('/api/v1/events/' + currentEvent.id + '/attendance/' + memberId, {
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
                    }, 500);
                }
            } catch (error) {
                showError(error.message || 'Failed to add attendee');
            }
        }
    });
};

// ===== TOGGLE CHECK-IN =====

window.toggleCheckIn = async function(id) {
    try {
        
        // Find the attendee by record_id, member_id, or id
        let attendee = null;
        for (var i = 0; i < eventMembers.length; i++) {
            var m = eventMembers[i];
            if (m.record_id === id || m.member_id === id || m.id === id || 
                String(m.record_id) === String(id) || String(m.member_id) === String(id) || String(m.id) === String(id)) {
                attendee = m;
                break;
            }
        }
        
        if (!attendee) {
            showError('Attendee not found');
            return;
        }
        
        const token = localStorage.getItem('token');
        
        // Use the record_id or id for the toggle endpoint
        const toggleId = attendee.record_id || attendee.id || attendee.member_id || id;
        
        const response = await fetch('/api/v1/events/' + currentEvent.id + '/attendance/' + toggleId + '/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to update check-in');
        }
        const data = await response.json();
        
        attendee.attended = data.attended;
        showSuccess(data.attended ? 'Checked in' : 'Check-in removed');
        renderEventDetail(currentEvent.id, currentTab);
    } catch (error) {
        console.error('❌ Toggle error:', error);
        showError(error.message || 'Failed to update check-in');
    }
};

// ===== ADD PAYMENT =====

window.addPayment = function() {
    const memberOptions = eventMembers.map(function(m) {
        return { value: m.member_id || m.id, label: m.member_name || 'Unknown' };
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
            },
            {
                id: 'payment_date',
                label: 'Payment Date',
                type: 'date',
                value: new Date().toISOString().split('T')[0],
                required: true
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
            }, 100);
        },
        onSubmit: async function(data, done) {
            try {
                const response = await fetch('/api/v1/events/' + currentEvent.id + '/contributions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify({
                        member_id: data.member_id,
                        contribution_type: 'money',
                        amount: parseFloat(data.amount),
                        payment_method: data.payment_method || 'cash',
                        payment_date: data.payment_date || new Date().toISOString().split('T')[0]
                    })
                });
                
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.detail || 'Failed to record payment');
                }
                
                showSuccess('Payment recorded');
                done();
                renderEventDetail(currentEvent.id, currentTab);
            } catch (error) {
                showError(error.message || 'Failed to record payment');
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
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
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

// ===== EDIT & DELETE =====

window.editEvent = function() {
    import('./events.js').then(function(module) {
        if (typeof module.openEventModal === 'function') {
            module.openEventModal(currentEvent);
        } else {
            showError('Edit function not available');
        }
    }).catch(function(error) {
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

window.renderEventDetail = renderEventDetail;

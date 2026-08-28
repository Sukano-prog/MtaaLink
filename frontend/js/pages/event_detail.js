/* ============================================================
   MtaaLink - Event Detail Page
   ============================================================ */

import { getEvent, updateEvent, deleteEvent } from '../core/api.js';
import { getMembers } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showConfirm, showModal, showFormModal } from '../components/modal.js';

let currentEvent = null;
let eventMembers = [];
let eventContributions = [];
let allMembers = [];
let eventId = null;

export async function renderEventDetail(id) {
    eventId = id;
    const content = document.getElementById('pageContent');
    
    try {
        const eventData = await getEvent(eventId);
        currentEvent = eventData;
        eventMembers = eventData.attendance || [];
        eventContributions = eventData.contributions || [];
        allMembers = await getMembers().catch(() => []);
        
        content.innerHTML = `
            <div class="page-header">
                <button class="btn btn-outline" onclick="navigateTo('events')">← Back</button>
                <h2>${currentEvent.title}</h2>
                <div>
                    <button class="btn btn-primary" onclick="window.editEvent()">Edit</button>
                    <button class="btn btn-danger" onclick="window.deleteEvent()">Delete</button>
                </div>
            </div>
            
            <div style="display:flex;gap:4px;border-bottom:2px solid var(--gray-200);margin-bottom:20px;">
                <button class="tab-btn active" data-tab="overview" onclick="window.switchTab('overview')">Overview</button>
                <button class="tab-btn" data-tab="attendees" onclick="window.switchTab('attendees')">Attendees (${eventMembers.length})</button>
                <button class="tab-btn" data-tab="contributions" onclick="window.switchTab('contributions')">Contributions (${eventContributions.length})</button>
                <button class="tab-btn" data-tab="report" onclick="window.switchTab('report')">Report</button>
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

function renderAttendees() {
    if (eventMembers.length === 0) {
        return `
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;">Attendees</h3>
                    <button class="btn btn-primary btn-sm" onclick="window.addAttendee()">+ Add Member</button>
                </div>
                <div class="card-body">
                    <p class="text-muted">No attendees yet.</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;">Attendees</h3>
                <button class="btn btn-primary btn-sm" onclick="window.addAttendee()">+ Add Member</button>
            </div>
            <div class="card-body" style="padding:0;">
                <div style="overflow-x:auto;">
                    <table class="table" style="margin:0;">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Status</th>
                                <th style="text-align:center;">Check In</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${eventMembers.map(function(m) {
                                var checkedIn = m.attended ? 'Checked In' : 'Not Checked In';
                                var btnClass = m.attended ? 'checked' : 'unchecked';
                                var btnText = m.attended ? 'Checked In' : 'Check In';
                                return '<tr>' +
                                    '<td><strong>' + (m.member_name || 'Unknown') + '</strong></td>' +
                                    '<td>' + (m.attended ? '<span style="color:green;">Checked In</span>' : '<span style="color:gray;">Not Checked In</span>') + '</td>' +
                                    '<td style="text-align:center;"><button class="check-in-btn ' + btnClass + '" onclick="window.toggleCheckIn(\'' + m.member_id + '\')">' + btnText + '</button></td>' +
                                '</tr>';
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderContributions() {
    if (eventContributions.length === 0) {
        return `
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;">Contributions</h3>
                    <button class="btn btn-primary btn-sm" onclick="window.addContribution()">+ Record Payment</button>
                </div>
                <div class="card-body">
                    <p class="text-muted">No contributions yet.</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;">Contributions</h3>
                <button class="btn btn-primary btn-sm" onclick="window.addContribution()">+ Record Payment</button>
            </div>
            <div class="card-body" style="padding:0;">
                <div style="overflow-x:auto;">
                    <table class="table" style="margin:0;">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Type</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${eventContributions.map(function(c) {
                                return '<tr>' +
                                    '<td><strong>' + (c.member_name || 'Anonymous') + '</strong></td>' +
                                    '<td>' + (c.contribution_type || 'Money') + '</td>' +
                                    '<td>KES ' + (c.amount || 0) + '</td>' +
                                '</tr>';
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderReport() {
    var totalCollected = eventContributions.reduce(function(sum, c) { return sum + (c.amount || 0); }, 0);
    var checkedIn = eventMembers.filter(function(m) { return m.attended; }).length;
    
    return `
        <div class="card">
            <div class="card-header">
                <h3>Event Report</h3>
                <button class="btn btn-success" onclick="window.exportPDF()">Export PDF</button>
            </div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;">
                    <div><strong>Total Attendees:</strong> ${eventMembers.length}</div>
                    <div><strong>Checked In:</strong> ${checkedIn}</div>
                    <div><strong>Total Collected:</strong> KES ${totalCollected}</div>
                </div>
                <div style="border-top:1px solid var(--gray-200);padding-top:16px;">
                    <h4>Attendees</h4>
                    <ul>
                        ${eventMembers.map(function(m) {
                            return '<li>' + (m.member_name || 'Unknown') + ' - ' + (m.attended ? 'Checked In' : 'Not Checked In') + '</li>';
                        }).join('')}
                    </ul>
                </div>
                <div style="border-top:1px solid var(--gray-200);padding-top:16px;margin-top:16px;">
                    <h4>Contributions</h4>
                    <ul>
                        ${eventContributions.map(function(c) {
                            return '<li>' + (c.member_name || 'Anonymous') + ' - KES ' + (c.amount || 0) + ' (' + (c.contribution_type || 'Money') + ')</li>';
                        }).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Tab switching
window.switchTab = function(tab) {
    document.querySelectorAll('.tab-btn').forEach(function(t) {
        t.classList.remove('active');
    });
    document.querySelector('.tab-btn[data-tab="' + tab + '"]').classList.add('active');
    
    var content = document.getElementById('tabContent');
    if (tab === 'overview') content.innerHTML = renderOverview();
    else if (tab === 'attendees') content.innerHTML = renderAttendees();
    else if (tab === 'contributions') content.innerHTML = renderContributions();
    else if (tab === 'report') content.innerHTML = renderReport();
};

// Toggle check-in
window.toggleCheckIn = async function(memberId) {
    try {
        var attendee = eventMembers.find(function(m) { return m.member_id === memberId; });
        var newStatus = !attendee.attended;
        
        var response = await fetch('/api/v1/events/' + currentEvent.id + '/attendance/' + memberId, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ attended: newStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update check-in');
        
        attendee.attended = newStatus;
        showSuccess(newStatus ? 'Checked in' : 'Check-in removed');
        renderEventDetail(currentEvent.id);
        
    } catch (error) {
        showError(error.message || 'Failed to update check-in');
    }
};

// Add attendee
window.addAttendee = function() {
    var available = allMembers.filter(function(m) {
        return !eventMembers.some(function(em) { return em.member_id === m.id; });
    });
    
    if (available.length === 0) {
        showError('All members are already added');
        return;
    }
    
    showFormModal({
        title: 'Add Attendee',
        fields: [
            {
                id: 'member_id',
                label: 'Member',
                type: 'select',
                options: available.map(function(m) {
                    return { value: m.id, label: m.full_name || m.first_name + ' ' + m.last_name };
                }),
                required: true
            }
        ],
        onSubmit: async function(data, done) {
            try {
                var response = await fetch('/api/v1/events/' + currentEvent.id + '/attendance/' + data.member_id, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });
                
                if (!response.ok) throw new Error('Failed to add attendee');
                
                showSuccess('Member added to event');
                done();
                renderEventDetail(currentEvent.id);
                
            } catch (error) {
                showError(error.message || 'Failed to add attendee');
            }
        }
    });
};

// Add contribution
window.addContribution = function() {
    var memberOptions = eventMembers.map(function(m) {
        return { value: m.member_id, label: m.member_name || 'Unknown' };
    });
    
    if (memberOptions.length === 0) {
        showError('No attendees to record payment for');
        return;
    }
    
    showFormModal({
        title: 'Record Event Payment',
        fields: [
            {
                id: 'member_id',
                label: 'Member',
                type: 'select',
                options: memberOptions,
                required: true
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
        onSubmit: async function(data, done) {
            try {
                var response = await fetch('/api/v1/events/' + currentEvent.id + '/contributions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify({
                        member_id: data.member_id,
                        contribution_type: 'money',
                        amount: parseFloat(data.amount),
                        payment_method: data.payment_method || 'cash'
                    })
                });
                
                if (!response.ok) {
                    var errData = await response.json();
                    throw new Error(errData.detail || 'Failed to record payment');
                }
                
                showSuccess('Payment recorded');
                done();
                renderEventDetail(currentEvent.id);
                
            } catch (error) {
                showError(error.message || 'Failed to record payment');
            }
        }
    });
};

window.editEvent = function() {
    import('./events.js').then(function(module) {
        module.openEventModal(currentEvent);
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

window.renderEventDetail = renderEventDetail;

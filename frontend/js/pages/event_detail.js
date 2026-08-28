/* ============================================================
   MtaaLink - Event Detail Page
   ============================================================ */

import { getEvent, updateEvent, deleteEvent } from '../core/api.js';
import { getMembers } from '../core/api.js';
import { getContributions } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showConfirm, showModal, showFormModal } from '../components/modal.js';

let currentEvent = null;
let eventMembers = [];
let eventContributions = [];
let allMembers = [];

export async function renderEventDetail(eventId) {
    const content = document.getElementById('pageContent');
    
    try {
        // Load event data
        const eventData = await getEvent(eventId);
        currentEvent = eventData;
        
        // Load attendees
        const attendees = eventData.attendance || [];
        eventMembers = attendees;
        
        // Load contributions
        const contributions = eventData.contributions || [];
        eventContributions = contributions;
        
        // Load all members for adding
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
            
            <!-- Tabs -->
            <div class="tabs" style="display:flex;gap:4px;border-bottom:2px solid var(--gray-200);margin-bottom:20px;">
                <button class="tab-btn active" data-tab="overview" onclick="window.switchTab('overview')">Overview</button>
                <button class="tab-btn" data-tab="attendees" onclick="window.switchTab('attendees')">Attendees (${eventMembers.length})</button>
                <button class="tab-btn" data-tab="contributions" onclick="window.switchTab('contributions')">Contributions (${eventContributions.length})</button>
                <button class="tab-btn" data-tab="report" onclick="window.switchTab('report')">Report</button>
            </div>
            
            <div id="tabContent">
                ${renderOverviewTab()}
            </div>
        `;
        
        // Attach tab styles
        const style = document.createElement('style');
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
                transition: all 0.2s;
            }
            .tab-btn:hover { color: var(--gray-700); }
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

function renderOverviewTab() {
    const e = currentEvent;
    const checkedIn = eventMembers.filter(function(m) { return m.attended; }).length;
    const totalCollected = eventContributions.reduce(function(sum, c) { return sum + c.amount; }, 0);
    
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
                    <div><strong>Organizer:</strong> ${e.organizer || 'Not set'}</div>
                </div>
                ${e.description ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--gray-200);"><strong>Description</strong><p style="margin-top:4px;color:var(--gray-600);">${e.description}</p></div>` : ''}
                ${e.notes ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200);"><strong>Notes</strong><p style="margin-top:4px;color:var(--gray-600);">${e.notes}</p></div>` : ''}
            </div>
        </div>
    `;
}

function renderAttendeesTab() {
    return `
        <div class="card">
            <div class="card-header">
                <h3>Attendees</h3>
                <button class="btn btn-primary" onclick="window.addAttendee()">+ Add Member</button>
            </div>
            <div class="card-body">
                ${eventMembers.length === 0 ? `
                    <p class="text-muted">No attendees yet. Add members to this event.</p>
                ` : `
                    <div style="overflow-x:auto;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Check In</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${eventMembers.map(m => `
                                    <tr>
                                        <td>${m.member_name || 'Unknown'}</td>
                                        <td>${m.phone || '-'}</td>
                                        <td>${m.attended ? '<span style="color:green;"> Checked In</span>' : '<span style="color:gray;"> Not Checked In</span>'}</td>
                                        <td>
                                            <button class="check-in-btn ${m.attended ? 'checked' : 'unchecked'}" 
                                                    onclick="window.toggleCheckIn('${m.member_id}')">
                                                ${m.attended ? '✓ Checked In' : 'Check In'}
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderContributionsTab() {
    return `
        <div class="card">
            <div class="card-header">
                <h3>Contributions</h3>
                <button class="btn btn-primary" onclick="window.addContribution()">+ Record Payment</button>
            </div>
            <div class="card-body">
                ${eventContributions.length === 0 ? `
                    <p class="text-muted">No contributions linked to this event.</p>
                ` : `
                    <div style="overflow-x:auto;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Amount</th>
                                    <th>Payment Method</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${eventContributions.map(c => `
                                    <tr>
                                        <td>${c.member_name || 'Unknown'}</td>
                                        <td>KES ${c.amount}</td>
                                        <td>${c.payment_method || '-'}</td>
                                        <td>${new Date(c.created_at).toLocaleDateString()}</td>
                                        <td><span class="badge badge-${c.status === 'paid' ? 'success' : 'warning'}">${c.status || 'pending'}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderReportTab() {
    return `
        <div class="card">
            <div class="card-header">
                <h3>Event Report</h3>
                <div>
                    <button class="btn btn-success" onclick="window.exportPDF()"> Export PDF</button>
                </div>
            </div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;">
                    <div><strong>Total Attendees:</strong> ${eventMembers.length}</div>
                    <div><strong>Checked In:</strong> ${eventMembers.filter(m => m.attended).length}</div>
                    <div><strong>Total Collected:</strong> KES ${eventContributions.reduce((sum, c) => sum + c.amount, 0)}</div>
                </div>
                <div style="border-top:1px solid var(--gray-200);padding-top:16px;">
                    <h4>Attendees List</h4>
                    <ul>
                        ${eventMembers.map(m => `
                            <li>${m.member_name || 'Unknown'} - ${m.attended ? ' Checked In' : ' Not Checked In'}</li>
                        `).join('')}
                    </ul>
                </div>
                <div style="border-top:1px solid var(--gray-200);padding-top:16px;margin-top:16px;">
                    <h4>Contributions</h4>
                    <ul>
                        ${eventContributions.map(c => `
                            <li>${c.member_name || 'Unknown'} - KES ${c.amount} (${c.status || 'pending'})</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Tab switching
window.switchTab = function(tab) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
    
    const content = document.getElementById('tabContent');
    switch(tab) {
        case 'overview': content.innerHTML = renderOverviewTab(); break;
        case 'attendees': content.innerHTML = renderAttendeesTab(); break;
        case 'contributions': content.innerHTML = renderContributionsTab(); break;
        case 'report': content.innerHTML = renderReportTab(); break;
    }
};

// Toggle check-in
window.toggleCheckIn = async function(memberId) {
    try {
        const eventId = currentEvent.id;
        const attendee = eventMembers.find(m => m.member_id === memberId);
        const newStatus = !attendee.attended;
        
        // Call API to update attendance
        const response = await fetch(`/api/v1/events/${eventId}/attendance/${memberId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ attended: newStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update check-in');
        
        // Update local data
        attendee.attended = newStatus;
        if (newStatus) {
            attendee.check_in_time = new Date().toISOString();
        }
        
        showSuccess(newStatus ? 'Checked in successfully' : 'Check-in removed');
        window.switchTab('attendees');
        
    } catch (error) {
        showError(error.message || 'Failed to update check-in');
    }
};

// Add attendee
window.addAttendee = function() {
    const available = allMembers.filter(m => !eventMembers.some(em => em.member_id === m.id));
    
    if (available.length === 0) {
        showError('All members are already added to this event');
        return;
    }
    
    showFormModal({
        title: 'Add Attendee',
        fields: [
            {
                id: 'member_id',
                label: 'Member',
                type: 'select',
                options: available.map(m => ({ value: m.id, label: m.full_name || m.first_name + ' ' + m.last_name })),
                required: true
            }
        ],
        onSubmit: async function(data, done) {
            try {
                const eventId = currentEvent.id;
                const response = await fetch(`/api/v1/events/${eventId}/attendance/${data.member_id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });
                
                if (!response.ok) throw new Error('Failed to add attendee');
                
                showSuccess('Member added to event');
                done();
                renderEventDetail(eventId);
                
            } catch (error) {
                showError(error.message || 'Failed to add attendee');
            }
        }
    });
};

// Add contribution to event
window.addContribution = function() {
    showFormModal({
        title: 'Record Event Payment',
        fields: [
            {
                id: 'member_id',
                label: 'Member',
                type: 'select',
                options: eventMembers.map(m => ({ value: m.member_id, label: m.member_name || 'Unknown' })),
                required: true
            },
            {
                id: 'amount',
                label: 'Amount (KES)',
                type: 'number',
                required: true,
                placeholder: '0.00'
            },

        ],
        onSubmit: async function(data, done) {
            try {
                const eventId = currentEvent.id;
                const response = await fetch(`/api/v1/events/${eventId}/contributions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify({
                        member_id: data.member_id,
                        contribution_type: 'money',
                        amount: parseFloat(data.amount)
                    })
                });
                
                if (!response.ok) throw new Error('Failed to record payment');
                
                showSuccess('Payment recorded');
                done();
                renderEventDetail(eventId);
                
            } catch (error) {
                showError(error.message || 'Failed to record payment');
            }
        }
    });
};

// Export functions
window.editEvent = function() {
    // Navigate to edit modal (reuse from events.js)
    const eventId = currentEvent.id;
    // Import and call openEventModal from events.js
    import('./events.js').then(module => {
        module.openEventModal(currentEvent);
    });
};

window.deleteEvent = async function() {
    showConfirm({
        title: 'Delete Event',
        message: 'Are you sure you want to delete this event?',
        confirmLabel: 'Delete',
        confirmClass: 'btn-danger',
        onConfirm: async function(done) {
            try {
                await deleteEvent(currentEvent.id);
                showSuccess('Event deleted successfully');
                done();
                navigateTo('events');
            } catch (error) {
                showError(error.message || 'Failed to delete event');
            }
        }
    });
};

window.exportPDF = function() {
    // Use the event report endpoint
    const eventId = currentEvent.id;
    const eventTitle = currentEvent.title || 'event';
    fetch(`/api/v1/reports/export/events/pdf?event_id=${eventId}`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('PDF generation failed');
        }
        return response.blob();
    })
    .then(function(blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event_${eventTitle}_report.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showSuccess('PDF downloaded successfully');
    })
    .catch(function(error) {
        showError('Failed to download PDF: ' + error.message);
    });
};



window.renderEventDetail = renderEventDetail;

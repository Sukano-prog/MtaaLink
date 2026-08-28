/* ============================================================
   MtaaLink - Event Detail Page (Tabs with Filters)
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
let filterPaymentMethod = 'all';
let filterDateRange = 'all';
let filterMemberSearch = '';

export async function renderEventDetail(id) {
    eventId = id;
    const content = document.getElementById('pageContent');
    currentEvent = null;
    eventMembers = [];
    eventContributions = [];
    
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
        
        setTimeout(function() {
            switchTab(currentTab);
        }, 50);
        
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
                }
                .filter-bar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    padding: 12px 16px;
                    background: #f8fafc;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    align-items: center;
                }
                .filter-bar label {
                    font-size: 13px;
                    font-weight: 500;
                    color: #374151;
                    margin-right: 4px;
                }
                .filter-bar select, .filter-bar input {
                    padding: 6px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 13px;
                    background: white;
                    outline: none;
                }
                .filter-bar select:focus, .filter-bar input:focus {
                    border-color: #1A73E8;
                    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
                }
                .filter-bar .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .filter-bar .clear-filter {
                    color: #ef4444;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    background: none;
                    border: none;
                    padding: 4px 8px;
                }
                .filter-bar .clear-filter:hover {
                    text-decoration: underline;
                }
                .payments-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .payments-table th {
                    text-align: left;
                    padding: 10px 12px;
                    background: #f8fafc;
                    font-size: 12px;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 2px solid #e5e7eb;
                }
                .payments-table td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #f3f4f6;
                    font-size: 14px;
                }
                .payments-table tr:hover {
                    background: #f9fafb;
                }
                .payment-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 12px;
                    margin-bottom: 16px;
                }
                .payment-summary .summary-item {
                    background: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                }
                .payment-summary .summary-item .label {
                    font-size: 12px;
                    color: #6b7280;
                }
                .payment-summary .summary-item .value {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1a1a2e;
                }
                .no-results {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                }
                @media (max-width: 640px) {
                    .filter-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .filter-bar .filter-group {
                        flex-wrap: wrap;
                    }
                    .payments-table {
                        font-size: 12px;
                    }
                    .payments-table th, .payments-table td {
                        padding: 6px 8px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
    } catch (error) {
        showError('Failed to load event: ' + error.message);
        content.innerHTML = '<div class="error-box">Failed to load event details</div>';
    }
}

function renderOverview() {
    if (!currentEvent) return '<div>Loading...</div>';
    const e = currentEvent;
    return `
        <div style="display:grid;gap:16px;max-width:800px;">
            <div><strong>Description:</strong> ${e.description || 'No description'}</div>
            <div><strong>Date:</strong> ${e.date || e.start_date || 'TBD'}</div>
            <div><strong>Time:</strong> ${e.time || e.start_time || 'TBD'}</div>
            <div><strong>Location:</strong> ${e.location || e.venue || e.address || 'TBD'}</div>
            <div><strong>Status:</strong> <span style="background:${e.status === 'completed' ? '#d4edda' : '#fff3cd'};padding:4px 12px;border-radius:4px;">${e.status || 'pending'}</span></div>
            <div><strong>Attendees:</strong> ${eventMembers.filter(m => m.attended).length} / ${eventMembers.length}</div>
            <div><strong>Contributions:</strong> ${eventContributions.length} payments</div>
            <div><strong>Total Collected:</strong> KES ${eventContributions.reduce((sum, c) => sum + (c.amount || 0), 0).toFixed(2)}</div>
        </div>
    `;
}

function renderAttendees() {
    const checkedIn = eventMembers.filter(m => m.attended).length;
    return `
        <div style="margin-bottom:12px;">
            <strong>Checked in:</strong> ${checkedIn} / ${eventMembers.length}
            <button class="btn btn-primary" style="margin-left:12px;padding:4px 16px;font-size:13px;" onclick="recordAttendance()">+ Record Attendance</button>
        </div>
        <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;">
                <tr style="background:#f8fafc;">
                    <th style="padding:8px 12px;text-align:left;font-size:12px;">Member</th>
                    <th style="padding:8px 12px;text-align:left;font-size:12px;">Role</th>
                    <th style="padding:8px 12px;text-align:left;font-size:12px;">Status</th>
                    <th style="padding:8px 12px;text-align:left;font-size:12px;">Action</th>
                </tr>
                ${eventMembers.map(m => `
                    <tr>
                        <td style="padding:8px 12px;">${m.member_name || m.name || 'Unknown'}</td>
                        <td style="padding:8px 12px;">${m.role || 'member'}</td>
                        <td style="padding:8px 12px;">${m.attended ? '✅ Checked in' : '❌ Not checked in'}</td>
                        <td style="padding:8px 12px;">
                            <button class="check-in-btn ${m.attended ? 'checked' : 'unchecked'}" 
                                    onclick="toggleAttendance('${m.id || m.member_id}')">
                                ${m.attended ? 'Undo' : 'Check in'}
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `;
}

function renderPayments() {
    // Apply filters
    let filtered = [...eventContributions];
    
    // Filter by payment method
    if (filterPaymentMethod !== 'all') {
        filtered = filtered.filter(c => (c.payment_method || '').toLowerCase() === filterPaymentMethod.toLowerCase());
    }
    
    // Filter by date range
    if (filterDateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        if (filterDateRange === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (filterDateRange === 'week') {
            startDate.setDate(now.getDate() - 7);
        } else if (filterDateRange === 'month') {
            startDate.setMonth(now.getMonth() - 1);
        }
        filtered = filtered.filter(c => {
            const dateStr = c.payment_date || c.created_at;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d >= startDate;
        });
    }
    
    // Filter by member name search
    if (filterMemberSearch.trim()) {
        const search = filterMemberSearch.toLowerCase().trim();
        filtered = filtered.filter(c => {
            const name = c.member_name || c.name || '';
            return name.toLowerCase().includes(search);
        });
    }
    
    const total = filtered.reduce((sum, c) => sum + (c.amount || 0), 0);
    const count = filtered.length;
    
    return `
        <div class="filter-bar">
            <div class="filter-group">
                <label>Method:</label>
                <select id="filterMethod" onchange="applyFilter('method', this.value)">
                    <option value="all">All</option>
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-PESA</option>
                    <option value="bank">Bank Transfer</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Date:</label>
                <select id="filterDate" onchange="applyFilter('date', this.value)">
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Member:</label>
                <input type="text" id="filterMember" placeholder="Search member..." oninput="applyFilter('member', this.value)">
            </div>
            <button class="clear-filter" onclick="clearFilters()">Clear Filters</button>
        </div>
        
        <div class="payment-summary">
            <div class="summary-item">
                <div class="label">Total Payments</div>
                <div class="value">${count}</div>
            </div>
            <div class="summary-item">
                <div class="label">Total Amount</div>
                <div class="value">KES ${total.toFixed(2)}</div>
            </div>
            <div class="summary-item">
                <div class="label">Average Payment</div>
                <div class="value">KES ${count > 0 ? (total / count).toFixed(2) : '0.00'}</div>
            </div>
        </div>
        
        ${count === 0 ? `
            <div class="no-results">
                <p>No payments found matching the filters</p>
            </div>
        ` : `
            <div style="overflow-x:auto;">
                <table class="payments-table">
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Type</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(c => {
                            const dateStr = c.payment_date ? new Date(c.payment_date).toLocaleDateString() : (c.created_at ? new Date(c.created_at).toLocaleDateString() : '-');
                            return `
                                <tr>
                                    <td><strong>${c.member_name || c.name || 'Anonymous'}</strong></td>
                                    <td>KES ${(c.amount || 0).toFixed(2)}</td>
                                    <td><span style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-size:12px;">${c.payment_method || 'cash'}</span></td>
                                    <td>${c.contribution_type || 'money'}</td>
                                    <td>${dateStr}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `}
    `;
}

function renderReport() {
    const total = eventContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const checkedIn = eventMembers.filter(m => m.attended).length;
    
    return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px;">
            <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">
                <div style="font-size:12px;color:#6b7280;">Total Attendees</div>
                <div style="font-size:24px;font-weight:700;">${eventMembers.length}</div>
            </div>
            <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">
                <div style="font-size:12px;color:#6b7280;">Checked In</div>
                <div style="font-size:24px;font-weight:700;">${checkedIn}</div>
            </div>
            <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">
                <div style="font-size:12px;color:#6b7280;">Total Payments</div>
                <div style="font-size:24px;font-weight:700;">${eventContributions.length}</div>
            </div>
            <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">
                <div style="font-size:12px;color:#6b7280;">Total Collected</div>
                <div style="font-size:24px;font-weight:700;">KES ${total.toFixed(2)}</div>
            </div>
        </div>
        <button class="btn btn-primary" onclick="exportReport()">📊 Export Report</button>
    `;
}

// Tab switching
window.switchTab = function(tab) {
    currentTab = tab;
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    const content = document.getElementById('tabContent');
    if (tab === 'overview') content.innerHTML = renderOverview();
    else if (tab === 'attendees') content.innerHTML = renderAttendees();
    else if (tab === 'payments') content.innerHTML = renderPayments();
    else if (tab === 'report') content.innerHTML = renderReport();
};

// Filter functions
window.applyFilter = function(type, value) {
    if (type === 'method') {
        filterPaymentMethod = value;
        document.getElementById('filterMethod').value = value;
    } else if (type === 'date') {
        filterDateRange = value;
        document.getElementById('filterDate').value = value;
    } else if (type === 'member') {
        filterMemberSearch = value;
    }
    const content = document.getElementById('tabContent');
    content.innerHTML = renderPayments();
};

window.clearFilters = function() {
    filterPaymentMethod = 'all';
    filterDateRange = 'all';
    filterMemberSearch = '';
    const methodSelect = document.getElementById('filterMethod');
    const dateSelect = document.getElementById('filterDate');
    const memberInput = document.getElementById('filterMember');
    if (methodSelect) methodSelect.value = 'all';
    if (dateSelect) dateSelect.value = 'all';
    if (memberInput) memberInput.value = '';
    const content = document.getElementById('tabContent');
    content.innerHTML = renderPayments();
};

// Export report
window.exportReport = function() {
    if (!eventContributions.length) {
        showError('No payments to export');
        return;
    }
    
    let csv = 'Member,Amount,Method,Type,Date\n';
    eventContributions.forEach(c => {
        const dateStr = c.payment_date ? new Date(c.payment_date).toLocaleDateString() : (c.created_at ? new Date(c.created_at).toLocaleDateString() : '-');
        csv += `"${c.member_name || c.name || 'Anonymous'}",${c.amount || 0},${c.payment_method || 'cash'},${c.contribution_type || 'money'},${dateStr}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-payments-${currentEvent?.title || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report exported!', 'success');
};

// Other functions (keep existing)
window.editEvent = function() {
    if (!currentEvent) return;
    showFormModal('Edit Event', [
        { id: 'title', label: 'Title', type: 'text', value: currentEvent.title, required: true },
        { id: 'description', label: 'Description', type: 'textarea', value: currentEvent.description || '' },
        { id: 'date', label: 'Date', type: 'date', value: currentEvent.date || currentEvent.start_date?.split('T')[0] || '', required: true },
        { id: 'time', label: 'Time', type: 'time', value: currentEvent.time || currentEvent.start_time || '' },
        { id: 'location', label: 'Location', type: 'text', value: currentEvent.location || currentEvent.venue || '' },
        { id: 'status', label: 'Status', type: 'select', value: currentEvent.status || 'pending', options: [
            { value: 'pending', label: 'Pending' },
            { value: 'ongoing', label: 'Ongoing' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
        ]}
    ], async function(data) {
        try {
            const updated = await updateEvent(eventId, data);
            currentEvent = updated;
            showSuccess('Event updated!');
            renderEventDetail(eventId);
        } catch (error) {
            showError('Failed to update event: ' + error.message);
        }
    });
};

window.deleteEvent = function() {
    showConfirm('Delete Event', 'Are you sure you want to delete this event? This action cannot be undone.', async function() {
        try {
            await deleteEvent(eventId);
            showSuccess('Event deleted!');
            navigateTo('events');
        } catch (error) {
            showError('Failed to delete event: ' + error.message);
        }
    });
};

window.toggleAttendance = function(memberId) {
    // Find member
    const member = eventMembers.find(m => (m.id === memberId || m.member_id === memberId));
    if (!member) return;
    
    const newStatus = !member.attended;
    // Update locally
    member.attended = newStatus;
    // Refresh the attendees tab
    const content = document.getElementById('tabContent');
    content.innerHTML = renderAttendees();
    // Also update the count in the tab button
    const tabBtn = document.querySelector('[data-tab="attendees"]');
    if (tabBtn) {
        tabBtn.textContent = `Attendees (${eventMembers.filter(m => m.attended).length})`;
    }
    showToast(member.member_name + ' ' + (newStatus ? 'checked in' : 'unchecked'), 'info');
};

window.recordAttendance = function() {
    const available = allMembers.filter(function(m) {
        return !eventMembers.some(function(em) { return em.member_id === m.id || em.id === m.id; });
    });
    
    if (!available.length) {
        showToast('All members are already registered', 'info');
        return;
    }
    
    const options = available.map(function(m) {
        return { value: m.id, label: m.first_name + ' ' + m.last_name + ' (' + m.phone + ')' };
    });
    
    showFormModal('Record Attendance', [
        { id: 'member_id', label: 'Member', type: 'select', options: options, required: true },
        { id: 'role', label: 'Role', type: 'select', value: 'member', options: [
            { value: 'member', label: 'Member' },
            { value: 'visitor', label: 'Visitor' },
            { value: 'guest', label: 'Guest' }
        ]}
    ], function(data) {
        const member = allMembers.find(function(m) { return m.id === data.member_id; });
        if (!member) return;
        
        const newMember = {
            id: member.id,
            member_id: member.id,
            member_name: member.first_name + ' ' + member.last_name,
            role: data.role || 'member',
            attended: true,
            is_visitor: data.role === 'visitor'
        };
        eventMembers.push(newMember);
        const content = document.getElementById('tabContent');
        content.innerHTML = renderAttendees();
        // Update count
        const tabBtn = document.querySelector('[data-tab="attendees"]');
        if (tabBtn) {
            tabBtn.textContent = 'Attendees (' + eventMembers.length + ')';
        }
        showToast('Attendance recorded', 'success');
    });
};

window.renderEventDetail = renderEventDetail;

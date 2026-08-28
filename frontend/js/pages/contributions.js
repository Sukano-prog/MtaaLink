/* ============================================================
   MtaaLink - Contributions Page
   ============================================================ */

import { getContributions, createContribution, getContributionTypes, createContributionType, getMembers, updateContribution, deleteContribution, getEvents } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { Skeletons } from "../components/skeleton.js";
import { showFormModal, showConfirm, showModal } from '../components/modal.js';
import { createSearchableSelect } from '../components/searchable_select.js';

let contributionsData = [];
let membersList = [];
let typesList = [];
let currentPage = 1;
let pageSize = 20;
let totalContributions = 0;
let filterStatus = '';
let searchQuery = "";
let filterMember = '';
let eventOptions = [];

export async function renderContributions() {
    const content = document.getElementById('pageContent');
    
    try {
        await Promise.all([
            loadMembers(),
            loadTypes(),
            loadEventsForDropdown()
        ]);
        
        content.innerHTML = `
            <div class="page-header">
                <h2>Contributions</h2>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-primary" id="addContributionBtn">Record Contribution</button>
                    <button class="btn btn-outline" id="addTypeBtn">Manage Types</button>
                </div>
            </div>
            
            <div class="stats-grid" id="contributionStats">
                <div class="stat-card">
                    <div class="stat-label">Total Collected</div>
                    <div class="stat-value" id="totalCollected">KES 0</div>
                    <div class="stat-change">All time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Pledged</div>
                    <div class="stat-value" id="totalPledged">KES 0</div>
                    <div class="stat-change">All contributions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Pending</div>
                    <div class="stat-value" id="pendingCount">0</div>
                    <div class="stat-change">Awaiting payment</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Overdue</div>
                    <div class="stat-value" id="overdueCount">0</div>
                    <div class="stat-change">Past due date</div>
                </div>
            </div>
            
            <div class="filter-bar">
                <div class="search-box">
                    <input type="text" id="searchContributions" class="form-control" placeholder="Search by member name...">
                </div>
                <div class="filter-box">
                    <select id="statusFilter" class="form-control form-select">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                    </select>
                </div>
                <div class="filter-box">
                    <select id="memberFilter" class="form-control form-select">
                        <option value="">All Members</option>
                        ${membersList.map(function(m) {
                            return `<option value="${m.id}">${m.full_name || m.first_name + ' ' + m.last_name}</option>`;
                        }).join('')}
                    </select>
                </div>
                <span class="member-count" id="contributionCount">0 contributions</span>
            </div>
            
            <div id="contributionsContainer">
                ${Skeletons.table()}
            </div>
            
            <div class="pagination" id="pagination"></div>
        `;
        
        document.getElementById('addContributionBtn').addEventListener('click', function() {
            openContributionModal();
        });
        
        document.getElementById('addTypeBtn').addEventListener('click', function() {
            openTypeModal();
        });
        
        document.getElementById('statusFilter').addEventListener('change', function() {
            filterStatus = this.value;
            currentPage = 1;
            loadContributions();
        });
        
        document.getElementById('memberFilter').addEventListener('change', function() {
            filterMember = this.value;
            currentPage = 1;
            loadContributions();
        });
        
        document.getElementById('searchContributions').addEventListener('input', function() {
            searchQuery = this.value.trim();
            currentPage = 1;
            loadContributions();
        });
        
        await loadContributions();
        
    } catch (error) {
        content.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="empty-state">
                        <p style="color:var(--danger);">Failed to load contributions: ${error.message}</p>
                        <button class="btn btn-primary" onclick="renderContributions()">Retry</button>
                    </div>
                </div>
            </div>
        `;
    }
}

async function loadMembers() {
    try {
        membersList = await getMembers();
    } catch (e) {
        membersList = [];
    }
}

// Load events for dropdown
async function loadEventsForDropdown() {
    try {
        const events = await getEvents();
        if (events && events.length > 0) {
            eventOptions = events.filter(function(e) { return e.status !== 'completed'; }).map(function(e) {
                return { value: e.id, label: e.title + ' (' + e.date + ')' };
            });
            eventOptions.unshift({ value: '', label: 'None (standalone)' });
        } else {
            eventOptions = [{ value: '', label: 'No events available' }];
        }
    } catch (e) {
        eventOptions = [{ value: '', label: 'No events available' }];
    }
}

async function loadTypes() {
    try {
        typesList = await getContributionTypes();
    } catch (e) {
        typesList = [];
    }
}

async function loadContributions() {
    const container = document.getElementById('contributionsContainer');
    const pagination = document.getElementById('pagination');
    
    try {
        const params = {
            skip: (currentPage - 1) * pageSize,
            limit: pageSize
        };
        if (searchQuery) params.search = searchQuery;
        if (filterStatus) params.status = filterStatus;
        if (filterMember) params.member_id = filterMember;
        
        const data = await getContributions(params);
        const contributions = data.contributions || [];
        totalContributions = data.total || contributions.length;
        contributionsData = contributions;
        
        renderContributionsTable(contributions);
        renderPagination();
        updateStats(contributions);
        
        document.getElementById('contributionCount').textContent = totalContributions + ' contributions';
        
    } catch (error) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load contributions: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadContributions()">Retry</button>
            </div></div>
        `;
    }
}

function renderContributionsTable(contributions) {
    const container = document.getElementById('contributionsContainer');
    
    if (!contributions || contributions.length === 0) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <div class="empty-state">
                    <p class="text-muted">No contributions found</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addContributionBtn').click()">Record your first contribution</button>
                </div>
            </div></div>
        `;
        return;
    }
    
    let html = `<div class="card"><div class="table-responsive"><table class="table"><thead><tr>
        <th>Member</th>
        <th>Type</th>
        <th>Amount</th>
        <th>Paid</th>
        <th>Balance</th>
        <th>Status</th>
        <th>Due Date</th>
        <th style="text-align:right;">Actions</th>
    </tr></thead><tbody>`;
    
    contributions.forEach(function(c) {
        const statusColors = {
            paid: 'badge-success',
            pending: 'badge-warning',
            overdue: 'badge-danger',
            partial: 'badge-info',
            waived: 'badge-gray'
        };
        const statusBadge = statusColors[c.status] || 'badge-gray';
        const memberName = c.member_name || 'Unknown';
        const typeName = c.contribution_type_name || 'General';
        
        html += `<tr>
            <td><strong>${memberName}</strong></td>
            <td><span class="badge badge-gray">${typeName}</span></td>
            <td><strong>KES ${(c.amount || 0).toLocaleString()}</strong></td>
            <td>KES ${(c.paid_amount || 0).toLocaleString()}</td>
            <td>KES ${(c.balance || 0).toLocaleString()}</td>
            <td><span class="badge ${statusBadge}">${c.status || 'pending'}</span></td>
            <td>${c.due_date || '-'}</td>
            <td style="text-align:right;">
                <button class="btn btn-sm btn-success record-payment" data-id="${c.id}">Pay</button>
                ${c.status !== 'paid' ? `<button class="btn btn-sm btn-danger delete-contribution" data-id="${c.id}">Delete</button>` : ''}
            </td>
        </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.record-payment').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const contribution = contributionsData.find(function(c) { return c.id === id; });
            if (contribution) openPaymentModal(contribution);
        });
    });
    
    container.querySelectorAll('.delete-contribution').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const contribution = contributionsData.find(function(c) { return c.id === id; });
            if (contribution) deleteContributionHandler(contribution);
        });
    });
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(totalContributions / pageSize);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    html += `<button class="btn btn-sm btn-outline page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>Previous</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'} page-btn" data-page="${i}">${i}</button>`;
    }
    html += `<button class="btn btn-sm btn-outline page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>`;
    
    pagination.innerHTML = html;
    pagination.querySelectorAll('.page-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const page = parseInt(this.dataset.page);
            if (page > 0 && page <= totalPages) {
                currentPage = page;
                loadContributions();
            }
        });
    });
}

function updateStats(contributions) {
    let totalCollected = 0;
    let totalPledged = 0;
    let pending = 0;
    let overdue = 0;
    
    contributions.forEach(function(c) {
        totalCollected += parseFloat(c.paid_amount || 0);
        totalPledged += parseFloat(c.amount || 0);
        if (c.status === 'pending') pending++;
        if (c.status === 'overdue') overdue++;
    });
    
    document.getElementById('totalCollected').textContent = 'KES ' + totalCollected.toLocaleString();
    document.getElementById('totalPledged').textContent = 'KES ' + totalPledged.toLocaleString();
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('overdueCount').textContent = overdue;
}

function openContributionModal() {
    const memberOptions = membersList.map(function(m) {
        return { value: m.id, label: m.full_name || m.first_name + ' ' + m.last_name };
    });
    
    const typeOptions = typesList.map(function(t) {
        return { value: t.id, label: t.name };
    });
    
    showFormModal({
        title: 'Record Contribution',
        size: 'md',
        submitLabel: 'Record',
        fields: [
            {
                id: 'member_id',
                label: 'Member',
                type: 'select',
                value: '',
                required: true,
                options: [{ value: '', label: '' }].concat(memberOptions)
            },
            {
                id: 'contribution_type_id',
                label: 'Contribution Type',
                type: 'select',
                value: '',
                required: false,
                options: [{ value: '', label: 'Select type...' }].concat(typeOptions)
            },
            {
                id: 'amount',
                label: 'Amount (KES)',
                type: 'number',
                value: '',
                required: true,
                placeholder: '0.00'
            },
            {
                id: 'due_date',
                label: 'Due Date',
                type: 'date',
                value: '',
                required: false
            },
            {
                id: 'payment_method',
                label: 'Payment Method',
                type: 'select',
                value: '',
                required: false,
                options: [
                    { value: '', label: 'Select method...' },
                    { value: 'cash', label: 'Cash' },
                    { value: 'mpesa', label: 'M-Pesa' },
                    { value: 'bank', label: 'Bank Transfer' },
                    { value: 'till', label: 'Buy Goods Till' }
                ]
            },
            {
                id: 'event_id',
                label: 'Link to Event',
                type: 'select',
                value: '',
                required: false,
                options: eventOptions
            },
            {
                id: 'notes',
                label: 'Notes',
                type: 'textarea',
                value: '',
                required: false,
                rows: 2,
                placeholder: 'Additional notes...'
            }
        ],
        onShow: function() {
            const memberSelect = document.getElementById('member_id');
            if (memberSelect) {
                const container = memberSelect.parentElement;
                const options = [{ value: '', label: '' }];
                membersList.forEach(function(m) {
                    options.push({ value: m.id, label: m.full_name || m.first_name + ' ' + m.last_name });
                });
                const searchableSelect = createSearchableSelect(options, '', 'Search members...');
                container.replaceChild(searchableSelect, memberSelect);
            }
        },
        onSubmit: function(data, done) {
            const memberContainer = document.querySelector('.searchable-select-container');
            let memberId = '';
            if (memberContainer) {
                const hiddenSelect = memberContainer.querySelector('.searchable-select-hidden');
                if (hiddenSelect) {
                    memberId = hiddenSelect.value;
                }
            } else {
                memberId = data.member_id || '';
            }
            
            if (!memberId) {
                showError('Please select a member');
                return;
            }
            if (!data.amount || parseFloat(data.amount) <= 0) {
                showError('Please enter a valid amount');
                return;
            }
            
            const formattedData = {
                member_id: memberId,
                contribution_type_id: data.contribution_type_id || null,
                amount: parseFloat(data.amount),
                due_date: data.due_date || null,
                payment_method: data.payment_method || null,
                notes: data.notes || null,
                event_id: data.event_id || null
            };
            
            createContribution(formattedData)
                .then(function() {
                    showSuccess('Contribution recorded!');
                    done();
                    loadContributions();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to record contribution');
                });
        }
    });
}

function openPaymentModal(contribution) {
    const balance = parseFloat(contribution.balance || contribution.amount || 0);
    
    showFormModal({
        title: 'Record Payment',
        size: 'sm',
        submitLabel: 'Record Payment',
        fields: [
            {
                id: 'amount_paid',
                label: 'Amount Paid (KES)',
                type: 'number',
                value: balance,
                required: true,
                placeholder: '0.00',
                helper: 'Balance remaining: KES ' + balance.toLocaleString()
            },
            {
                id: 'payment_method',
                label: 'Payment Method',
                type: 'select',
                value: '',
                required: false,
                options: [
                    { value: '', label: 'Select method...' },
                    { value: 'cash', label: 'Cash' },
                    { value: 'mpesa', label: 'M-Pesa' },
                    { value: 'bank', label: 'Bank Transfer' },
                    { value: 'till', label: 'Buy Goods Till' }
                ]
            }
        ],
        onSubmit: function(data, done) {
            const amountPaid = parseFloat(data.amount_paid);
            if (!amountPaid || amountPaid <= 0) {
                showError('Please enter a valid amount');
                return;
            }
            if (amountPaid > balance) {
                showError('Amount cannot exceed balance of KES ' + balance.toLocaleString());
                return;
            }
            
            const newPaidAmount = parseFloat(contribution.paid_amount || 0) + amountPaid;
            const newStatus = newPaidAmount >= parseFloat(contribution.amount) ? 'paid' : 'partial';
            
            const updateData = {
                paid_amount: newPaidAmount,
                status: newStatus,
                payment_method: data.payment_method || null
            };
            
            updateContribution(contribution.id, updateData)
                .then(function() {
                    showSuccess('Payment recorded!');
                    done();
                    loadContributions();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to record payment');
                });
        }
    });
}

function deleteContributionHandler(contribution) {
    const memberName = contribution.member_name || 'this member';
    const amount = contribution.amount || 0;
    
    showConfirm({
        title: 'Delete Contribution',
        message: 'Delete contribution of KES ' + amount.toLocaleString() + ' from ' + memberName + '? This cannot be undone.',
        confirmLabel: 'Delete',
        confirmClass: 'btn-danger',
        onConfirm: function(done) {
            deleteContribution(contribution.id)
                .then(function() {
                    showSuccess('Contribution deleted successfully');
                    done();
                    loadContributions();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to delete contribution');
                });
        }
    });
}

function openTypeModal() {
    showFormModal({
        title: 'Add Contribution Type',
        size: 'sm',
        submitLabel: 'Add Type',
        fields: [
            {
                id: 'name',
                label: 'Type Name',
                type: 'text',
                value: '',
                required: true,
                placeholder: 'e.g., Harambee, Development'
            },
            {
                id: 'description',
                label: 'Description',
                type: 'textarea',
                value: '',
                required: false,
                rows: 2,
                placeholder: 'Brief description...'
            }
        ],
        onSubmit: function(data, done) {
            if (!data.name || data.name.trim().length < 2) {
                showError('Please enter a valid type name');
                return;
            }
            
            createContributionType({
                name: data.name,
                description: data.description || null
            })
            .then(function() {
                showSuccess('Type added successfully!');
                done();
                loadTypes();
            })
            .catch(function(error) {
                showError(error.message || 'Failed to add type');
            });
        }
    });
}

window.renderContributions = renderContributions;

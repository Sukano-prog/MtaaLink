/* ============================================================
   Management System - Members Page
   ============================================================ */

import { getMembers, createMember, updateMember, deleteMember, getGroups } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showModal, showConfirm, showFormModal, closeModal } from '../components/modal.js';

let membersData = [];
let groupsData = [];
let currentPage = 1;
let pageSize = 20;
let totalMembers = 0;
let searchQuery = '';
let roleFilter = '';
let groupFilter = '';
let currentMemberId = null;

export async function renderMembers() {
    const content = document.getElementById('pageContent');
    
    try {
        groupsData = await getGroups();
    } catch (e) {
        groupsData = [];
    }
    
    content.innerHTML = `
        <div class="page-header">
            <h2>Members</h2>
            <button class="btn btn-primary" id="addMemberBtn">Add Member</button>
        </div>
        
        <div class="filter-bar">
            <div class="search-box">
                <input type="text" id="searchMembers" class="form-control" placeholder="Search by name, number, or phone...">
            </div>
            <div class="filter-box">
                <select id="roleFilter" class="form-control form-select">
                    <option value="">All Roles</option>
                    <option value="member">Member</option>
                    <option value="elder">Elder</option>
                    <option value="secretary">Secretary</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="chairperson">Chairperson</option>
                    <option value="youth">Youth</option>
                    <option value="women">Women</option>
                </select>
            </div>
            <div class="filter-box">
                <select id="groupFilter" class="form-control form-select">
                    <option value="">All Groups</option>
                    ${groupsData.map(function(g) {
                        return `<option value="${g.id}">${g.name}</option>`;
                    }).join('')}
                </select>
            </div>
            <span class="member-count" id="memberCount">0 members</span>
        </div>
        
        <div id="membersTableContainer">
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading members...</p>
            </div>
        </div>
        
        <div class="pagination" id="pagination"></div>
    `;
    
    document.getElementById('addMemberBtn').addEventListener('click', function() {
        openMemberModal();
    });
    
    document.getElementById('searchMembers').addEventListener('input', function(e) {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        loadMembers();
    });
    
    document.getElementById('roleFilter').addEventListener('change', function(e) {
        roleFilter = e.target.value;
        currentPage = 1;
        loadMembers();
    });
    
    document.getElementById('groupFilter').addEventListener('change', function(e) {
        groupFilter = e.target.value;
        currentPage = 1;
        loadMembers();
    });
    
    await loadMembers();
}

async function loadMembers() {
    const container = document.getElementById('membersTableContainer');
    const pagination = document.getElementById('pagination');
    
    try {
        groupsData = await getGroups();
        const groupFilterEl = document.getElementById('groupFilter');
        if (groupFilterEl) {
            const currentValue = groupFilterEl.value;
            groupFilterEl.innerHTML = '<option value="">All Groups</option>' + 
                groupsData.map(function(g) {
                    return `<option value="${g.id}">${g.name}</option>`;
                }).join('');
            if (currentValue) groupFilterEl.value = currentValue;
        }
        
        const params = {
            skip: (currentPage - 1) * pageSize,
            limit: pageSize
        };
        if (searchQuery) params.search = searchQuery;
        if (roleFilter) params.role = roleFilter;
        if (groupFilter) params.group_id = groupFilter;
        
        const members = await getMembers(params);
        membersData = members || [];
        totalMembers = members.length;
        
        renderMembersTable();
        renderPagination();
        document.getElementById('memberCount').textContent = totalMembers + ' members';
        
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <p style="color:var(--danger);">Failed to load members: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadMembers()">Retry</button>
            </div>
        `;
    }
}

function renderMembersTable() {
    const container = document.getElementById('membersTableContainer');
    
    if (membersData.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="empty-state">
                        <p class="text-muted">No members found</p>
                        <button class="btn btn-primary" onclick="document.getElementById('addMemberBtn').click()">
                            Add your first member
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    let html = `<div class="card"><div class="table-responsive"><table class="table"><thead><tr>
        <th>ID</th>
        <th>Name</th>
        <th>Phone</th>
        <th>Role</th>
        <th>Group</th>
        <th>Status</th>
        <th style="text-align:right;">Actions</th>
    </tr></thead><tbody>`;
    
    membersData.forEach(function(member) {
        const fullName = member.full_name || member.first_name + ' ' + member.last_name;
        const statusClass = member.is_active ? 'badge-success' : 'badge-danger';
        const statusText = member.is_active ? 'Active' : 'Inactive';
        const memberNumber = member.member_number || 'N/A';
        const groupName = member.group_name || 'Unassigned';
        
        html += `<tr>
            <td><span class="badge badge-gray">${memberNumber}</span></td>
            <td><strong>${fullName}</strong></td>
            <td>${member.phone || '-'}</td>
            <td><span class="badge badge-primary">${member.role || 'member'}</span></td>
            <td><span class="badge badge-${groupName !== 'Unassigned' ? 'info' : 'gray'}">${groupName}</span></td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td style="text-align:right;">
                <button class="btn btn-sm btn-outline edit-member" data-id="${member.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-member" data-id="${member.id}">Delete</button>
            </td>
        </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.edit-member').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const member = membersData.find(function(m) { return m.id === this.dataset.id; }.bind(this));
            if (member) openMemberModal(member);
        });
    });
    
    container.querySelectorAll('.delete-member').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const member = membersData.find(function(m) { return m.id === this.dataset.id; }.bind(this));
            if (member) deleteMemberHandler(member);
        });
    });
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(totalMembers / pageSize);
    
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
            const totalPages = Math.ceil(totalMembers / pageSize);
            if (page > 0 && page <= totalPages) {
                currentPage = page;
                loadMembers();
            }
        });
    });
}

function openMemberModal(member = null) {
    const isEdit = !!member;
    currentMemberId = member?.id || null;
    
    let suggestedNumber = '';
    if (!isEdit) {
        const nextNum = membersData.length + 1;
        suggestedNumber = 'M' + String(nextNum).padStart(4, '0');
    }
    
    const groupOptions = [{ value: '', label: 'No Group' }];
    groupsData.forEach(function(g) {
        groupOptions.push({ value: g.id, label: g.name });
    });
    
    const fields = [];
    
    fields.push({
        id: 'mfMemberNumber',
        label: 'Member ID',
        type: 'text',
        value: member?.member_number || suggestedNumber,
        required: !isEdit,
        disabled: isEdit,
        placeholder: 'e.g., M0001',
        helper: isEdit ? 'Member ID cannot be changed' : ''
    });
    
    fields.push({
        id: 'mfFirstName',
        label: 'First Name',
        type: 'text',
        value: member?.first_name || '',
        required: true,
        placeholder: 'Enter first name'
    });
    
    fields.push({
        id: 'mfLastName',
        label: 'Last Name',
        type: 'text',
        value: member?.last_name || '',
        required: true,
        placeholder: 'Enter last name'
    });
    
    fields.push({
        id: 'mfPhone',
        label: 'Phone Number',
        type: 'tel',
        value: member?.phone || '',
        required: !isEdit,
        placeholder: '0712345678',
        helper: 'Format: 0712345678 (10 digits)'
    });
    
    fields.push({
        id: 'mfEmail',
        label: 'Email',
        type: 'email',
        value: member?.email || '',
        required: false,
        placeholder: 'member@example.com'
    });
    
    fields.push({
        id: 'mfRole',
        label: 'Role',
        type: 'select_with_other',
        value: member?.role || 'member',
        required: false,
        options: [
            { value: 'member', label: 'Member' },
            { value: 'elder', label: 'Elder' },
            { value: 'secretary', label: 'Secretary' },
            { value: 'treasurer', label: 'Treasurer' },
            { value: 'chairperson', label: 'Chairperson' },
            { value: 'vice_chairperson', label: 'Vice Chairperson' },
            { value: 'youth_rep', label: 'Youth Representative' },
            { value: 'women_rep', label: 'Women Representative' },
            { value: 'elder_rep', label: 'Elder Representative' },
            { value: 'community_elder', label: 'Community Elder' },
            { value: 'village_admin', label: 'Village Administrator' },
            { value: 'clerk', label: 'Clerk' },
            { value: 'messenger', label: 'Messenger' },
            { value: 'security_rep', label: 'Security Representative' },
            { value: 'health_rep', label: 'Health Representative' },
            { value: 'education_rep', label: 'Education Representative' },
            { value: 'agriculture_rep', label: 'Agriculture Representative' },
            { value: 'youth_leader', label: 'Youth Leader' },
            { value: 'women_leader', label: 'Women Leader' },
            { value: 'other', label: 'Other (type custom role)' }
        ],
        helper: 'Select a role or choose "Other" to type a custom one'
    });
    
    fields.push({
        id: 'mfGroup',
        label: 'Group',
        type: 'select',
        value: member?.group_id || '',
        required: false,
        options: groupOptions,
        helper: 'Select a group to assign this member to'
    });
    
    fields.push({
        id: 'mfStatus',
        label: 'Status',
        type: 'select',
        value: member?.is_active !== false ? 'true' : 'false',
        required: false,
        options: [
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' }
        ]
    });
    
    showFormModal({
        title: isEdit ? 'Edit Member' : 'Add Member',
        fields: fields,
        size: 'md',
        submitLabel: isEdit ? 'Update' : 'Create',
        onSubmit: function(data, done) {
            try {
                const phone = data.mfPhone || '';
                
                if (!isEdit || phone.length > 0) {
                    if (!phone || !phone.match(/^0[17]\d{8}$/)) {
                        showError('Phone must be 10 digits starting with 0 (e.g., 0712345678)');
                        return;
                    }
                }
                
                const formattedData = {};
                formattedData.first_name = data.mfFirstName;
                formattedData.last_name = data.mfLastName;
                formattedData.role = data.mfRole || 'member';
                formattedData.is_active = data.mfStatus === 'true';
                
                if (!isEdit && data.mfMemberNumber && data.mfMemberNumber.trim() !== '') {
                    formattedData.member_number = data.mfMemberNumber.trim();
                }
                
                if (phone && phone.trim() !== '') {
                    formattedData.phone = phone.trim();
                }
                
                if (data.mfEmail && data.mfEmail.trim() !== '') {
                    formattedData.email = data.mfEmail.trim();
                }
                
                formattedData.group_id = data.mfGroup || null;
                
                saveMember(formattedData, isEdit, done);
            } catch (error) {
                console.error('Form submit error:', error);
                showError(error.message || 'Failed to process form');
            }
        }
    });
}

async function saveMember(data, isEdit, done) {
    try {
        if (isEdit && currentMemberId) {
            await updateMember(currentMemberId, data);
            showSuccess('Member updated successfully');
        } else {
            await createMember(data);
            showSuccess('Member added successfully');
        }
        currentMemberId = null;
        done();
        await loadMembers();
    } catch (error) {
        console.error('Save error:', error);
        showError(error.message || 'Failed to save member');
    }
}

async function deleteMemberHandler(member) {
    const name = member.full_name || member.first_name + ' ' + member.last_name;
    
    showConfirm({
        title: 'Delete Member',
        message: 'Delete ' + name + '? This cannot be undone.',
        confirmLabel: 'Delete',
        confirmClass: 'btn-danger',
        onConfirm: function(done) {
            deleteMember(member.id)
                .then(function() {
                    showSuccess('Member deleted');
                    done();
                    loadMembers();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to delete member');
                });
        }
    });
}

window.renderMembers = renderMembers;

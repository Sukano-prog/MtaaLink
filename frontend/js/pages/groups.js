/* ============================================================
   MtaaLink - Groups Page
   ============================================================ */

import { getGroups, createGroup, updateGroup, deleteGroup, getMembers, addMemberToGroup, removeMemberFromGroup } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { Skeletons } from '../components/skeleton.js';
import { showFormModal, showConfirm, showModal, closeModal } from '../components/modal.js';

let searchQuery = "";
let groupsData = [];
let membersData = [];
let currentGroupId = null;

export async function renderGroups() {
    const content = document.getElementById('pageContent');
    if (!content) {
        console.error('Page content not found');
        return;
    }
    
    try {
        membersData = await getMembers().catch(() => []);
        
        content.innerHTML = `
            <div class="page-header">
                <h2>Groups</h2>
                <button class="btn btn-primary" id="addGroupBtn">Create Group</button>
            </div>
            
            <div id="groupsContainer">
                ${Skeletons.groups()}
            </div>
        `;
        
        document.getElementById('addGroupBtn').addEventListener('click', function() {
            openGroupModal();
        });
        
        await loadGroups();
        
    } catch (error) {
        content.innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load groups: ${error.message}</p>
                <button class="btn btn-primary" onclick="renderGroups()">Retry</button>
            </div></div>
        `;
    }
}

async function loadGroups() {
    const container = document.getElementById('groupsContainer');
    if (!container) return;
    
    try {
        groupsData = await getGroups();
        renderGroupsList();
    } catch (error) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load groups: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadGroups()">Retry</button>
            </div></div>
        `;
    }
}

function renderGroupsList() {
    const container = document.getElementById('groupsContainer');
    if (!container) return;
    
    if (!groupsData || groupsData.length === 0) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <div class="empty-state">
                    <p class="text-muted">No groups created yet</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addGroupBtn').click()">Create your first group</button>
                </div>
            </div></div>
        `;
        return;
    }
    
    let html = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;">`;
    
    groupsData.forEach(function(g) {
        const memberCount = g.member_count || 0;
        html += `
            <div class="card" style="border-left:4px solid var(--primary);">
                <div class="card-body">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <h4 style="margin:0;">${g.name}</h4>
                        <span class="badge badge-primary">${memberCount} members</span>
                    </div>
                    <div style="font-size:var(--font-size-sm);color:var(--gray-500);margin-top:8px;">
                        ${g.description || 'No description'}
                    </div>
                    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary view-group" data-id="${g.id}">View Members</button>
                        <button class="btn btn-sm btn-outline edit-group" data-id="${g.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-group" data-id="${g.id}">Delete</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.view-group').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const group = groupsData.find(function(g) { return g.id === this.dataset.id; }.bind(this));
            if (group) viewGroupDetail(group);
        });
    });
    
    container.querySelectorAll('.edit-group').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const group = groupsData.find(function(g) { return g.id === this.dataset.id; }.bind(this));
            if (group) openGroupModal(group);
        });
    });
    
    container.querySelectorAll('.delete-group').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const group = groupsData.find(function(g) { return g.id === this.dataset.id; }.bind(this));
            if (group) deleteGroupHandler(group);
        });
    });
}

function viewGroupDetail(group) {
    getGroupDetails(group.id).then(function(freshGroup) {
        if (freshGroup) {
            renderGroupDetailModal(freshGroup);
        } else {
            renderGroupDetailModal(group);
        }
    }).catch(function() {
        renderGroupDetailModal(group);
    });
}

async function getGroupDetails(groupId) {
    try {
        const response = await fetch('/api/v1/groups/' + groupId + '/', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (e) {
        console.error('Error fetching group details:', e);
        return null;
    }
}

function renderGroupDetailModal(group) {
    getMembers().then(function(freshMembers) {
        membersData = freshMembers || [];
        renderGroupDetailModalWithMembers(group, membersData);
    }).catch(function() {
        renderGroupDetailModalWithMembers(group, membersData);
    });
}

function renderGroupDetailModalWithMembers(group, members) {
    const groupMembers = group.members || [];
    const groupMemberIds = groupMembers.map(function(m) { return m.id; });
    
    const availableMembers = members.filter(function(m) {
        return !groupMemberIds.includes(m.id);
    });
    
    const memberListHtml = groupMembers.map(function(m) {
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--gray-100);">
                <div>
                    <strong>${m.name || m.full_name || 'Unknown'}</strong>
                    <div style="font-size:var(--font-size-xs);color:var(--gray-500);">${m.phone || '-'} · ${m.role || 'member'}</div>
                </div>
                <button class="btn btn-sm btn-danger remove-member-btn" data-member-id="${m.id}" data-group-id="${group.id}">Remove</button>
            </div>
        `;
    }).join('');
    
    showModal({
        title: 'Group: ' + group.name,
        content: `
            <div style="margin-bottom:12px;">
                <p>${group.description || 'No description'}</p>
                <div style="font-size:var(--font-size-sm);color:var(--gray-500);">
                    <span>${groupMembers.length} members in this group</span>
                </div>
            </div>
            
            <div style="border-top:1px solid var(--gray-200);padding-top:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <h4 style="margin:0;">Members</h4>
                    <span style="font-size:var(--font-size-xs);color:var(--gray-500);">${groupMembers.length} total</span>
                </div>
                <div style="max-height:250px;overflow-y:auto;margin-top:8px;" id="memberListContainer">
                    ${memberListHtml || '<p class="text-muted">No members in this group</p>'}
                </div>
            </div>
            
            ${availableMembers.length > 0 ? `
                <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200);">
                    <h4>Add Member to Group</h4>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                        <div style="flex:1;min-width:200px;position:relative;">
                            <input type="text" id="memberSearchInput" class="form-control" placeholder="Type to search members..." style="width:100%;" autocomplete="off">
                            <div id="memberDropdown" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:10000;background:white;border:1px solid #ddd;border-radius:4px;max-height:200px;overflow-y:auto;margin-top:4px;box-shadow:0 4px 12px rgba(0,0,0,0.15);"></div>
                        </div>
                        <button class="btn btn-primary" id="addMemberBtn">Add Member</button>
                    </div>
                </div>
            ` : `
                <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200);">
                    <p class="text-muted">All members are already in this group</p>
                </div>
            `}
        `,
        size: 'md',
        buttons: [
            {
                label: 'Close',
                action: 'close',
                class: 'btn-outline',
                onClick: function(done) { 
                    closeModal();
                    done(); 
                    loadGroups();
                }
            }
        ],
        onShow: function() {
            document.querySelectorAll('.remove-member-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const memberId = this.dataset.memberId;
                    const groupId = this.dataset.groupId;
                    const member = membersData.find(function(m) { return m.id === memberId; });
                    const memberName = member ? (member.full_name || member.first_name + ' ' + member.last_name) : 'this member';
                    
                    showConfirm({
                        title: 'Remove Member',
                        message: 'Remove ' + memberName + ' from ' + group.name + '?',
                        confirmLabel: 'Remove',
                        confirmClass: 'btn-danger',
                        onConfirm: function(done) {
                            removeMemberFromGroup(groupId, memberId)
                                .then(function() {
                                    showSuccess('Member removed from group');
                                    done();
                                    closeModal();
                                    loadGroups();
                                    getMembers().then(function(m) { membersData = m; });
                                })
                                .catch(function(error) {
                                    showError(error.message || 'Failed to remove member');
                                });
                        }
                    });
                });
            });
            
            const addBtn = document.getElementById('addMemberBtn');
            const searchInput = document.getElementById('memberSearchInput');
            const dropdown = document.getElementById('memberDropdown');
            
            if (addBtn && searchInput && dropdown) {
                let selectedMemberId = '';
                
                function renderDropdown(filter = '') {
                    const query = filter.toLowerCase().trim();
                    let filtered = availableMembers;
                    
                    if (query) {
                        filtered = availableMembers.filter(function(m) {
                            const name = (m.full_name || m.first_name + ' ' + m.last_name || '').toLowerCase();
                            const number = (m.member_number || '').toLowerCase();
                            return name.includes(query) || number.includes(query);
                        });
                    }
                    
                    if (filtered.length > 0) {
                        dropdown.innerHTML = filtered.map(function(m) {
                            const label = (m.full_name || m.first_name + ' ' + m.last_name) + ' (' + (m.member_number || 'N/A') + ')';
                            return `
                                <div class="member-option" data-id="${m.id}" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #f0f0f0;">
                                    ${label}
                                </div>
                            `;
                        }).join('');
                        dropdown.style.display = 'block';
                        
                        dropdown.querySelectorAll('.member-option').forEach(function(opt) {
                            opt.addEventListener('click', function() {
                                selectedMemberId = this.dataset.id;
                                const name = this.textContent.trim();
                                searchInput.value = name;
                                dropdown.style.display = 'none';
                            });
                        });
                    } else {
                        dropdown.innerHTML = `<div style="padding:8px 12px;color:#999;">No members found</div>`;
                        dropdown.style.display = 'block';
                    }
                }
                
                searchInput.addEventListener('focus', function() {
                    renderDropdown(this.value);
                });
                
                searchInput.addEventListener('input', function() {
                    renderDropdown(this.value);
                });
                
                searchInput.addEventListener('blur', function() {
                    setTimeout(function() {
                        dropdown.style.display = 'none';
                    }, 200);
                });
                
                searchInput.addEventListener('keydown', function(e) {
                    const options = dropdown.querySelectorAll('.member-option');
                    let currentIndex = -1;
                    options.forEach(function(el, idx) {
                        if (el.style.background === '#f0f0f0' || el.dataset.selected === 'true') {
                            currentIndex = idx;
                        }
                    });
                    
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (options.length === 0) return;
                        const nextIndex = currentIndex + 1;
                        if (nextIndex < options.length) {
                            options.forEach(function(el) { el.style.background = ''; el.dataset.selected = 'false'; });
                            options[nextIndex].style.background = '#f0f0f0';
                            options[nextIndex].dataset.selected = 'true';
                            options[nextIndex].scrollIntoView({ block: 'nearest' });
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (options.length === 0) return;
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
                        if (prevIndex >= 0 && prevIndex < options.length) {
                            options.forEach(function(el) { el.style.background = ''; el.dataset.selected = 'false'; });
                            options[prevIndex].style.background = '#f0f0f0';
                            options[prevIndex].dataset.selected = 'true';
                            options[prevIndex].scrollIntoView({ block: 'nearest' });
                        }
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const selected = dropdown.querySelector('.member-option[data-selected="true"]');
                        if (selected) {
                            selectedMemberId = selected.dataset.id;
                            const name = selected.textContent.trim();
                            searchInput.value = name;
                            dropdown.style.display = 'none';
                        }
                    } else if (e.key === 'Escape') {
                        dropdown.style.display = 'none';
                        searchInput.blur();
                    }
                });
                
                addBtn.addEventListener('click', function() {
                    if (!selectedMemberId) {
                        showError('Please select a member from the search results');
                        return;
                    }
                    
                    const isAlreadyInGroup = groupMembers.some(function(m) {
                        return m.id === selectedMemberId;
                    });
                    
                    if (isAlreadyInGroup) {
                        showError('This member is already in the group');
                        selectedMemberId = '';
                        searchInput.value = '';
                        return;
                    }
                    
                    addMemberToGroup(group.id, selectedMemberId)
                        .then(function() {
                            showSuccess('Member added to group successfully!');
                            closeModal();
                            loadGroups();
                            getMembers().then(function(m) { membersData = m; });
                        })
                        .catch(function(error) {
                            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                                showError('This member is already in the group');
                            } else {
                                showError(error.message || 'Failed to add member');
                            }
                            selectedMemberId = '';
                            searchInput.value = '';
                            getMembers().then(function(m) { membersData = m; });
                        });
                });
                
                searchInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && selectedMemberId) {
                        addBtn.click();
                    }
                });
            }
        }
    });
}

function openGroupModal(group = null) {
    const isEdit = !!group;
    currentGroupId = group?.id || null;
    
    showFormModal({
        title: isEdit ? 'Edit Group' : 'Create Group',
        size: 'md',
        submitLabel: isEdit ? 'Update' : 'Create',
        fields: [
            {
                id: 'name',
                label: 'Group Name',
                type: 'text',
                value: group?.name || '',
                required: true,
                placeholder: 'e.g., Organization Elders, Youth Group'
            },
            {
                id: 'description',
                label: 'Description',
                type: 'textarea',
                value: group?.description || '',
                required: false,
                rows: 2,
                placeholder: 'What is this group about?'
            }
        ],
        onSubmit: function(data, done) {
            if (!data.name || data.name.trim().length < 2) {
                showError('Please enter a group name');
                return;
            }
            
            const formattedData = {
                name: data.name.trim(),
                description: data.description || null
            };
            
            saveGroup(formattedData, isEdit, done);
        }
    });
}

async function saveGroup(data, isEdit, done) {
    try {
        if (isEdit && currentGroupId) {
            await updateGroup(currentGroupId, data);
            showSuccess('Group updated successfully');
        } else {
            await createGroup(data);
            showSuccess('Group created successfully');
        }
        currentGroupId = null;
        done();
        await loadGroups();
    } catch (error) {
        showError(error.message || 'Failed to save group');
    }
}

async function deleteGroupHandler(group) {
    showConfirm({
        title: 'Delete Group',
        message: 'Delete "' + group.name + '"? Members will not be removed from the organization, just from this group.',
        confirmLabel: 'Delete',
        confirmClass: 'btn-danger',
        onConfirm: function(done) {
            deleteGroup(group.id)
                .then(function() {
                    showSuccess('Group deleted');
                    done();
                    loadGroups();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to delete group');
                });
        }
    });
}

window.renderGroups = renderGroups;

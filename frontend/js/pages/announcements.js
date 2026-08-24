/* ============================================================
   MtaaLink - Announcements Page
   ============================================================ */

import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, sendAnnouncement, getMembers, getGroups } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showFormModal, showConfirm, showModal } from '../components/modal.js';

let announcementsData = [];
let membersData = [];
let groupsData = [];
let currentAnnouncementId = null;

export async function renderAnnouncements() {
    const content = document.getElementById('pageContent');
    
    try {
        membersData = await getMembers().catch(() => []);
        groupsData = await getGroups().catch(() => []);
    } catch (e) {
        membersData = [];
        groupsData = [];
    }
    
    content.innerHTML = `
        <div class="page-header">
            <h2>Announcements</h2>
            <button class="btn btn-primary" id="addAnnouncementBtn">Create Announcement</button>
        </div>
        
        <div id="announcementsContainer">
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading announcements...</p>
            </div>
        </div>
    `;
    
    document.getElementById('addAnnouncementBtn').addEventListener('click', function() {
        openAnnouncementModal();
    });
    
    await loadAnnouncements();
}

async function loadAnnouncements() {
    const container = document.getElementById('announcementsContainer');
    
    try {
        announcementsData = await getAnnouncements();
        renderAnnouncementsList();
    } catch (error) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load announcements: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadAnnouncements()">Retry</button>
            </div></div>
        `;
    }
}

function renderAnnouncementsList() {
    const container = document.getElementById('announcementsContainer');
    
    if (announcementsData.length === 0) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <div class="empty-state">
                    <p class="text-muted">No announcements found</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addAnnouncementBtn').click()">
                        Create your first announcement
                    </button>
                </div>
            </div></div>
        `;
        return;
    }
    
    let html = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:16px;">`;
    
    announcementsData.forEach(function(a) {
        const statusColors = {
            draft: 'badge-gray',
            scheduled: 'badge-warning',
            sent: 'badge-success',
            failed: 'badge-danger'
        };
        const statusBadge = statusColors[a.status] || 'badge-gray';
        const statusText = a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : 'Draft';
        
        html += `
            <div class="card">
                <div class="card-body">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <h4 style="margin:0;">${a.title}</h4>
                        <span class="badge ${statusBadge}">${statusText}</span>
                    </div>
                    <div style="font-size:var(--font-size-sm);color:var(--gray-500);margin-top:8px;white-space:pre-wrap;max-height:80px;overflow:hidden;">
                        ${a.message || 'No message'}
                    </div>
                    <div style="font-size:var(--font-size-xs);color:var(--gray-500);margin-top:8px;">
                        <div>${a.scheduled_for ? 'Scheduled: ' + new Date(a.scheduled_for).toLocaleString() : 'Send now'}</div>
                        <div>${a.delivery_count || 0} delivered</div>
                        <div>${a.sent_via || 'SMS'}</div>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                        ${a.status === 'draft' ? `
                            <button class="btn btn-sm btn-success send-announcement" data-id="${a.id}">Send Now</button>
                            <button class="btn btn-sm btn-outline edit-announcement" data-id="${a.id}">Edit</button>
                        ` : ''}
                        ${a.status === 'scheduled' ? `
                            <button class="btn btn-sm btn-outline edit-announcement" data-id="${a.id}">Edit</button>
                        ` : ''}
                        ${a.status === 'sent' ? `
                            <button class="btn btn-sm btn-outline view-announcement" data-id="${a.id}">View Details</button>
                        ` : ''}
                        ${a.status === 'draft' || a.status === 'scheduled' ? `
                            <button class="btn btn-sm btn-danger delete-announcement" data-id="${a.id}">Delete</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.send-announcement').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const announcement = announcementsData.find(function(a) { return a.id === id; });
            if (announcement) sendAnnouncementHandler(announcement);
        });
    });
    
    container.querySelectorAll('.edit-announcement').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const announcement = announcementsData.find(function(a) { return a.id === this.dataset.id; }.bind(this));
            if (announcement) openAnnouncementModal(announcement);
        });
    });
    
    container.querySelectorAll('.view-announcement').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const announcement = announcementsData.find(function(a) { return a.id === this.dataset.id; }.bind(this));
            if (announcement) viewAnnouncementDetail(announcement);
        });
    });
    
    container.querySelectorAll('.delete-announcement').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const announcement = announcementsData.find(function(a) { return a.id === this.dataset.id; }.bind(this));
            if (announcement) deleteAnnouncementHandler(announcement);
        });
    });
}

function openAnnouncementModal(announcement = null) {
    const isEdit = !!announcement;
    currentAnnouncementId = announcement?.id || null;
    
    const groupOptions = groupsData.map(function(g) {
        return { value: g.id, label: g.name };
    });
    
    const fields = [
        {
            id: 'title',
            label: 'Title',
            type: 'text',
            value: announcement?.title || '',
            required: true,
            placeholder: 'e.g., Village Meeting Tomorrow'
        },
        {
            id: 'message',
            label: 'Message',
            type: 'textarea',
            value: announcement?.message || '',
            required: true,
            rows: 4,
            placeholder: 'Enter the announcement message...'
        },
        {
            id: 'sent_via',
            label: 'Send Via',
            type: 'select',
            value: announcement?.sent_via || 'sms',
            required: false,
            options: [
                { value: 'sms', label: 'SMS' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'both', label: 'Both SMS and WhatsApp' }
            ]
        },
        {
            id: 'scheduled_for',
            label: 'Schedule (optional)',
            type: 'datetime-local',
            value: announcement?.scheduled_for ? new Date(announcement.scheduled_for).toISOString().slice(0, 16) : '',
            required: false,
            helper: 'Leave blank to send immediately'
        }
    ];
    
    if (groupsData.length > 0) {
        fields.push({
            id: 'target_groups',
            label: 'Target Groups (optional)',
            type: 'select',
            value: announcement?.target_groups ? announcement.target_groups[0] || '' : '',
            required: false,
            options: [{ value: '', label: 'All Members' }].concat(groupOptions),
            helper: 'Select a group to send to, or leave blank for all members'
        });
    }
    
    showFormModal({
        title: isEdit ? 'Edit Announcement' : 'Create Announcement',
        fields: fields,
        size: 'md',
        submitLabel: isEdit ? 'Update' : 'Create',
        onSubmit: function(data, done) {
            if (!data.title || data.title.trim().length < 2) {
                showError('Please enter a title');
                return;
            }
            if (!data.message || data.message.trim().length < 2) {
                showError('Please enter a message');
                return;
            }
            
            const formattedData = {
                title: data.title.trim(),
                message: data.message.trim(),
                sent_via: data.sent_via || 'sms',
                scheduled_for: data.scheduled_for ? new Date(data.scheduled_for).toISOString() : null,
                target_groups: data.target_groups ? [data.target_groups] : null
            };
            
            saveAnnouncement(formattedData, isEdit, done);
        }
    });
}

async function saveAnnouncement(data, isEdit, done) {
    try {
        if (isEdit && currentAnnouncementId) {
            await updateAnnouncement(currentAnnouncementId, data);
            showSuccess('Announcement updated successfully');
        } else {
            await createAnnouncement(data);
            showSuccess('Announcement created successfully');
        }
        currentAnnouncementId = null;
        done();
        await loadAnnouncements();
    } catch (error) {
        showError(error.message || 'Failed to save announcement');
    }
}

async function sendAnnouncementHandler(announcement) {
    showConfirm({
        title: 'Send Announcement',
        message: 'Send "' + announcement.title + '" to all members now?',
        confirmLabel: 'Send Now',
        confirmClass: 'btn-success',
        onConfirm: function(done) {
            sendAnnouncement(announcement.id)
                .then(function() {
                    showSuccess('Announcement sent successfully!');
                    done();
                    loadAnnouncements();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to send announcement');
                });
        }
    });
}

function viewAnnouncementDetail(announcement) {
    showModal({
        title: announcement.title,
        content: `
            <div style="margin-bottom:12px;">
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                    <span class="badge badge-${announcement.status === 'sent' ? 'success' : 'gray'}">${announcement.status}</span>
                    <span class="badge badge-gray">${announcement.sent_via || 'SMS'}</span>
                </div>
                <div style="white-space:pre-wrap;background:var(--gray-50);padding:16px;border-radius:var(--radius-md);font-size:var(--font-size-sm);line-height:1.8;">
                    ${announcement.message}
                </div>
                <div style="font-size:var(--font-size-xs);color:var(--gray-500);margin-top:8px;">
                    <div>Created: ${new Date(announcement.created_at).toLocaleString()}</div>
                    ${announcement.scheduled_for ? '<div>Scheduled: ' + new Date(announcement.scheduled_for).toLocaleString() + '</div>' : ''}
                    ${announcement.sent_at ? '<div>Sent: ' + new Date(announcement.sent_at).toLocaleString() + '</div>' : ''}
                    <div>Delivered to ${announcement.delivery_count || 0} members</div>
                </div>
            </div>
        `,
        size: 'md',
        buttons: [
            {
                label: 'Close',
                action: 'close',
                class: 'btn-outline',
                onClick: function(done) { done(); }
            }
        ]
    });
}

async function deleteAnnouncementHandler(announcement) {
    showConfirm({
        title: 'Delete Announcement',
        message: 'Delete "' + announcement.title + '"? This cannot be undone.',
        confirmLabel: 'Delete',
        confirmClass: 'btn-danger',
        onConfirm: function(done) {
            deleteAnnouncement(announcement.id)
                .then(function() {
                    showSuccess('Announcement deleted');
                    done();
                    loadAnnouncements();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to delete announcement');
                });
        }
    });
}

window.renderAnnouncements = renderAnnouncements;

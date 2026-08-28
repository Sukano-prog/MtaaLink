/* ============================================================
   MtaaLink - Events Page (No Emojis)
   ============================================================ */

import { getEvents, getEvent, createEvent, updateEvent, deleteEvent, addEventAttendance, addEventContribution, getMembers } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { Skeletons } from "../components/skeleton.js";
import { showFormModal, showConfirm, showModal } from '../components/modal.js';

let searchQuery = "";
let eventsData = [];
let membersData = [];
let currentEventId = null;

const EVENT_TYPES = [
    { value: 'funeral', label: 'Funeral' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'harambee', label: 'Harambee' },
    { value: 'community_work', label: 'Community Work' },
    { value: 'church', label: 'Church Event' },
    { value: 'celebration', label: 'Celebration' },
    { value: 'fundraiser', label: 'Fundraiser' },
    { value: 'other', label: 'Other' }
];

const EVENT_TYPE_LABELS = {
    funeral: 'Funeral',
    wedding: 'Wedding',
    harambee: 'Harambee',
    community_work: 'Community Work',
    church: 'Church',
    celebration: 'Celebration',
    fundraiser: 'Fundraiser',
    other: 'Other'
};

export async function renderEvents() {
    const content = document.getElementById('pageContent');
    
    try {
        membersData = await getMembers().catch(() => []);
        
        content.innerHTML = `
            <div class="page-header">
                <h2>Community Events</h2>
                <button class="btn btn-primary" id="addEventBtn">Create Event</button>
            </div>
            
            <div class="filter-bar">
                <div class="search-box">
                    <input type="text" id="searchEvents" class="form-control" placeholder="Search events...">
                </div>
                <div class="filter-box">
                    <select id="typeFilter" class="form-control form-select">
                        <option value="">All Types</option>
                        ${EVENT_TYPES.map(function(t) {
                            return `<option value="${t.value}">${t.label}</option>`;
                        }).join('')}
                    </select>
                </div>
                <div class="filter-box">
                    <select id="statusFilter" class="form-control form-select">
                        <option value="">All Status</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <span class="event-count" id="eventCount">0 events</span>
            </div>
            
            <div id="eventsContainer">
                ${Skeletons.projects()}
            </div>
        `;
        
        document.getElementById('addEventBtn').addEventListener('click', function() {
            openEventModal();
        });
        
        document.getElementById('typeFilter').addEventListener('change', function() {
            filterEvents();
        });
        
        document.getElementById('statusFilter').addEventListener('change', function() {
            filterEvents();
        });
        
        document.getElementById('searchEvents').addEventListener('input', function(e) {
            searchQuery = e.target.value.trim();
            loadEvents();
        });
        
        await loadEvents();
        
    } catch (error) {
        content.innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load events: ${error.message}</p>
                <button class="btn btn-primary" onclick="renderEvents()">Retry</button>
            </div></div>
        `;
    }
}

async function loadEvents() {
    try {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        eventsData = await getEvents(params);
        renderEventsList();
        document.getElementById('eventCount').textContent = eventsData.length + ' events';
    } catch (error) {
        document.getElementById('eventsContainer').innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load events: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadEvents()">Retry</button>
            </div></div>
        `;
    }
}

function filterEvents() {
    const type = document.getElementById('typeFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    let filtered = eventsData;
    
    if (type) {
        filtered = filtered.filter(function(e) {
            return e.event_type === type;
        });
    }
    
    if (status) {
        filtered = filtered.filter(function(e) {
            return e.status === status;
        });
    }
    
    renderEventsList(filtered);
    document.getElementById('eventCount').textContent = filtered.length + ' events';
}

function renderEventsList(filtered = null) {
    const container = document.getElementById('eventsContainer');
    const events = filtered !== null ? filtered : eventsData;
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <div class="empty-state">
                    <p class="text-muted">No events found</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addEventBtn').click()">
                        Create your first event
                    </button>
                </div>
            </div></div>
        `;
        return;
    }
    
    const statusColors = {
        upcoming: 'badge-primary',
        ongoing: 'badge-warning',
        completed: 'badge-success',
        cancelled: 'badge-danger'
    };
    
    let html = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">`;
    
    events.forEach(function(e) {
        const statusBadge = statusColors[e.status] || 'badge-gray';
        const typeLabel = EVENT_TYPE_LABELS[e.event_type] || e.event_type;
        const totalContrib = e.total_contributions || 0;
        
        html += `
            <div class="card">
                <div class="card-body">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div>
                            <h4 style="margin:0;">${e.title}</h4>
                            <span style="font-size:var(--font-size-xs);color:var(--gray-400);">${typeLabel}</span>
                        </div>
                        <span class="badge ${statusBadge}">${e.status || 'upcoming'}</span>
                    </div>
                    <div style="font-size:var(--font-size-sm);color:var(--gray-500);margin-top:6px;">
                        ${e.description || 'No description'}
                    </div>
                    <div style="margin-top:8px;font-size:var(--font-size-sm);color:var(--gray-500);">
                        <div>Date: ${e.date}</div>
                        ${e.location ? `<div>Venue: ${e.location}</div>` : ''}
                        <div>Attendees: ${e.attendance_count || 0}</div>
                        <div>Contributions: KES ${(totalContrib).toLocaleString()}</div>
                    </div>
                    <div style="font-size:var(--font-size-xs);color:var(--gray-400);margin-top:4px;">
                        ${e.organizer_name ? 'Organizer: ' + e.organizer_name : ''}
                    </div>
                    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary view-event" data-id="${e.id}">View Details</button>
                        <button class="btn btn-sm btn-outline edit-event" data-id="${e.id}">Edit</button>
                        ${e.status === 'upcoming' || e.status === 'ongoing' ? `
                            <button class="btn btn-sm btn-info manage-attendance" data-id="${e.id}">Attendance</button>
                            <button class="btn btn-sm btn-success manage-contributions" data-id="${e.id}">Contributions</button>
                        ` : ''}
                        ${e.status === 'upcoming' ? `
                            <button class="btn btn-sm btn-danger delete-event" data-id="${e.id}">Delete</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.view-event').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const event = eventsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (event) viewEventDetail(event);
        });
    });
    
    container.querySelectorAll('.edit-event').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const event = eventsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (event) openEventModal(event);
        });
    });
    
    container.querySelectorAll('.manage-attendance').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const event = eventsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (event) manageAttendanceModal(event);
        });
    });
    
    container.querySelectorAll('.manage-contributions').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const event = eventsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (event) manageContributionsModal(event);
        });
    });
    
    container.querySelectorAll('.delete-event').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const event = eventsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (event) deleteEventHandler(event);
        });
    });
}

function viewEventDetail(event) {
    getEvent(event.id)
        .then(function(detail) {
            const attendanceList = (detail.attendance || []).map(function(a) {
                return `<div style="padding:4px 0;border-bottom:1px dotted var(--gray-100);font-size:var(--font-size-sm);">
                    ${a.member_name} ${a.role ? '(' + a.role + ')' : ''}
                </div>`;
            }).join('');
            
            const contribList = (detail.contributions || []).map(function(c) {
                const amount = c.amount ? 'KES ' + c.amount.toLocaleString() : '';
                return `<div style="padding:4px 0;border-bottom:1px dotted var(--gray-100);font-size:var(--font-size-sm);">
                    ${c.member_name || 'Anonymous'}: ${c.contribution_type} ${amount} ${c.description || ''}
                </div>`;
            }).join('');
            
            showModal({
                title: event.title,
                content: `
                    <div style="margin-bottom:12px;">
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                            <span class="badge badge-${event.status}">${event.status}</span>
                            <span class="badge badge-gray">${event.event_type}</span>
                        </div>
                        <p>${event.description || 'No description'}</p>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:var(--font-size-sm);">
                            <div><strong>Date:</strong> ${event.date}</div>
                            <div><strong>Location:</strong> ${event.location || 'Not specified'}</div>
                            <div><strong>Organizer:</strong> ${event.organizer_name || 'Not specified'}</div>
                            <div><strong>Total Contributions:</strong> KES ${(detail.total_contributions || 0).toLocaleString()}</div>
                        </div>
                        ${detail.attendance && detail.attendance.length > 0 ? `
                            <div style="margin-top:12px;border-top:1px solid var(--gray-200);padding-top:12px;">
                                <strong>Attendance (${detail.attendance.length})</strong>
                                ${attendanceList}
                            </div>
                        ` : ''}
                        ${detail.contributions && detail.contributions.length > 0 ? `
                            <div style="margin-top:12px;border-top:1px solid var(--gray-200);padding-top:12px;">
                                <strong>Contributions (${detail.contributions.length})</strong>
                                ${contribList}
                            </div>
                        ` : ''}
                    </div>
                `,
                size: 'lg',
                buttons: [
                    {
                        label: 'Close',
                        action: 'close',
                        class: 'btn-outline',
                        onClick: function(done) { done(); }
                    }
                ]
            });
        })
        .catch(function() {
            showError('Failed to load event details');
        });
}

function manageAttendanceModal(event) {
    const memberOptions = membersData.map(function(m) {
        return { value: m.id, label: m.full_name || m.first_name + ' ' + m.last_name };
    });
    
    showFormModal({
        title: 'Add Attendee - ' + event.title,
        size: 'md',
        submitLabel: 'Add Attendee',
        fields: [
            {
                id: 'member_id',
                label: 'Member',
                type: 'select',
                value: '',
                required: true,
                options: [{ value: '', label: 'Select member...' }].concat(memberOptions)
            },
            {
                id: 'role',
                label: 'Role (optional)',
                type: 'select',
                value: '',
                required: false,
                options: [
                    { value: '', label: 'None' },
                    { value: 'organizer', label: 'Organizer' },
                    { value: 'volunteer', label: 'Volunteer' },
                    { value: 'elder', label: 'Elder' },
                    { value: 'guest', label: 'Guest' }
                ]
            }
        ],
        onSubmit: function(data, done) {
            if (!data.member_id) {
                showError('Please select a member');
                return;
            }
            
            addEventAttendance(event.id, data.member_id, data.role || null)
                .then(function() {
                    showSuccess('Attendance recorded!');
                    done();
                    loadEvents();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to record attendance');
                });
        }
    });
}

function manageContributionsModal(event) {
    const memberOptions = [{ value: '', label: 'Anonymous' }];
    membersData.forEach(function(m) {
        memberOptions.push({ value: m.id, label: m.full_name || m.first_name + ' ' + m.last_name });
    });
    
    const contributionTypes = [
        { value: 'money', label: 'Money' },
        { value: 'food', label: 'Food' },
        { value: 'materials', label: 'Materials' },
        { value: 'transport', label: 'Transport' },
        { value: 'other', label: 'Other' }
    ];
    
    showFormModal({
        title: 'Record Contribution - ' + event.title,
        size: 'md',
        submitLabel: 'Record Contribution',
        fields: [
            {
                id: 'member_id',
                label: 'Contributor',
                type: 'select',
                value: '',
                required: false,
                options: memberOptions
            },
            {
                id: 'contribution_type',
                label: 'Contribution Type',
                type: 'select',
                value: 'money',
                required: true,
                options: contributionTypes
            },
            {
                id: 'amount',
                label: 'Amount (KES - for money contributions)',
                type: 'number',
                value: '',
                required: false,
                placeholder: '0.00'
            },
            {
                id: 'description',
                label: 'Description (food, materials, etc.)',
                type: 'text',
                value: '',
                required: false,
                placeholder: 'e.g., 2kg rice, cement bags'
            }
        ],
        onSubmit: function(data, done) {
            if (!data.contribution_type) {
                showError('Please select a contribution type');
                return;
            }
            
            const formattedData = {
                member_id: data.member_id || null,
                contribution_type: data.contribution_type,
                amount: parseFloat(data.amount) || null,
                description: data.description || null
            };
            
            addEventContribution(event.id, formattedData)
                .then(function() {
                    showSuccess('Contribution recorded!');
                    done();
                    loadEvents();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to record contribution');
                });
        }
    });
}

function openEventModal(event = null) {
    const isEdit = !!event;
    currentEventId = event?.id || null;
    
    const memberOptions = membersData.map(function(m) {
        return { value: m.id, label: m.full_name || m.first_name + ' ' + m.last_name };
    });
    
    const statusOptions = [
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'ongoing', label: 'Ongoing' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];
    
    const fields = [
        {
            id: 'title',
            label: 'Event Title',
            type: 'text',
            value: event?.title || '',
            required: true,
            placeholder: 'e.g., Funeral of Mama Sarah'
        },
        {
            id: 'event_type',
            label: 'Event Type',
            type: 'select',
            value: event?.event_type || '',
            required: true,
            options: EVENT_TYPES
        },
        {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            value: event?.description || '',
            required: false,
            rows: 3,
            placeholder: 'Brief description of the event...'
        },
        {
            id: 'date',
            label: 'Date',
            type: 'date',
            value: event?.date || '',
            required: true
        },
        {
            id: 'location',
            label: 'Location',
            type: 'text',
            value: event?.location || '',
            required: false,
            placeholder: 'e.g., Organization Hall, Family Home'
        },
        {
            id: 'organizer',
            label: 'Organizer',
            type: 'select',
            value: event?.organizer || '',
            required: false,
            options: [{ value: '', label: 'Select organizer...' }].concat(memberOptions)
        },
        {
            id: 'notes',
            label: 'Notes',
            type: 'textarea',
            value: event?.notes || '',
            required: false,
            rows: 2,
            placeholder: 'Any additional notes...'
        },
        {
            id: 'status',
            label: 'Status',
            type: 'select',
            value: event?.status || 'upcoming',
            required: true,
            options: statusOptions
        }
    ];
    
    showFormModal({
        title: isEdit ? 'Edit Event' : 'Create Event',
        fields: fields,
        size: 'md',
        submitLabel: isEdit ? 'Update' : 'Create',
        onSubmit: function(data, done) {
            if (!data.date) {
                showError('Please select a date');
                return;
            }
            
            const formattedData = {
                title: data.title,
                event_type: data.event_type,
                description: data.description || null,
                date: data.date,
                location: data.location || null,
                organizer: data.organizer || null,
                notes: data.notes || null,
                status: data.status || 'upcoming'
            };
            
            saveEvent(formattedData, isEdit, done);
        }
    });
}

async function saveEvent(data, isEdit, done) {
    try {
        if (isEdit && currentEventId) {
            await updateEvent(currentEventId, data);
            showSuccess('Event updated successfully');
        } else {
            await createEvent(data);
            showSuccess('Event created successfully');
        }
        currentEventId = null;
        done();
        await loadEvents();
    } catch (error) {
        showError(error.message || 'Failed to save event');
    }
}

async function deleteEventHandler(event) {
    showConfirm({
        title: 'Delete Event',
        message: 'Delete "' + event.title + '"? This will also remove all attendance and contribution records.',
        confirmLabel: 'Delete',
        confirmClass: 'btn-danger',
        onConfirm: function(done) {
            deleteEvent(event.id)
                .then(function() {
                    showSuccess('Event deleted');
                    done();
                    loadEvents();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to delete event');
                });
        }
    });
}

window.renderEvents = renderEvents;

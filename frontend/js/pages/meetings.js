/* ============================================================
   MtaaLink - Meetings Page
   ============================================================ */

import { getMeetings, getMeeting, createMeeting, updateMeeting, deleteMeeting, startMeeting, completeMeeting } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { Skeletons } from '../components/skeleton.js';
import { showFormModal, showConfirm, showModal } from '../components/modal.js';

let searchQuery = "";
let meetingsData = [];
let currentMeetingId = null;

const MEETING_TYPES = [
    { value: 'general', label: 'General Meeting' },
    { value: 'baraza', label: 'Baraza (Organization Assembly)' },
    { value: 'committee', label: 'Committee Meeting' },
    { value: 'emergency', label: 'Emergency Meeting' },
    { value: 'election', label: 'Election Meeting' },
    { value: 'planning', label: 'Planning Meeting' },
    { value: 'special', label: 'Special Meeting' },
    { value: 'annual_general', label: 'Annual General Meeting' }
];

export async function renderMeetings() {
    const content = document.getElementById('pageContent');
    
    content.innerHTML = `
        <div class="page-header">
            <h2>Meetings</h2>
            <button class="btn btn-primary" id="addMeetingBtn">Schedule Meeting</button>
        </div>
        
        <div class="filter-bar">
            <div class="search-box">
                <input type="text" id="searchMeetings" class="form-control" placeholder="Search meetings...">
            </div>
            <div class="filter-box">
                <select id="statusFilter" class="form-control form-select">
                    <option value="">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            <span class="meeting-count" id="meetingCount">0 meetings</span>
        </div>
        
        <div id="meetingsContainer">
            ${Skeletons.meetings()}
        </div>
    `;
    
    document.getElementById('addMeetingBtn').addEventListener('click', function() {
        openMeetingModal();
    });
    
    document.getElementById('searchMeetings').addEventListener('input', function() {
        filterMeetings();
    });
    
    document.getElementById('statusFilter').addEventListener('change', function() {
        filterMeetings();
    });
    
    await loadMeetings();
}

async function loadMeetings() {
    try {
        meetingsData = await getMeetings();
        renderMeetingsList();
        document.getElementById('meetingCount').textContent = meetingsData.length + ' meetings';
    } catch (error) {
        document.getElementById('meetingsContainer').innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="empty-state">
                        <p style="color:var(--danger);">Failed to load meetings: ${error.message}</p>
                        <button class="btn btn-primary" onclick="loadMeetings()">Retry</button>
                    </div>
                </div>
            </div>
        `;
    }
}

function filterMeetings() {
    const search = document.getElementById('searchMeetings').value.toLowerCase().trim();
    const status = document.getElementById('statusFilter').value;
    
    let filtered = meetingsData;
    
    if (search) {
        filtered = filtered.filter(function(m) {
            return m.title.toLowerCase().includes(search);
        });
    }
    
    if (status) {
        filtered = filtered.filter(function(m) {
            return m.status === status;
        });
    }
    
    renderMeetingsList(filtered);
    document.getElementById('meetingCount').textContent = filtered.length + ' meetings';
}

function renderMeetingsList(filtered = null) {
    const container = document.getElementById('meetingsContainer');
    const meetings = filtered !== null ? filtered : meetingsData;
    
    if (meetings.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="empty-state">
                        <p class="text-muted">No meetings found</p>
                        <button class="btn btn-primary" onclick="document.getElementById('addMeetingBtn').click()">
                            Schedule your first meeting
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    meetings.sort(function(a, b) {
        return new Date(a.date) - new Date(b.date);
    });
    
    let html = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;">`;
    
    meetings.forEach(function(meeting) {
        const statusColors = {
            scheduled: 'badge-primary',
            ongoing: 'badge-warning',
            completed: 'badge-success',
            cancelled: 'badge-danger'
        };
        const statusBadge = statusColors[meeting.status] || 'badge-gray';
        
        const typeLabel = MEETING_TYPES.find(function(t) { return t.value === meeting.meeting_type; });
        const typeDisplay = typeLabel ? typeLabel.label : (meeting.meeting_type || 'General');
        
        const isClickable = meeting.status === 'ongoing' || meeting.status === 'completed';
        const cursorStyle = isClickable ? 'cursor:pointer;' : '';
        const clickHandler = isClickable ? `onclick="openMeetingDetail('${meeting.id}')"` : '';
        
        const showEdit = meeting.status === 'scheduled';
        const showDelete = meeting.status === 'scheduled';
        const showStart = meeting.status === 'scheduled';
        const showComplete = meeting.status === 'ongoing';
        const showView = true;
        
        html += `
            <div class="card" style="${cursorStyle}" ${clickHandler}>
                <div class="card-body">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div>
                            <h4 style="margin:0;">${meeting.title}</h4>
                            <span style="font-size:var(--font-size-xs);color:var(--gray-400);">${typeDisplay}</span>
                        </div>
                        <span class="badge ${statusBadge}">${meeting.status}</span>
                    </div>
                    <div style="font-size:var(--font-size-sm);color:var(--gray-500);margin-top:8px;">
                        <div>${meeting.date} at ${meeting.time}</div>
                        <div>${meeting.location || 'Organization Hall'}</div>
                        <div>${meeting.attendance_count || 0} attending</div>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                        ${showView ? `
                            <button class="btn btn-sm btn-primary view-meeting" data-id="${meeting.id}" onclick="event.stopPropagation();">View Details</button>
                        ` : ''}
                        ${showStart ? `
                            <button class="btn btn-sm btn-success start-meeting" data-id="${meeting.id}" onclick="event.stopPropagation();">Start</button>
                        ` : ''}
                        ${showComplete ? `
                            <button class="btn btn-sm btn-success" onclick="event.stopPropagation();completeMeetingAction('${meeting.id}')">Complete</button>
                        ` : ''}
                        ${showEdit ? `
                            <button class="btn btn-sm btn-outline edit-meeting" data-id="${meeting.id}" onclick="event.stopPropagation();">Edit</button>
                        ` : ''}
                        ${showDelete ? `
                            <button class="btn btn-sm btn-danger delete-meeting" data-id="${meeting.id}" onclick="event.stopPropagation();">Delete</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.view-meeting').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            viewMeeting(this.dataset.id);
        });
    });
    
    container.querySelectorAll('.start-meeting').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            startMeetingAction(this.dataset.id);
        });
    });
    
    container.querySelectorAll('.edit-meeting').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const meetingId = this.dataset.id;
            const meeting = meetingsData.find(function(m) { return m.id === meetingId; });
            if (meeting) {
                openMeetingModal(meeting);
            } else {
                showError('Meeting not found');
            }
        });
    });
    
    container.querySelectorAll('.delete-meeting').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteMeetingHandler(this.dataset.id);
        });
    });
}

window.openMeetingDetail = function(meetingId) {
    import('./meeting_detail.js').then(function(module) {
        module.renderMeetingDetail(meetingId);
    }).catch(function(error) {
            if (error.message && error.message.includes("offline")) {
                showToast("You are offline. Please connect to the internet and try again.", "warning");
                return;
            }
        showError('Failed to load meeting detail');
    });
};

function openMeetingModal(meeting = null) {
    const isEdit = !!meeting;
    currentMeetingId = meeting?.id || null;
    
    const existingAgenda = meeting?.agenda || '';
    const existingType = meeting?.meeting_type || 'general';
    
    const typeOptions = MEETING_TYPES.map(function(t) {
        return { value: t.value, label: t.label };
    });
    
    const fields = [
        {
            id: 'mfTitle',
            label: 'Meeting Title',
            type: 'text',
            value: meeting?.title || '',
            required: true,
            placeholder: 'e.g., Monthly Organization Baraza'
        },
        {
            id: 'mfType',
            label: 'Meeting Type (enter any type)',
            type: 'text',
            value: existingType,
            required: false,
            placeholder: 'e.g., Baraza, Committee, Emergency, Harambee...',
            helper: 'Enter any meeting type - be as specific as you want'
        },
        {
            id: 'mfDate',
            label: 'Date',
            type: 'date',
            value: meeting?.date || '',
            required: true
        },
        {
            id: 'mfTime',
            label: 'Time',
            type: 'time',
            value: meeting?.time || '14:00',
            required: true
        },
        {
            id: 'mfLocation',
            label: 'Location',
            type: 'text',
            value: meeting?.location || '',
            required: false,
            placeholder: 'Organization Hall'
        },
        {
            id: 'mfAgenda',
            label: 'Agenda',
            type: 'textarea',
            value: existingAgenda,
            required: false,
            placeholder: '1. Opening Prayer\n2. Reading of Minutes\n3. Main Business\n4. Any Other Business',
            rows: 6,
            helper: isEdit ? 'Existing agenda is shown below. Add new items at the bottom.' : ''
        },
        {
            id: 'mfQuorum',
            label: 'Quorum Required',
            type: 'number',
            value: meeting?.quorum_required || 10,
            required: false,
            helper: 'Minimum number of members required for the meeting to proceed'
        }
    ];
    
    if (isEdit) {
        fields.push({
            id: 'mfStatus',
            label: 'Status',
            type: 'select',
            value: meeting?.status || 'scheduled',
            required: false,
            options: [
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
            ]
        });
    }
    
    showFormModal({
        title: isEdit ? 'Edit Meeting' : 'Schedule Meeting',
        fields: fields,
        size: 'md',
        submitLabel: isEdit ? 'Update' : 'Schedule',
        onSubmit: function(data, done) {
            let timeValue = data.mfTime;
            if (timeValue && !timeValue.includes(':')) {
                timeValue = timeValue + ':00';
            } else if (timeValue && timeValue.split(':').length === 2) {
                timeValue = timeValue + ':00';
            }
            
            let agendaValue = data.mfAgenda || '';
            agendaValue = agendaValue.replace(/\n+$/, '');
            
            const formattedData = {
                title: data.mfTitle,
                meeting_type: data.mfType || 'General',
                date: data.mfDate,
                time: timeValue,
                location: data.mfLocation || null,
                agenda: agendaValue || null,
                quorum_required: parseInt(data.mfQuorum) || 10
            };
            
            if (isEdit && data.mfStatus) {
                formattedData.status = data.mfStatus;
            }
            
            saveMeeting(formattedData, done);
        },
        onCancel: function() {
            currentMeetingId = null;
        }
    });
}

async function saveMeeting(data, done) {
    try {
        if (currentMeetingId) {
            await updateMeeting(currentMeetingId, data);
            showSuccess('Meeting updated successfully');
        } else {
            await createMeeting(data);
            showSuccess('Meeting scheduled successfully');
        }
        currentMeetingId = null;
        done();
        await loadMeetings();
    } catch (error) {
        showError(error.message || 'Failed to save meeting');
    }
}

async function startMeetingAction(meetingId) {
    showConfirm({
        title: 'Start Meeting',
        message: 'Ready to start this meeting?',
        confirmLabel: 'Start Now',
        confirmClass: 'btn-success',
        onConfirm: function(done) {
            startMeeting(meetingId)
                .then(function() {
                    showSuccess('Meeting started!');
                    done();
                    loadMeetings();
                })
                .catch(function(error) {
            if (error.message && error.message.includes("offline")) {
                showToast("You are offline. Please connect to the internet and try again.", "warning");
                return;
            }
                    showError(error.message || 'Failed to start meeting');
                });
        }
    });
}

async function completeMeetingAction(meetingId) {
    showModal({
        title: 'Complete Meeting',
        content: `
            <form id="minutesForm">
                <div class="form-group">
                    <label for="minutesContent">Meeting Minutes <span class="required">*</span></label>
                    <textarea id="minutesContent" class="form-control" rows="6" placeholder="Record the minutes of the meeting..."></textarea>
                    <div class="form-helper">Include key discussions, decisions, and any motions passed</div>
                </div>
            </form>
        `,
        size: 'md',
        buttons: [
            {
                label: 'Cancel',
                action: 'cancel',
                class: 'btn-outline',
                onClick: function(done) { done(); }
            },
            {
                label: 'Complete & Save Minutes',
                action: 'complete',
                class: 'btn-primary',
                onClick: function(done) {
                    const minutes = document.getElementById('minutesContent').value.trim();
                    if (!minutes) {
                        showError('Please enter the meeting minutes');
                        return;
                    }
                    completeMeeting(meetingId, minutes)
                        .then(function() {
                            showSuccess('Meeting completed! Minutes saved.');
                            done();
                            loadMeetings();
                        })
                        .catch(function(error) {
            if (error.message && error.message.includes("offline")) {
                showToast("You are offline. Please connect to the internet and try again.", "warning");
                return;
            }
                            showError(error.message || 'Failed to complete meeting');
                        });
                }
            }
        ]
    });
}

function viewMeeting(meetingId) {
    const meeting = meetingsData.find(function(m) { return m.id === meetingId; });
    if (!meeting) {
        showError('Meeting not found');
        return;
    }
    
    const statusColors = {
        scheduled: 'badge-primary',
        ongoing: 'badge-warning',
        completed: 'badge-success',
        cancelled: 'badge-danger'
    };
    const statusBadge = statusColors[meeting.status] || 'badge-gray';
    
    showModal({
        title: meeting.title,
        content: `
            <div style="margin-bottom:16px;">
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                    <span class="badge ${statusBadge}">${meeting.status}</span>
                    <span class="badge badge-gray">${meeting.meeting_type || 'General'}</span>
                </div>
                <div style="font-size:var(--font-size-sm);color:var(--gray-500);">
                    <div>${meeting.date} at ${meeting.time}</div>
                    <div>${meeting.location || 'Organization Hall'}</div>
                    <div>${meeting.attendance_count || 0} attending</div>
                    <div>Quorum: ${meeting.quorum_required || 10}</div>
                </div>
                ${meeting.agenda ? `
                    <div style="margin-top:12px;padding:12px;background:var(--gray-50);border-radius:var(--radius-md);">
                        <strong>Agenda</strong>
                        <div style="white-space:pre-wrap;font-size:var(--font-size-sm);margin-top:4px;">${meeting.agenda}</div>
                    </div>
                ` : ''}
            </div>
        `,
        size: 'md',
        buttons: [
            {
                label: 'Close',
                action: 'close',
                class: 'btn-primary',
                onClick: function(done) { done(); }
            }
        ]
    });
}

async function deleteMeetingHandler(meetingId) {
    const meeting = meetingsData.find(function(m) { return m.id === meetingId; });
    const title = meeting ? meeting.title : 'this meeting';
    
    showConfirm({
        title: 'Delete Meeting',
        message: 'Are you sure you want to delete "' + title + '"? This action cannot be undone.',
        confirmLabel: 'Delete',
        confirmClass: 'btn-danger',
        onConfirm: function(done) {
            deleteMeeting(meetingId)
                .then(function() {
                    showSuccess('Meeting deleted successfully');
                    done();
                    loadMeetings();
                })
                .catch(function(error) {
            if (error.message && error.message.includes("offline")) {
                showToast("You are offline. Please connect to the internet and try again.", "warning");
                return;
            }
                    showError(error.message || 'Failed to delete meeting');
                });
        }
    });
}

window.renderMeetings = renderMeetings;
window.completeMeetingAction = completeMeetingAction;
window.openMeetingDetail = window.openMeetingDetail;


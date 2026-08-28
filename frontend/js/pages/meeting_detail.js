/* ============================================================
   Management System - Meeting Detail Page (Fixed - No Edit for Ongoing/Completed)
   ============================================================ */

import { getMeeting, updateMeeting, startMeeting, completeMeeting, markAttendance, getMembers } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showModal, showConfirm, showFormModal } from '../components/modal.js';

let searchQuery = "";
let currentMeeting = null;
let currentAttendance = [];
let currentMembers = [];
let attendanceCache = {};

export async function renderMeetingDetail(meetingId) {
    const content = document.getElementById('pageContent');
    
    try {
        try {
            currentMembers = await getMembers();
        } catch (e) {
            currentMembers = [];
        }
        
        const data = await getMeeting(meetingId);
        currentMeeting = data.meeting;
        currentAttendance = data.attendance || [];
        
        attendanceCache = {};
        currentAttendance.forEach(function(a) {
            attendanceCache[a.member_id] = {
                attended: a.attended,
                attendance_type: a.attendance_type || (a.attended ? 'present' : 'absent')
            };
        });
        
        renderMeetingContent(data);
        
    } catch (error) {
        content.innerHTML = `
            <div class="loading-state">
                <p style="color:var(--danger);">Failed to load meeting: ${error.message}</p>
                <button class="btn btn-primary" onclick="renderMeetingDetail('${meetingId}')">Retry</button>
                <button class="btn btn-outline" onclick="navigateTo('meetings')">Back</button>
            </div>
        `;
    }
}

function renderMeetingContent(data) {
    const meeting = data.meeting;
    const attendance = data.attendance || [];
    const presentCount = data.present_count || 0;
    
    let agendaItems = [];
    if (meeting.agenda) {
        agendaItems = meeting.agenda.split('\n')
            .filter(function(line) { return line.trim() !== ''; })
            .map(function(line) { return line.trim(); });
    }
    
    const userRole = localStorage.getItem('role') || 'member';
    const canManage = userRole === 'admin' || userRole === 'secretary' || userRole === 'elder' || userRole === 'chairperson';
    
    const statusColors = {
        scheduled: 'badge-primary',
        ongoing: 'badge-warning',
        completed: 'badge-success',
        cancelled: 'badge-danger'
    };
    const statusBadge = statusColors[meeting.status] || 'badge-gray';
    
    const content = document.getElementById('pageContent');
    
    const presentMembers = attendance.filter(function(a) { return a.attended && a.attendance_type === 'present'; });
    const excusedMembers = attendance.filter(function(a) { return a.attendance_type === 'excused'; });
    const absentMembers = attendance.filter(function(a) { return !a.attended && a.attendance_type !== 'excused'; });
    
    const isCompleted = meeting.status === 'completed';
    const isOngoing = meeting.status === 'ongoing';
    const isScheduled = meeting.status === 'scheduled';
    
    let minutesContent = meeting.minutes || '';
    minutesContent = minutesContent.trim();
    
    let html = `
        <div style="margin-bottom:16px;">
            <button class="btn btn-outline" onclick="navigateTo('meetings')">← Back to Meetings</button>
            ${isCompleted ? `
                <button class="btn btn-primary" onclick="window.printMeetingMinutes('${meeting.id}')" style="float:right;">Print Complete Report</button>
            ` : ''}
        </div>
        
        <div class="card">
            <div class="card-body">
                <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                    <div>
                        <h2 style="margin:0;">${meeting.title}</h2>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
                            <span class="badge ${statusBadge}">${meeting.status.toUpperCase()}</span>
                            <span class="badge badge-gray">${meeting.meeting_type || 'General'}</span>
                            ${meeting.meeting_number ? `<span class="badge badge-gray">#${meeting.meeting_number}</span>` : ''}
                            ${isOngoing ? '<span class="badge badge-warning">LIVE</span>' : ''}
                        </div>
                        <div style="font-size:var(--font-size-sm);color:var(--gray-500);margin-top:8px;">
                            <div>${meeting.date} at ${meeting.time}</div>
                            <div>${meeting.location || 'Organization Hall'}</div>
                            <div>Chairperson: ${meeting.chairperson_name || 'Not assigned'}</div>
                            <div>Secretary: ${meeting.secretary_name || 'Not assigned'}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:var(--font-size-sm);color:var(--gray-500);">Quorum: ${meeting.quorum_required}</div>
                        <div style="font-size:var(--font-size-lg);font-weight:600;color:${presentCount >= meeting.quorum_required ? 'var(--success)' : 'var(--danger)'};">
                            ${presentCount} / ${meeting.quorum_required}
                            ${presentCount >= meeting.quorum_required ? '✓' : '✗'}
                        </div>
                        <div style="font-size:var(--font-size-sm);color:var(--gray-500);">${presentCount} present</div>
                    </div>
                </div>
                
                ${canManage ? `
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--gray-200);">
                        ${isScheduled ? `
                            <button class="btn btn-success" onclick="window.startMeetingAction('${meeting.id}')">Start Meeting</button>
                            <button class="btn btn-outline" onclick="window.openEditMeetingModal('${meeting.id}')">Edit</button>
                        ` : ''}
                        ${isOngoing ? `
                            <button class="btn btn-primary" onclick="window.openAttendanceModal('${meeting.id}')">Mark Attendance</button>
                            <button class="btn btn-success" onclick="window.completeMeetingAction('${meeting.id}')">Complete Meeting</button>
                        ` : ''}
                        ${isCompleted ? `
                            <button class="btn btn-primary" onclick="window.viewMinutesFull('${meeting.id}')">View Minutes</button>
                            <button class="btn btn-success" onclick="window.printMeetingMinutes('${meeting.id}')">Print Complete Report</button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        </div>
        
        <!-- Agenda -->
        ${agendaItems.length > 0 ? `
            <div class="card">
                <div class="card-header">
                    <h3>Agenda</h3>
                    ${canManage && isOngoing ? `
                        <button class="btn btn-sm btn-primary" onclick="window.addAgendaItemLive('${meeting.id}')">+ Add</button>
                    ` : ''}
                </div>
                <div class="card-body">
                    <div style="font-size:var(--font-size-sm);">
                        ${agendaItems.map(function(item, index) {
                            return `<div style="padding:3px 0;border-bottom:1px dotted var(--gray-100);margin:0;">${index + 1}. ${item}</div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        ` : `
            <div class="card">
                <div class="card-header">
                    <h3>Agenda</h3>
                    ${canManage && isOngoing ? `
                        <button class="btn btn-sm btn-primary" onclick="window.addAgendaItemLive('${meeting.id}')">+ Add Agenda Item</button>
                    ` : ''}
                </div>
                <div class="card-body">
                    <p class="text-muted">No agenda items yet</p>
                </div>
            </div>
        `}
        
        <!-- MINUTES -->
        <div class="card" style="border:2px solid ${isOngoing ? 'var(--primary)' : 'var(--gray-200)'};">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <h3 style="margin:0;">Minutes</h3>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    ${isOngoing ? '<span class="badge badge-warning">LIVE</span>' : ''}
                    ${meeting.minutes_approved ? '<span class="badge badge-success">Approved</span>' : ''}
                    <span style="font-size:var(--font-size-xs);color:var(--gray-500);">
                        ${minutesContent ? minutesContent.split('\n').length + ' lines' : 'Empty'}
                    </span>
                </div>
            </div>
            <div class="card-body">
                ${minutesContent ? `
                    <div style="white-space:pre-wrap;background:var(--gray-50);padding:16px;border-radius:var(--radius-md);font-size:var(--font-size-sm);line-height:1.8;margin:0;text-align:left;">
                        ${minutesContent}
                    </div>
                    ${meeting.minutes_approved_at ? `
                        <div style="font-size:var(--font-size-xs);color:var(--gray-500);margin-top:8px;">
                            Approved on ${new Date(meeting.minutes_approved_at).toLocaleString()}
                        </div>
                    ` : ''}
                ` : `
                    <div class="empty-state">
                        <p class="text-muted">${isOngoing ? 'Minutes are being recorded live...' : 'No minutes recorded yet'}</p>
                    </div>
                `}
                
                <!-- Edit Minutes - for scheduled and ongoing meetings (live minutes) -->
                ${canManage && (isScheduled || isOngoing) ? `
                    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--gray-200);">
                        <form id="minutesForm" style="display:flex;flex-direction:column;gap:8px;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label for="minutesInput" style="font-size:var(--font-size-sm);font-weight:500;">
                                    ${isOngoing ? 'Live Minutes (being recorded):' : 'Write or update minutes (any format):'}
                                </label>
                                <textarea id="minutesInput" class="form-control" rows="4" 
                                    placeholder="Write minutes in any format..."
                                    style="font-family:monospace;font-size:var(--font-size-sm);">${minutesContent}</textarea>
                                <div class="form-helper">Write freely in any format. No restrictions.</div>
                            </div>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                <button type="submit" class="btn btn-primary">Save Minutes</button>
                                ${isOngoing ? `
                                    <button type="button" class="btn btn-success" onclick="window.completeMeetingAction('${meeting.id}')">Complete Meeting</button>
                                ` : ''}
                            </div>
                        </form>
                    </div>
                ` : ''}
                
                <!-- Edit Minutes for completed meetings - only minutes can be edited -->
                ${canManage && isCompleted ? `
                    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200);">
                        <button class="btn btn-primary" onclick="window.editCompletedMinutes('${meeting.id}')">Edit Minutes</button>
                        <button class="btn btn-success" onclick="window.printMeetingMinutes('${meeting.id}')">Print Complete Report</button>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <!-- Attendance Summary -->
        <div class="card">
            <div class="card-header">
                <h3>Attendance Summary (${presentCount} present, ${excusedMembers.length} excused, ${absentMembers.length} absent)</h3>
                ${canManage && !isCompleted ? `
                    <button class="btn btn-sm btn-primary" onclick="window.openAttendanceModal('${meeting.id}')">Manage Attendance</button>
                ` : ''}
            </div>
            <div class="card-body">
                ${attendance.length === 0 ? `
                    <p class="text-muted">No attendance recorded</p>
                ` : `
                    <div style="display:flex;gap:16px;flex-wrap:wrap;">
                        <div><span style="color:var(--success);font-weight:600;">Present:</span> ${presentMembers.length}</div>
                        <div><span style="color:#F59E0B;font-weight:600;">Excused:</span> ${excusedMembers.length}</div>
                        <div><span style="color:var(--danger);font-weight:600;">Absent:</span> ${absentMembers.length}</div>
                    </div>
                    <div style="margin-top:8px;font-size:var(--font-size-xs);color:var(--gray-500);">
                        ${attendance.length} total members marked
                    </div>
                `}
            </div>
        </div>
        
        <!-- Motions -->
        ${meeting.motions && meeting.motions.length > 0 ? `
            <div class="card">
                <div class="card-header">
                    <h3>Motions</h3>
                    ${canManage && isOngoing ? `
                        <button class="btn btn-sm btn-primary" onclick="window.addMotion('${meeting.id}')">+ Add</button>
                    ` : ''}
                </div>
                <div class="card-body">
                    ${meeting.motions.map(function(m) {
                        return `
                            <div style="padding:8px 0;border-bottom:1px solid var(--gray-100);">
                                <div style="font-weight:500;">${m.title}</div>
                                <div style="font-size:var(--font-size-sm);color:var(--gray-500);">${m.description}</div>
                                <div style="font-size:var(--font-size-xs);color:var(--gray-400);margin-top:4px;">
                                    Proposed by: ${m.proposer_name || 'Unknown'}
                                    ${m.seconded_by ? ' · Seconded by: ' + (m.seconder_name || 'Unknown') : ''}
                                    · Status: ${m.status}
                                    ${m.votes_for > 0 ? ' · Votes: ' + m.votes_for + ' For, ' + m.votes_against + ' Against' : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : `
            <div class="card">
                <div class="card-header">
                    <h3>Motions</h3>
                    ${canManage && isOngoing ? `
                        <button class="btn btn-sm btn-primary" onclick="window.addMotion('${meeting.id}')">+ Add</button>
                    ` : ''}
                </div>
                <div class="card-body">
                    <p class="text-muted">No motions recorded</p>
                </div>
            </div>
        `}
        
        <!-- Action Items -->
        ${meeting.action_items && meeting.action_items.length > 0 ? `
            <div class="card">
                <div class="card-header">
                    <h3>Action Items</h3>
                    ${canManage && isOngoing ? `
                        <button class="btn btn-sm btn-primary" onclick="window.addActionItem('${meeting.id}')">+ Add</button>
                    ` : ''}
                </div>
                <div class="card-body">
                    ${meeting.action_items.map(function(item) {
                        return `
                            <div style="padding:8px 0;border-bottom:1px solid var(--gray-100);display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <div>${item.description}</div>
                                    <div style="font-size:var(--font-size-xs);color:var(--gray-500);">
                                        Assigned to: ${item.assignee_name || 'Unassigned'}
                                        ${item.due_date ? ' · Due: ' + item.due_date : ''}
                                    </div>
                                </div>
                                <span class="badge badge-${item.status === 'completed' ? 'success' : 'warning'}">${item.status}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : `
            <div class="card">
                <div class="card-header">
                    <h3>Action Items</h3>
                    ${canManage && isOngoing ? `
                        <button class="btn btn-sm btn-primary" onclick="window.addActionItem('${meeting.id}')">+ Add</button>
                    ` : ''}
                </div>
                <div class="card-body">
                    <p class="text-muted">No action items</p>
                </div>
            </div>
        `}
    `;
    
    content.innerHTML = html;
    
    const minutesForm = document.getElementById('minutesForm');
    if (minutesForm) {
        minutesForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const input = document.getElementById('minutesInput');
            const text = input.value;
            saveMinutes(currentMeeting.id, text);
        });
    }
}

// ===== MEETING ACTIONS =====

async function startMeetingAction(meetingId) {
    showConfirm({
        title: 'Start Meeting',
        message: 'Start this meeting now? Minutes can be recorded live.',
        confirmLabel: 'Start Now',
        confirmClass: 'btn-success',
        onConfirm: function(done) {
            startMeeting(meetingId)
                .then(function() {
                    showSuccess('Meeting started!');
                    done();
                    renderMeetingDetail(meetingId);
                })
                .catch(function(error) {
                    showError('Failed to start meeting: ' + error.message);
                });
        }
    });
}

async function completeMeetingAction(meetingId) {
    const minutes = currentMeeting.minutes || '';
    
    showConfirm({
        title: 'Complete Meeting',
        message: minutes.trim() ? 'Complete this meeting? The minutes will be finalized.' : 'No minutes recorded. Complete anyway?',
        confirmLabel: 'Complete',
        confirmClass: 'btn-success',
        onConfirm: function(done) {
            completeMeeting(meetingId, minutes)
                .then(function() {
                    showSuccess('Meeting completed!');
                    done();
                    renderMeetingDetail(meetingId);
                })
                .catch(function(error) {
                    showError('Failed to complete meeting: ' + error.message);
                });
        }
    });
}

async function saveMinutes(meetingId, text) {
    try {
        await updateMeeting(meetingId, { minutes: text });
        showSuccess('Minutes saved!');
        renderMeetingDetail(meetingId);
    } catch (error) {
        showError('Failed to save minutes: ' + error.message);
    }
}

// ===== AGENDA =====

async function addAgendaItemLive(meetingId) {
    showFormModal({
        title: 'Add Agenda Item',
        fields: [
            {
                id: 'agendaItem',
                label: 'Agenda Item',
                type: 'textarea',
                value: '',
                required: true,
                rows: 2,
                placeholder: 'Enter agenda item...'
            }
        ],
        submitLabel: 'Add to Agenda',
        onSubmit: function(data, done) {
            const currentAgenda = currentMeeting.agenda || '';
            const newAgenda = currentAgenda + (currentAgenda ? '\n' : '') + data.agendaItem;
            
            updateMeeting(meetingId, { agenda: newAgenda })
                .then(function() {
                    showSuccess('Agenda item added!');
                    done();
                    renderMeetingDetail(meetingId);
                })
                .catch(function(error) {
                    showError('Failed to add agenda item: ' + error.message);
                });
        }
    });
}

// ===== EDIT MEETING MODAL (Only for Scheduled) =====

function openEditMeetingModal(meetingId) {
    const meeting = currentMeeting;
    if (!meeting) {
        showError('Meeting not found');
        return;
    }
    
    // Only allow editing if meeting is scheduled
    if (meeting.status !== 'scheduled') {
        if (meeting.status === 'completed') {
            showError('Cannot edit a completed meeting. You can only edit the minutes.');
        } else if (meeting.status === 'ongoing') {
            showError('Cannot edit an ongoing meeting. Meeting details are locked while in progress.');
        } else if (meeting.status === 'cancelled') {
            showError('Cannot edit a cancelled meeting.');
        } else {
            showError('Cannot edit this meeting.');
        }
        return;
    }
    
    const existingAgenda = meeting.agenda || '';
    
    const fields = [
        {
            id: 'mfTitle',
            label: 'Meeting Title',
            type: 'text',
            value: meeting.title || '',
            required: true,
            placeholder: 'e.g., Monthly Organization Baraza'
        },
        {
            id: 'mfDate',
            label: 'Date',
            type: 'date',
            value: meeting.date || '',
            required: true
        },
        {
            id: 'mfTime',
            label: 'Time',
            type: 'time',
            value: meeting.time || '14:00',
            required: true
        },
        {
            id: 'mfLocation',
            label: 'Location',
            type: 'text',
            value: meeting.location || '',
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
            helper: 'Existing agenda items are shown. Add new items at the bottom.'
        },
        {
            id: 'mfQuorum',
            label: 'Quorum Required',
            type: 'number',
            value: meeting.quorum_required || 10,
            required: false,
            helper: 'Minimum number of members required for the meeting to proceed'
        }
    ];
    
    showFormModal({
        title: 'Edit Meeting',
        fields: fields,
        size: 'md',
        submitLabel: 'Update',
        onSubmit: function(data, done) {
            let timeValue = data.mfTime;
            if (timeValue && !timeValue.includes(':')) {
                timeValue = timeValue + ':00';
            } else if (timeValue && timeValue.split(':').length === 2) {
                timeValue = timeValue + ':00';
            }
            
            let agendaValue = data.mfAgenda || '';
            agendaValue = agendaValue.trim();
            
            const formattedData = {
                title: data.mfTitle,
                date: data.mfDate,
                time: timeValue,
                location: data.mfLocation || null,
                agenda: agendaValue || null,
                quorum_required: parseInt(data.mfQuorum) || 10
            };
            
            updateMeeting(meetingId, formattedData)
                .then(function() {
                    showSuccess('Meeting updated successfully');
                    done();
                    renderMeetingDetail(meetingId);
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to update meeting');
                });
        }
    });
}

// ===== ATTENDANCE MODAL =====

function openAttendanceModal(meetingId) {
    const membersWithStatus = currentMembers.map(function(m) {
        const cached = attendanceCache[m.id] || { attended: false, attendance_type: 'absent' };
        return {
            ...m,
            status: cached.attendance_type || 'absent',
            attended: cached.attended || false
        };
    });
    
    const statusCounts = {
        present: membersWithStatus.filter(function(m) { return m.status === 'present'; }).length,
        excused: membersWithStatus.filter(function(m) { return m.status === 'excused'; }).length,
        absent: membersWithStatus.filter(function(m) { return m.status === 'absent'; }).length
    };
    
    const groups = [];
    const groupMap = {};
    membersWithStatus.forEach(function(m) {
        if (m.group_name && !groupMap[m.group_name]) {
            groupMap[m.group_name] = true;
            groups.push(m.group_name);
        }
    });
    
    const groupOptions = groups.map(function(g) {
        return `<option value="${g}">${g}</option>`;
    }).join('');
    
    showModal({
        title: 'Mark Attendance',
        size: 'xl',
        content: `
            <div style="margin-bottom:12px;">
                <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-success" onclick="window.bulkMarkAttendance('present')">All Present</button>
                        <button class="btn btn-sm btn-warning" onclick="window.bulkMarkAttendance('excused')">All Excused</button>
                        <button class="btn btn-sm btn-danger" onclick="window.bulkMarkAttendance('absent')">All Absent</button>
                        <button class="btn btn-sm btn-outline" onclick="window.bulkMarkAttendance('reset')">Reset All</button>
                    </div>
                    <span style="font-size:var(--font-size-xs);color:var(--gray-500);">
                        Present: <span id="countPresent">${statusCounts.present}</span> | 
                        Excused: <span id="countExcused">${statusCounts.excused}</span> | 
                        Absent: <span id="countAbsent">${statusCounts.absent}</span>
                    </span>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center;">
                    <input type="text" id="attendanceSearch" class="form-control" placeholder="Search members..." style="flex:1;min-width:150px;">
                    <select id="attendanceGroupFilter" class="form-control form-select" style="width:auto;min-width:120px;">
                        <option value="">All Groups</option>
                        ${groupOptions}
                    </select>
                    <button class="btn btn-sm btn-primary" onclick="window.applyGroupFilter()">Filter Group</button>
                </div>
                <div style="font-size:var(--font-size-xs);color:var(--gray-500);margin-top:4px;">
                    ${currentMembers.length} members total
                </div>
            </div>
            <div style="max-height:500px;overflow-y:auto;border:1px solid var(--gray-200);border-radius:var(--radius-md);padding:8px;" id="attendanceListContainer">
                ${membersWithStatus.map(function(m) {
                    const statusText = m.status === 'present' ? 'Present' : m.status === 'excused' ? 'Excused' : 'Absent';
                    return `
                        <div class="attendance-row" data-member-id="${m.id}" data-name="${m.full_name || m.first_name + ' ' + m.last_name}" data-group="${m.group_name || ''}" style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid var(--gray-50);">
                            <span style="font-size:var(--font-size-sm);min-width:180px;">${m.full_name || m.first_name + ' ' + m.last_name}</span>
                            <span style="font-size:var(--font-size-xs);color:var(--gray-400);min-width:80px;">${m.member_number || ''}</span>
                            <select class="form-control form-select attendance-select" data-member-id="${m.id}" style="width:auto;min-width:100px;padding:2px 8px;font-size:var(--font-size-sm);">
                                <option value="present" ${m.status === 'present' ? 'selected' : ''}>Present</option>
                                <option value="excused" ${m.status === 'excused' ? 'selected' : ''}>Excused</option>
                                <option value="absent" ${m.status === 'absent' ? 'selected' : ''}>Absent</option>
                            </select>
                            <span style="font-size:var(--font-size-xs);font-weight:600;color:${m.status === 'present' ? 'var(--success)' : m.status === 'excused' ? '#F59E0B' : 'var(--danger)'};min-width:60px;">${statusText}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `,
        buttons: [
            {
                label: 'Cancel',
                action: 'cancel',
                class: 'btn-outline',
                onClick: function(done) { done(); }
            },
            {
                label: 'Save Attendance',
                action: 'save',
                class: 'btn-primary',
                onClick: function(done) {
                    const selects = document.querySelectorAll('.attendance-select');
                    const presentIds = [];
                    const excusedIds = [];
                    
                    selects.forEach(function(select) {
                        const memberId = select.dataset.memberId;
                        const status = select.value;
                        if (status === 'present') {
                            presentIds.push(memberId);
                        } else if (status === 'excused') {
                            excusedIds.push(memberId);
                        }
                    });
                    
                    const attendanceData = {
                        present: presentIds,
                        excused: excusedIds
                    };
                    
                    fetch('/api/v1/meetings/' + meetingId + '/attendance-with-status', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                        body: JSON.stringify(attendanceData)
                    })
                    .then(function(r) {
                        if (!r.ok) throw new Error('Failed to save attendance');
                        return r.json();
                    })
                    .then(function() {
                        showSuccess('Attendance saved!');
                        done();
                        renderMeetingDetail(meetingId);
                    })
                    .catch(function(error) {
                        showError('Failed to save attendance: ' + error.message);
                    });
                }
            }
        ],
        onShow: function() {
            const searchInput = document.getElementById('attendanceSearch');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    const query = this.value.toLowerCase().trim();
                    const rows = document.querySelectorAll('.attendance-row');
                    rows.forEach(function(row) {
                        const name = (row.dataset.name || '').toLowerCase();
                        const show = !query || name.includes(query);
                        row.style.display = show ? 'flex' : 'none';
                    });
                });
            }
            
            window.bulkMarkAttendance = function(status) {
                const selects = document.querySelectorAll('.attendance-select');
                selects.forEach(function(select) {
                    if (status === 'reset') {
                        select.value = 'absent';
                    } else {
                        select.value = status;
                    }
                    select.dispatchEvent(new Event('change'));
                });
                updateAttendanceCounts();
            };
            
            window.applyGroupFilter = function() {
                const filter = document.getElementById('attendanceGroupFilter').value;
                const rows = document.querySelectorAll('.attendance-row');
                rows.forEach(function(row) {
                    const group = row.dataset.group || '';
                    const show = !filter || group === filter;
                    row.style.display = show ? 'flex' : 'none';
                });
            };
            
            function updateAttendanceCounts() {
                const selects = document.querySelectorAll('.attendance-select');
                let present = 0, excused = 0, absent = 0;
                selects.forEach(function(select) {
                    const status = select.value;
                    if (status === 'present') present++;
                    else if (status === 'excused') excused++;
                    else absent++;
                });
                document.getElementById('countPresent').textContent = present;
                document.getElementById('countExcused').textContent = excused;
                document.getElementById('countAbsent').textContent = absent;
            }
            
            document.querySelectorAll('.attendance-select').forEach(function(select) {
                select.addEventListener('change', function() {
                    updateAttendanceCounts();
                    const row = this.closest('.attendance-row');
                    if (row) {
                        const statusText = row.querySelector('span:last-child');
                        const status = this.value;
                        if (status === 'present') {
                            statusText.textContent = 'Present';
                            statusText.style.color = 'var(--success)';
                        } else if (status === 'excused') {
                            statusText.textContent = 'Excused';
                            statusText.style.color = '#F59E0B';
                        } else {
                            statusText.textContent = 'Absent';
                            statusText.style.color = 'var(--danger)';
                        }
                    }
                });
            });
            
            updateAttendanceCounts();
        }
    });
}

// ===== MOTIONS =====

async function addMotion(meetingId) {
    if (currentMembers.length === 0) {
        try {
            currentMembers = await getMembers();
        } catch (e) {
            showError('Failed to load members');
            return;
        }
    }
    
    const memberOptions = currentMembers.map(function(m) {
        return { value: m.id, label: m.full_name || m.first_name + ' ' + m.last_name };
    });
    
    showFormModal({
        title: 'Add Motion',
        fields: [
            {
                id: 'motionTitle',
                label: 'Motion Title',
                type: 'text',
                value: '',
                required: true,
                placeholder: 'e.g., Formation of Water Committee'
            },
            {
                id: 'motionDescription',
                label: 'Description',
                type: 'textarea',
                value: '',
                required: true,
                rows: 3,
                placeholder: 'Describe the motion...'
            },
            {
                id: 'motionProposedBy',
                label: 'Proposed By',
                type: 'select',
                value: '',
                required: true,
                options: [{ value: '', label: 'Select member...' }].concat(memberOptions)
            },
            {
                id: 'motionSecondedBy',
                label: 'Seconded By',
                type: 'select',
                value: '',
                required: false,
                options: [{ value: '', label: 'Select member...' }].concat(memberOptions)
            }
        ],
        size: 'md',
        submitLabel: 'Add Motion',
        onSubmit: function(data, done) {
            const motionData = {
                title: data.motionTitle,
                description: data.motionDescription,
                proposed_by: data.motionProposedBy,
                seconded_by: data.motionSecondedBy || null
            };
            
            fetch('/api/v1/meetings/' + meetingId + '/motions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify(motionData)
            })
            .then(function(r) {
                if (!r.ok) throw new Error('Failed to add motion');
                return r.json();
            })
            .then(function() {
                showSuccess('Motion added!');
                done();
                renderMeetingDetail(meetingId);
            })
            .catch(function(error) {
                showError('Failed to add motion: ' + error.message);
            });
        }
    });
}

// ===== ACTION ITEMS =====

async function addActionItem(meetingId) {
    if (currentMembers.length === 0) {
        try {
            currentMembers = await getMembers();
        } catch (e) {
            showError('Failed to load members');
            return;
        }
    }
    
    const memberOptions = currentMembers.map(function(m) {
        return { value: m.id, label: m.full_name || m.first_name + ' ' + m.last_name };
    });
    
    showFormModal({
        title: 'Add Action Item',
        fields: [
            {
                id: 'actionDescription',
                label: 'Description',
                type: 'textarea',
                value: '',
                required: true,
                rows: 2,
                placeholder: 'What needs to be done?'
            },
            {
                id: 'actionAssignedTo',
                label: 'Assigned To',
                type: 'select',
                value: '',
                required: true,
                options: [{ value: '', label: 'Select member...' }].concat(memberOptions)
            },
            {
                id: 'actionDueDate',
                label: 'Due Date',
                type: 'date',
                value: '',
                required: false
            },
            {
                id: 'actionPriority',
                label: 'Priority',
                type: 'select',
                value: 'medium',
                required: false,
                options: [
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' }
                ]
            }
        ],
        size: 'md',
        submitLabel: 'Add Action Item',
        onSubmit: function(data, done) {
            const actionData = {
                description: data.actionDescription,
                assigned_to: data.actionAssignedTo,
                due_date: data.actionDueDate || null,
                priority: data.actionPriority || 'medium'
            };
            
            fetch('/api/v1/meetings/' + meetingId + '/action-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify(actionData)
            })
            .then(function(r) {
                if (!r.ok) throw new Error('Failed to add action item');
                return r.json();
            })
            .then(function() {
                showSuccess('Action item added!');
                done();
                renderMeetingDetail(meetingId);
            })
            .catch(function(error) {
                showError('Failed to add action item: ' + error.message);
            });
        }
    });
}

// ===== VIEW MINUTES =====

function viewMinutesFull(meetingId) {
    const minutes = currentMeeting.minutes || 'No minutes recorded';
    
    showModal({
        title: 'Meeting Minutes',
        content: `
            <div style="white-space:pre-wrap;background:var(--gray-50);padding:16px;border-radius:var(--radius-md);font-size:var(--font-size-sm);line-height:1.8;text-align:left;margin:0;">
                ${minutes}
            </div>
            ${currentMeeting.minutes_approved_at ? `
                <div style="font-size:var(--font-size-xs);color:var(--gray-500);margin-top:8px;">
                    Approved on ${new Date(currentMeeting.minutes_approved_at).toLocaleString()}
                </div>
            ` : ''}
        `,
        size: 'lg',
        buttons: [
            {
                label: 'Print Complete Report',
                action: 'print',
                class: 'btn-primary',
                onClick: function(done) {
                    printMeetingMinutes(meetingId);
                    done();
                }
            },
            {
                label: 'Close',
                action: 'close',
                class: 'btn-outline',
                onClick: function(done) { done(); }
            }
        ]
    });
}

// ===== EDIT COMPLETED MINUTES =====

async function editCompletedMinutes(meetingId) {
    const minutes = currentMeeting.minutes || '';
    
    showFormModal({
        title: 'Edit Minutes',
        fields: [
            {
                id: 'minutesContent',
                label: 'Minutes (any format)',
                type: 'textarea',
                value: minutes,
                required: false,
                rows: 10,
                helper: 'Write in any format you prefer - no restrictions'
            }
        ],
        size: 'lg',
        submitLabel: 'Update Minutes',
        onSubmit: function(data, done) {
            saveMinutes(meetingId, data.minutesContent);
            done();
        }
    });
}

// ===== PRINT COMPLETE MEETING REPORT =====

function printMeetingMinutes(meetingId) {
    const meeting = currentMeeting;
    if (!meeting) {
        showError('Meeting data not loaded');
        return;
    }
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
        showError('Please allow popups to print');
        return;
    }
    
    const attendanceList = currentAttendance || [];
    const presentMembers = attendanceList.filter(function(a) { return a.attended && a.attendance_type === 'present'; });
    const excusedMembers = attendanceList.filter(function(a) { return a.attendance_type === 'excused'; });
    const absentMembers = attendanceList.filter(function(a) { return !a.attended && a.attendance_type !== 'excused'; });
    
    const motions = meeting.motions || [];
    const actionItems = meeting.action_items || [];
    const agendaItems = meeting.agenda ? meeting.agenda.split('\n').filter(function(line) { return line.trim() !== ''; }) : [];
    
    const minutesContent = meeting.minutes || '';
    
    const html = `<!DOCTYPE html>
    <html>
    <head>
        <title>${localStorage.getItem("organization_name") || "Organization"} - ${meeting.title} - Meeting Report</title>
        <meta charset="UTF-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Times New Roman', 'Georgia', serif; 
                padding: 50px 60px; 
                max-width: 1000px; 
                margin: 0 auto; 
                line-height: 1.7;
                color: #000000;
                background: #ffffff;
                font-size: 14px;
            }
            .header { 
                text-align: center; 
                border-bottom: 3px double #000; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
            }
            .header h1 { 
                font-size: 26px; 
                margin: 0; 
                letter-spacing: 3px;
                text-transform: uppercase;
                color: #000;
                font-weight: 700;
            }
            .header .subtitle { 
                font-size: 18px; 
                margin: 8px 0; 
                color: #000;
                font-weight: 600;
            }
            .header .meta { 
                font-size: 13px; 
                color: #000; 
                margin-top: 6px; 
            }
            .header .meta span { margin: 0 10px; }
            
            .section { 
                margin-bottom: 24px; 
                page-break-inside: avoid;
            }
            .section-title { 
                font-size: 17px; 
                font-weight: 700; 
                border-bottom: 2px solid #000; 
                padding-bottom: 4px; 
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #000;
            }
            
            .info-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 4px 40px; 
                margin-bottom: 10px; 
            }
            .info-grid .label { font-weight: 600; color: #000; }
            .info-grid div { color: #000; }
            
            .agenda-item { 
                padding: 3px 0; 
                border-bottom: 1px dotted #ccc; 
                color: #000;
                margin: 0;
            }
            
            .attendance-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr 1fr; 
                gap: 4px 30px; 
                margin-top: 6px; 
            }
            .attendance-grid div { color: #000; }
            .attendance-grid .status-label { font-weight: 600; }
            .attendance-count { 
                font-weight: 600; 
                margin-bottom: 8px;
                color: #000;
            }
            
            .motion-item { 
                padding: 8px 0; 
                border-bottom: 1px solid #e0e0e0; 
            }
            .motion-item .title { font-weight: 600; color: #000; }
            .motion-item .detail { font-size: 13px; color: #000; }
            .motion-item .meta { font-size: 12px; color: #000; margin-top: 2px; }
            
            .action-item { 
                padding: 8px 0; 
                border-bottom: 1px solid #e0e0e0; 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
            }
            .action-item .desc { flex: 1; color: #000; }
            .action-item .desc div { color: #000; }
            .action-item .status { 
                font-size: 12px; 
                padding: 2px 14px; 
                border-radius: 12px; 
                background: #e8e8e8; 
                color: #000; 
                border: 1px solid #999;
            }
            .action-item .status.pending { background: #e0e0e0; color: #000; }
            .action-item .status.completed { background: #d0d0d0; color: #000; }
            
            .minutes-content { 
                white-space: pre-wrap; 
                font-size: 13px; 
                line-height: 1.8; 
                background: #f7f7f7; 
                padding: 16px 20px; 
                border-left: 4px solid #000;
                color: #000;
                font-family: 'Courier New', Courier, monospace;
                text-align: left;
                margin: 0;
            }
            
            .signatures { 
                margin-top: 50px; 
                padding-top: 20px; 
                border-top: 2px solid #000; 
                display: flex; 
                justify-content: space-between; 
            }
            .signature-block { text-align: center; }
            .signature-block strong { color: #000; }
            .signature-line { 
                display: inline-block; 
                width: 220px; 
                border-bottom: 1px solid #000; 
                margin-top: 40px; 
            }
            .signature-name { font-size: 13px; margin-top: 4px; color: #000; }
            
            .badge {
                display: inline-block;
                padding: 2px 12px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                color: #000;
                border: 1px solid #999;
            }
            .badge-passed { background: #d0d0d0; }
            .badge-failed { background: #e0e0e0; }
            .badge-proposed { background: #e8e8e8; }
            .badge-withdrawn { background: #f0f0f0; }
            
            .footer { 
                margin-top: 40px; 
                padding-top: 16px; 
                border-top: 1px solid #999; 
                text-align: center; 
                font-size: 11px; 
                color: #666; 
            }
            
            @media print {
                body { padding: 30px 40px; }
                .no-print { display: none; }
                .section { page-break-inside: avoid; }
            }
            @media (max-width: 768px) {
                body { padding: 16px; }
                .info-grid { grid-template-columns: 1fr; }
                .attendance-grid { grid-template-columns: 1fr; }
                .signatures { flex-direction: column; gap: 20px; }
                .signature-line { width: 100%; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${localStorage.getItem("organization_name") || "Organization"} - Meeting Report</h1>
            <div class="subtitle">${meeting.title}</div>
            <div class="meta">
                <span>Date: ${meeting.date}</span>
                <span>Time: ${meeting.time}</span>
                ${meeting.location ? `<span>Venue: ${meeting.location}</span>` : ''}
                <span>Status: ${meeting.status.toUpperCase()}</span>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Meeting Details</div>
            <div class="info-grid">
                <div><span class="label">Meeting Type:</span> ${meeting.meeting_type || 'General'}</div>
                <div><span class="label">Meeting Number:</span> ${meeting.meeting_number || 'N/A'}</div>
                <div><span class="label">Chairperson:</span> ${meeting.chairperson_name || 'Not assigned'}</div>
                <div><span class="label">Secretary:</span> ${meeting.secretary_name || 'Not assigned'}</div>
                <div><span class="label">Quorum Required:</span> ${meeting.quorum_required}</div>
                <div><span class="label">Members Present:</span> ${presentMembers.length} / ${attendanceList.length}</div>
                <div><span class="label">Quorum Status:</span> ${presentMembers.length >= meeting.quorum_required ? 'Met' : 'Not Met'}</div>
            </div>
        </div>
        
        ${agendaItems.length > 0 ? `
        <div class="section">
            <div class="section-title">Agenda</div>
            ${agendaItems.map(function(item, index) {
                return `<div class="agenda-item">${index + 1}. ${item}</div>`;
            }).join('')}
        </div>
        ` : ''}
        
        <div class="section">
            <div class="section-title">Attendance</div>
            <div class="attendance-count">Total Members: ${attendanceList.length} | Present: ${presentMembers.length} | Excused: ${excusedMembers.length} | Absent: ${absentMembers.length}</div>
            <div class="attendance-grid">
                <div>
                    <div class="status-label">Present</div>
                    ${presentMembers.map(function(a) {
                        return `<div>${a.member_name || 'Unknown'}</div>`;
                    }).join('') || '<div style="color:#999;font-size:13px;">None</div>'}
                </div>
                <div>
                    <div class="status-label">Excused</div>
                    ${excusedMembers.map(function(a) {
                        return `<div>${a.member_name || 'Unknown'}</div>`;
                    }).join('') || '<div style="color:#999;font-size:13px;">None</div>'}
                </div>
                <div>
                    <div class="status-label">Absent</div>
                    ${absentMembers.map(function(a) {
                        return `<div>${a.member_name || 'Unknown'}</div>`;
                    }).join('') || '<div style="color:#999;font-size:13px;">None</div>'}
                </div>
            </div>
        </div>
        
        ${minutesContent ? `
        <div class="section">
            <div class="section-title">Minutes</div>
            <div class="minutes-content">${minutesContent}</div>
            ${meeting.minutes_approved_at ? `<div style="font-size:12px;color:#555;margin-top:6px;">Approved on ${new Date(meeting.minutes_approved_at).toLocaleString()}</div>` : ''}
        </div>
        ` : ''}
        
        ${motions.length > 0 ? `
        <div class="section">
            <div class="section-title">Motions</div>
            ${motions.map(function(m) {
                const statusClass = m.status === 'passed' ? 'badge-passed' : m.status === 'failed' ? 'badge-failed' : m.status === 'withdrawn' ? 'badge-withdrawn' : 'badge-proposed';
                return `
                    <div class="motion-item">
                        <div class="title">${m.title}</div>
                        <div class="detail">${m.description}</div>
                        <div class="meta">
                            Proposed by: ${m.proposer_name || 'Unknown'}
                            ${m.seconded_by ? ' · Seconded by: ' + (m.seconder_name || 'Unknown') : ''}
                            <span class="badge ${statusClass}" style="margin-left:8px;">${m.status || 'Proposed'}</span>
                            ${m.votes_for > 0 ? ' · Votes: ' + m.votes_for + ' For, ' + m.votes_against + ' Against' : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        ` : ''}
        
        ${actionItems.length > 0 ? `
        <div class="section">
            <div class="section-title">Action Items</div>
            ${actionItems.map(function(item) {
                const statusClass = item.status === 'completed' ? 'completed' : 'pending';
                return `
                    <div class="action-item">
                        <div class="desc">
                            <div>${item.description}</div>
                            <div style="font-size:12px;color:#555;">
                                Assigned to: ${item.assignee_name || 'Unassigned'}
                                ${item.due_date ? ' · Due: ' + item.due_date : ''}
                                ${item.priority ? ' · Priority: ' + item.priority : ''}
                            </div>
                        </div>
                        <span class="status ${statusClass}">${item.status || 'Pending'}</span>
                    </div>
                `;
            }).join('')}
        </div>
        ` : ''}
        
        <div class="signatures">
            <div class="signature-block">
                <div><strong>Chairperson</strong></div>
                <div class="signature-line"></div>
                <div class="signature-name">${meeting.chairperson_name || '_________________'}</div>
            </div>
            <div class="signature-block">
                <div><strong>Secretary</strong></div>
                <div class="signature-line"></div>
                <div class="signature-name">${meeting.secretary_name || '_________________'}</div>
            </div>
        </div>
        
        <div class="footer">
            Printed on ${new Date().toLocaleString()} · Management System
        </div>
        
        <script>
            setTimeout(function() { window.print(); }, 500);
        <\/script>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

// ===== EXPOSE FUNCTIONS GLOBALLY =====
window.renderMeetingDetail = renderMeetingDetail;
window.printMeetingMinutes = printMeetingMinutes;
window.startMeetingAction = startMeetingAction;
window.completeMeetingAction = completeMeetingAction;
window.openAttendanceModal = openAttendanceModal;
window.addMotion = addMotion;
window.addActionItem = addActionItem;
window.addAgendaItemLive = addAgendaItemLive;
window.saveMinutes = saveMinutes;
window.viewMinutesFull = viewMinutesFull;
window.editCompletedMinutes = editCompletedMinutes;
window.openEditMeetingModal = openEditMeetingModal;

// Legacy editMeeting function - only works for scheduled meetings
window.editMeeting = function(meetingId) {
    if (currentMeeting && currentMeeting.status !== 'scheduled') {
        if (currentMeeting.status === 'completed') {
            showError('Cannot edit a completed meeting. You can only edit the minutes.');
        } else if (currentMeeting.status === 'ongoing') {
            showError('Cannot edit an ongoing meeting. Meeting details are locked while in progress.');
        } else {
            showError('Cannot edit this meeting.');
        }
        return;
    }
    openEditMeetingModal(meetingId);
};

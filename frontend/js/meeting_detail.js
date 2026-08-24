// MtaaLink - Meeting Detail View (Updated to use Formal Meetings)

// ===================== OPEN MEETING DETAIL - NOW USES FORMAL VIEW =====================

async function openMeetingDetail(meetingId) {
    // Use the new formal meeting view
    if (typeof renderFormalMeetingDetail === 'function') {
        await renderFormalMeetingDetail(meetingId);
    } else {
        // Fallback to old view if formal not loaded
        await openMeetingDetailLegacy(meetingId);
    }
}

// ===================== LEGACY MEETING DETAIL (BACKUP) =====================

async function openMeetingDetailLegacy(meetingId) {
    try {
        var token = localStorage.getItem('token');
        var response = await fetch('http://localhost:8000/api/v1/meetings/' + meetingId, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (!response.ok) throw new Error('Failed to load meeting');
        
        var data = await response.json();
        renderMeetingDetailLegacy(data);
    } catch (error) {
        showToast('Error loading meeting: ' + error.message, 'error');
    }
}

function renderMeetingDetailLegacy(data) {
    var content = document.getElementById('pageContent');
    if (!content) return;
    
    var meeting = data.meeting;
    var attendance = data.attendance || [];
    var actionItems = data.action_items || [];
    var motions = data.motions || [];
    var presentCount = data.present_count || 0;
    
    var isAdmin = ['admin', 'secretary', 'elder'].indexOf(window.userRole) !== -1;
    
    var html = '';
    
    html += '<div style="margin-bottom:16px;"><button class="btn btn-outline" onclick="renderMeetings()"><i class="fas fa-arrow-left"></i> Back to Meetings</button></div>';
    
    html += '<div class="card" style="margin-bottom:20px;border-left:4px solid ' + getStatusColor(meeting.status) + ';">';
    html += '<div class="card-body">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;">';
    html += '<div><h2 style="margin:0;">' + meeting.title + '</h2>';
    html += '<div style="color:var(--gray-500);margin-top:4px;"><i class="fas fa-calendar-alt"></i> ' + meeting.date + ' at ' + meeting.time + (meeting.end_time ? ' - ' + meeting.end_time : '') + '</div>';
    html += '<div style="color:var(--gray-500);margin-top:4px;"><i class="fas fa-map-marker-alt"></i> ' + (meeting.location || 'Village Hall') + '</div>';
    html += '<div style="margin-top:8px;"><span class="badge badge-' + getStatusBadge(meeting.status) + '">' + meeting.status.toUpperCase() + '</span>';
    html += '<span class="badge badge-info">' + meeting.meeting_type + '</span></div></div>';
    html += '<div style="text-align:right;"><div style="font-size:13px;color:var(--gray-500);">Quorum: ' + meeting.quorum_required + '</div>';
    html += '<div style="font-size:13px;color:' + (presentCount >= meeting.quorum_required ? 'var(--success)' : 'var(--danger)') + ';">Present: ' + presentCount + ' / ' + meeting.quorum_required + ' ' + (presentCount >= meeting.quorum_required ? '✅' : '❌') + '</div></div>';
    html += '</div>';
    
    if (meeting.description) {
        html += '<div style="margin-top:12px;padding:12px;background:var(--gray-50);border-radius:var(--radius-md);">' + meeting.description + '</div>';
    }
    
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--gray-200);">';
    
    if (isAdmin) {
        if (meeting.status === 'scheduled') {
            html += '<button class="btn btn-success" onclick="startMeeting(\'' + meeting.id + '\')"><i class="fas fa-play"></i> Start Meeting</button>';
            html += '<button class="btn btn-danger" onclick="cancelMeeting(\'' + meeting.id + '\')"><i class="fas fa-times"></i> Cancel</button>';
        }
        if (meeting.status === 'ongoing') {
            html += '<button class="btn btn-primary" onclick="openAttendanceModal(\'' + meeting.id + '\')"><i class="fas fa-users"></i> Mark Attendance</button>';
            html += '<button class="btn btn-primary" onclick="openActionItemModal(\'' + meeting.id + '\')"><i class="fas fa-tasks"></i> Add Action Item</button>';
            html += '<button class="btn btn-primary" onclick="openMotionModal(\'' + meeting.id + '\')"><i class="fas fa-gavel"></i> Add Motion</button>';
            html += '<button class="btn btn-success" onclick="completeMeeting(\'' + meeting.id + '\')"><i class="fas fa-check-circle"></i> Complete Meeting</button>';
            html += '<button class="btn btn-warning" onclick="adjournMeeting(\'' + meeting.id + '\')"><i class="fas fa-pause"></i> Adjourn</button>';
        }
        if (meeting.status === 'completed') {
            html += '<button class="btn btn-outline" onclick="viewMinutes(\'' + meeting.id + '\')"><i class="fas fa-file-alt"></i> View Minutes</button>';
        }
        html += '<button class="btn btn-outline" onclick="editMeetingDetail(\'' + meeting.id + '\')"><i class="fas fa-edit"></i> Edit Meeting</button>';
    }
    
    html += '<button class="btn btn-primary" onclick="printMeetingReport(\'' + meeting.id + '\')"><i class="fas fa-print"></i> Print Report</button>';
    html += '</div>';
    html += '</div></div>';
    
    if (meeting.agenda) {
        html += '<div class="card" style="margin-bottom:16px;"><div class="card-header"><h3><i class="fas fa-list"></i> Agenda</h3></div><div class="card-body"><div style="white-space:pre-wrap;">' + meeting.agenda + '</div></div></div>';
    }
    
    html += '<div class="card" style="margin-bottom:16px;">';
    html += '<div class="card-header"><h3><i class="fas fa-users"></i> Attendance (' + presentCount + ' present / ' + attendance.length + ' total)</h3></div>';
    html += '<div class="card-body">';
    html += renderAttendance(attendance);
    html += '</div></div>';
    
    html += '<div class="card" style="margin-bottom:16px;"><div class="card-header"><h3><i class="fas fa-tasks"></i> Action Items</h3><span class="badge badge-warning">' + actionItems.filter(function(a) { return a.status === 'pending'; }).length + ' pending</span></div><div class="card-body">';
    html += renderActionItems(actionItems);
    html += '</div></div>';
    
    html += '<div class="card" style="margin-bottom:16px;"><div class="card-header"><h3><i class="fas fa-gavel"></i> Motions</h3><span class="badge badge-info">' + motions.length + '</span></div><div class="card-body">';
    html += renderMotions(motions, isAdmin);
    html += '</div></div>';
    
    if (meeting.minutes) {
        html += '<div class="card"><div class="card-header"><h3><i class="fas fa-file-alt"></i> Minutes</h3>' + (meeting.minutes_approved ? '<span class="badge badge-success">✅ Approved</span>' : '<span class="badge badge-warning">⏳ Pending Approval</span>') + '</div><div class="card-body"><div style="white-space:pre-wrap;">' + meeting.minutes + '</div></div></div>';
    }
    
    content.innerHTML = html;
}

// ===================== KEEP EXISTING UTILITY FUNCTIONS =====================

function getStatusColor(status) {
    var colors = {
        'scheduled': 'var(--primary)',
        'ongoing': 'var(--success)',
        'completed': 'var(--info)',
        'cancelled': 'var(--danger)',
        'adjourned': 'var(--warning)'
    };
    return colors[status] || 'var(--gray)';
}

function getStatusBadge(status) {
    var badges = {
        'scheduled': 'primary',
        'ongoing': 'success',
        'completed': 'info',
        'cancelled': 'danger',
        'adjourned': 'warning'
    };
    return badges[status] || 'secondary';
}

function renderAttendance(attendance) {
    if (!attendance || attendance.length === 0) {
        return '<p style="color:var(--gray-500);">No attendance recorded yet</p>';
    }
    
    var html = '';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    
    for (var i = 0; i < attendance.length; i++) {
        var a = attendance[i];
        var memberName = a.member_name || a.member_id || 'Unknown';
        var memberNumber = a.member_number || 'N/A';
        var isPresent = a.attended;
        var checkInTime = a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString() : '';
        
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:' + (isPresent ? 'var(--success-light)' : 'var(--danger-light)') + ';border-radius:var(--radius-md);border-left:4px solid ' + (isPresent ? 'var(--success)' : 'var(--danger)') + ';">';
        html += '<div><strong>' + memberName + '</strong>';
        html += '<div style="font-size:12px;color:var(--gray-500);">Member #: <strong>' + memberNumber + '</strong></div>';
        if (a.member_phone) {
            html += '<div style="font-size:11px;color:var(--gray-400);">📱 ' + a.member_phone + '</div>';
        }
        html += '</div>';
        html += '<div style="text-align:right;">';
        html += '<div style="font-weight:600;color:' + (isPresent ? 'var(--success)' : 'var(--danger)') + ';">' + (isPresent ? '✅ Present' : '❌ Absent') + '</div>';
        if (isPresent && checkInTime) {
            html += '<div style="font-size:11px;color:var(--gray-500);">⏰ ' + checkInTime + '</div>';
        }
        html += '</div></div>';
    }
    
    html += '</div>';
    return html;
}

function renderActionItems(actionItems) {
    if (!actionItems || actionItems.length === 0) {
        return '<p style="color:var(--gray-500);">No action items yet</p>';
    }
    
    var html = '';
    for (var i = 0; i < actionItems.length; i++) {
        var item = actionItems[i];
        var assigneeNumber = item.assignee_number || 'N/A';
        var assigneeName = item.assignee_name || item.assigned_to || 'Unknown';
        
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid var(--gray-200);">';
        html += '<div><div style="font-weight:600;">' + item.description + '</div>';
        html += '<div style="font-size:13px;color:var(--gray-500);">Assigned to: <strong>' + assigneeName + '</strong> (#' + assigneeNumber + ')' + (item.due_date ? ' · Due: ' + item.due_date : '') + '</div>';
        html += '</div>';
        html += '<span class="badge badge-' + (item.status === 'completed' ? 'success' : 'warning') + '">' + item.status + '</span>';
        html += '</div>';
    }
    
    return html;
}

function renderMotions(motions, isAdmin) {
    if (!motions || motions.length === 0) {
        return '<p style="color:var(--gray-500);">No motions yet</p>';
    }
    
    var html = '';
    for (var i = 0; i < motions.length; i++) {
        var motion = motions[i];
        var proposerName = motion.proposer_name || motion.proposed_by || 'Unknown';
        var proposerNumber = motion.proposer_number || 'N/A';
        var seconderName = motion.seconder_name || motion.seconded_by || 'N/A';
        
        html += '<div style="padding:12px;border-bottom:1px solid var(--gray-200);">';
        html += '<div style="font-weight:600;">' + motion.title + '</div>';
        html += '<div style="font-size:13px;color:var(--gray-500);">' + motion.description + '</div>';
        html += '<div style="display:flex;gap:16px;margin-top:8px;font-size:13px;">';
        html += '<span>Proposed by: <strong>' + proposerName + '</strong> (#' + proposerNumber + ')</span>';
        if (motion.seconded_by) {
            html += '<span>Seconded by: ' + seconderName + '</span>';
        }
        html += '<span>Status: <span class="badge badge-' + (motion.status === 'passed' ? 'success' : motion.status === 'failed' ? 'danger' : 'warning') + '">' + motion.status + '</span></span>';
        html += '</div>';
        
        if (isAdmin && motion.status === 'proposed') {
            html += '<div style="display:flex;gap:8px;margin-top:8px;">';
            html += '<button class="btn btn-sm btn-success" onclick="voteMotion(\'' + motion.id + '\', \'for\')"><i class="fas fa-thumbs-up"></i> For (' + motion.votes_for + ')</button>';
            html += '<button class="btn btn-sm btn-danger" onclick="voteMotion(\'' + motion.id + '\', \'against\')"><i class="fas fa-thumbs-down"></i> Against (' + motion.votes_against + ')</button>';
            html += '<button class="btn btn-sm btn-outline" onclick="voteMotion(\'' + motion.id + '\', \'abstain\')"><i class="fas fa-minus"></i> Abstain (' + motion.votes_abstain + ')</button>';
            html += '</div>';
        }
        if (motion.status === 'passed') {
            html += '<div style="color:var(--success);font-weight:600;margin-top:4px;">✅ Motion Passed!</div>';
        }
        if (motion.status === 'failed') {
            html += '<div style="color:var(--danger);font-weight:600;margin-top:4px;">❌ Motion Failed</div>';
        }
        html += '</div>';
    }
    
    return html;
}

// ===================== EXPOSE GLOBALLY =====================

window.openMeetingDetail = openMeetingDetail;
window.openMeetingDetailLegacy = openMeetingDetailLegacy;
window.renderMeetingDetailLegacy = renderMeetingDetailLegacy;

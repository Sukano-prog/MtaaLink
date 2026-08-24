// MtaaLink - Meeting Print Function
// Prints the complete meeting report

async function printFullMeeting(meetingId) {
    try {
        const token = localStorage.getItem('token');
        
        // Fetch all meeting data
        const meetingRes = await fetch(`/api/v1/meetings/${meetingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!meetingRes.ok) throw new Error('Failed to load meeting');
        const data = await meetingRes.json();
        
        const meeting = data.meeting;
        const attendance = data.attendance || [];
        const actionItems = data.action_items || [];
        const motions = data.motions || [];
        const presentCount = data.present_count || 0;
        
        // Get agenda
        let agenda = [];
        try {
            const agendaRes = await fetch(`/api/v1/formal-meetings/${meetingId}/agenda`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (agendaRes.ok) agenda = await agendaRes.json();
        } catch (e) {}
        
        // Get minutes
        let minutes = null;
        let minutesText = '';
        try {
            const minutesRes = await fetch(`/api/v1/formal-meetings/${meetingId}/minutes?latest=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (minutesRes.ok) {
                const mData = await minutesRes.json();
                minutes = Array.isArray(mData) && mData.length > 0 ? mData[0] : mData;
                if (minutes && minutes.content) {
                    if (typeof minutes.content === 'string') {
                        minutesText = minutes.content;
                    } else {
                        minutesText = JSON.stringify(minutes.content, null, 2);
                    }
                }
            }
        } catch (e) {}
        
        // Create print window
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) {
            showToast('Please allow popups to print', 'warning');
            return;
        }
        
        let html = '';
        html += `<!DOCTYPE html><html><head><title>Meeting Report - ${meeting.title}</title>`;
        html += `<meta charset="UTF-8"><style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 1000px; margin: 0 auto; line-height: 1.6; color: #000; background: #fff; }
            
            /* Header */
            .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 24px; }
            .header h1 { font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
            .header h2 { font-size: 20px; margin: 6px 0; color: #333; }
            .header p { font-size: 14px; color: #555; margin: 4px 0; }
            .header .badge { display: inline-block; padding: 2px 12px; border: 1px solid #000; border-radius: 3px; font-size: 12px; font-weight: 600; margin: 4px 4px; }
            
            /* Sections */
            .section { margin-bottom: 20px; }
            .section-title { font-weight: 700; font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
            
            /* Info Grid */
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-bottom: 8px; font-size: 14px; }
            .info-grid .label { font-weight: 600; }
            
            /* Tables */
            table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 13px; }
            th { background: #f0f0f0; border: 1px solid #000; padding: 6px 10px; text-align: left; font-weight: 700; }
            td { border: 1px solid #000; padding: 6px 10px; }
            .present { background: #d4edda; }
            .absent { background: #f8d7da; }
            .badge { display: inline-block; padding: 1px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; }
            .badge-success { background: #d4edda; color: #155724; }
            .badge-warning { background: #fff3cd; color: #856404; }
            .badge-danger { background: #f8d7da; color: #721c24; }
            .badge-info { background: #d1ecf1; color: #0c5460; }
            .badge-secondary { background: #e9ecef; color: #6c757d; }
            
            /* Agenda Items */
            .agenda-item { padding: 6px 0; border-bottom: 1px solid #eee; }
            .agenda-number { font-weight: 700; display: inline-block; width: 30px; }
            
            /* Motions & Actions */
            .motion-item, .action-item { padding: 8px 0; border-bottom: 1px solid #eee; }
            
            /* Minutes */
            .minutes-content { white-space: pre-wrap; font-size: 13px; padding: 12px; background: #f9f9f9; border: 1px solid #eee; border-radius: 4px; min-height: 100px; }
            
            /* Signatures */
            .signatures { margin-top: 30px; padding-top: 20px; border-top: 2px solid #000; display: flex; justify-content: space-between; }
            .signature-line { display: inline-block; width: 200px; border-bottom: 1px solid #000; margin: 0 20px; }
            
            /* Footer */
            .footer { text-align: center; font-size: 11px; color: #999; margin-top: 30px; padding-top: 16px; border-top: 1px solid #ddd; }
            
            /* Responsive */
            @media print {
                body { padding: 20px; }
                .no-print { display: none; }
            }
            @media (max-width: 600px) {
                .info-grid { grid-template-columns: 1fr; }
                .signatures { flex-direction: column; gap: 20px; }
                table { font-size: 11px; }
                th, td { padding: 4px 6px; }
            }
        </style></head><body>`;
        
        // ============================================================
        // HEADER
        // ============================================================
        html += `<div class="header">
            <h1>VILLAGE MEETING REPORT</h1>
            <h2>${meeting.title}</h2>
            <p>📅 ${meeting.date} at ${meeting.time}${meeting.end_time ? ` - ${meeting.end_time}` : ''}</p>
            <p>📍 ${meeting.location || 'Village Hall'}</p>
            <p>
                <span class="badge">#${meeting.meeting_number || 'N/A'}</span>
                <span class="badge">${meeting.category || 'General'}</span>
                <span class="badge">${meeting.meeting_type || 'Ordinary'}</span>
                <span class="badge">${meeting.status.toUpperCase()}</span>
                ${meeting.is_archived ? '<span class="badge">📦 ARCHIVED</span>' : ''}
            </p>
        </div>`;
        
        // ============================================================
        // MEETING INFORMATION
        // ============================================================
        html += `<div class="section">
            <div class="section-title">Meeting Information</div>
            <div class="info-grid">
                <div><span class="label">Chairperson:</span> ${meeting.chairperson_name || 'Not assigned'}</div>
                <div><span class="label">Secretary:</span> ${meeting.secretary_name || 'Not assigned'}</div>
                <div><span class="label">Quorum Required:</span> ${meeting.quorum_required}</div>
                <div><span class="label">Present:</span> ${presentCount} members</div>
                <div><span class="label">Quorum Met:</span> ${presentCount >= meeting.quorum_required ? '✅ YES' : '❌ NO'}</div>
                <div><span class="label">Total Members:</span> ${attendance.length}</div>
            </div>
            ${meeting.description ? `<div style="padding:10px;background:#f9f9f9;border-radius:4px;margin-top:6px;">${meeting.description}</div>` : ''}
        </div>`;
        
        // ============================================================
        // AGENDA
        // ============================================================
        if (agenda && agenda.length > 0) {
            html += `<div class="section">
                <div class="section-title">Agenda</div>`;
            for (let i = 0; i < agenda.length; i++) {
                const item = agenda[i];
                const statusColors = {
                    'completed': 'success',
                    'current': 'warning',
                    'pending': 'secondary',
                    'skipped': 'danger'
                };
                html += `<div class="agenda-item">
                    <div><span class="agenda-number">${item.item_number}.</span> <strong>${item.title}</strong>
                        <span class="badge badge-${statusColors[item.status] || 'secondary'}">${item.status}</span>
                    </div>
                    ${item.description ? `<div style="padding-left:34px;font-size:13px;color:#555;">${item.description}</div>` : ''}
                    ${item.discussion_notes ? `<div style="padding-left:34px;font-size:13px;color:#555;">📝 ${item.discussion_notes}</div>` : ''}
                    ${item.resolution ? `<div style="padding-left:34px;font-size:13px;color:#155724;">✅ Resolution: ${item.resolution}</div>` : ''}
                    ${item.estimated_duration_minutes ? `<div style="padding-left:34px;font-size:12px;color:#999;">⏱️ ${item.estimated_duration_minutes}min</div>` : ''}
                </div>`;
            }
            html += `</div>`;
        }
        
        // ============================================================
        // ATTENDANCE
        // ============================================================
        if (attendance && attendance.length > 0) {
            const present = attendance.filter(a => a.attended);
            const absent = attendance.filter(a => !a.attended);
            
            html += `<div class="section">
                <div class="section-title">Attendance (${present.length} present / ${attendance.length} total)</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:13px;margin-bottom:8px;">
                    <div><span class="label">Present:</span> ${present.length}</div>
                    <div><span class="label">Absent:</span> ${absent.length}</div>
                </div>
                <table>
                    <thead><tr><th>#</th><th>Member</th><th>Member #</th><th>Status</th><th>Check-in Time</th></tr></thead>
                    <tbody>`;
            let count = 1;
            for (let i = 0; i < present.length; i++) {
                const a = present[i];
                html += `<tr class="present">
                    <td>${count}</td>
                    <td>${a.member_name || 'Unknown'}</td>
                    <td>${a.member_number || 'N/A'}</td>
                    <td>✅ Present</td>
                    <td>${a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString() : ''}</td>
                </tr>`;
                count++;
            }
            for (let i = 0; i < absent.length; i++) {
                const a = absent[i];
                html += `<tr class="absent">
                    <td>${count}</td>
                    <td>${a.member_name || 'Unknown'}</td>
                    <td>${a.member_number || 'N/A'}</td>
                    <td>❌ Absent</td>
                    <td>-</td>
                </tr>`;
                count++;
            }
            html += `</tbody></table></div>`;
        }
        
        // ============================================================
        // MOTIONS
        // ============================================================
        if (motions && motions.length > 0) {
            html += `<div class="section">
                <div class="section-title">Motions (${motions.length})</div>
                <table>
                    <thead><tr><th>#</th><th>Motion</th><th>Proposed By</th><th>Seconded By</th><th>Votes</th><th>Status</th></tr></thead>
                    <tbody>`;
            for (let i = 0; i < motions.length; i++) {
                const m = motions[i];
                const statusColors = {
                    'passed': 'success',
                    'failed': 'danger',
                    'proposed': 'warning',
                    'debated': 'info',
                    'voted': 'info'
                };
                html += `<tr>
                    <td>${i + 1}</td>
                    <td><strong>${m.title}</strong><br><small>${m.description || ''}</small></td>
                    <td>${m.proposer_name || m.proposed_by || 'Unknown'}</td>
                    <td>${m.seconder_name || m.seconded_by || '—'}</td>
                    <td>${m.votes_for || 0} For / ${m.votes_against || 0} Against / ${m.votes_abstain || 0} Abstain</td>
                    <td><span class="badge badge-${statusColors[m.status] || 'secondary'}">${m.status}</span></td>
                </tr>`;
            }
            html += `</tbody></table></div>`;
        }
        
        // ============================================================
        // ACTION ITEMS
        // ============================================================
        if (actionItems && actionItems.length > 0) {
            html += `<div class="section">
                <div class="section-title">Action Items (${actionItems.length})</div>
                <table>
                    <thead><tr><th>#</th><th>Description</th><th>Assigned To</th><th>Due Date</th><th>Status</th></tr></thead>
                    <tbody>`;
            for (let i = 0; i < actionItems.length; i++) {
                const item = actionItems[i];
                const statusColors = {
                    'completed': 'success',
                    'in_progress': 'warning',
                    'pending': 'secondary',
                    'overdue': 'danger',
                    'cancelled': 'danger'
                };
                html += `<tr>
                    <td>${i + 1}</td>
                    <td>${item.description}</td>
                    <td>${item.assignee_name || item.assigned_to || 'Unassigned'}</td>
                    <td>${item.due_date || '—'}</td>
                    <td><span class="badge badge-${statusColors[item.status] || 'secondary'}">${item.status}</span></td>
                </tr>`;
            }
            html += `</tbody></table></div>`;
        }
        
        // ============================================================
        // MINUTES
        // ============================================================
        if (minutes) {
            html += `<div class="section">
                <div class="section-title">Minutes (v${minutes.version}) - ${minutes.status.toUpperCase()}</div>
                ${minutes.is_final ? '<div style="color:#28a745;font-weight:600;margin-bottom:6px;">✅ FINAL VERSION</div>' : ''}
                <div class="minutes-content">${minutesText || 'Minutes content not available'}</div>
                <div style="display:flex;gap:20px;margin-top:8px;font-size:13px;flex-wrap:wrap;">
                    <div>${minutes.chairperson_signed ? '✅' : '⏳'} Chairperson: ${minutes.chairperson_signed_at ? new Date(minutes.chairperson_signed_at).toLocaleDateString() : 'Not signed'}</div>
                    <div>${minutes.secretary_signed ? '✅' : '⏳'} Secretary: ${minutes.secretary_signed_at ? new Date(minutes.secretary_signed_at).toLocaleDateString() : 'Not signed'}</div>
                    ${minutes.approved_at ? `<div>✅ Approved: ${new Date(minutes.approved_at).toLocaleDateString()}</div>` : ''}
                </div>
            </div>`;
        } else {
            html += `<div class="section">
                <div class="section-title">Minutes</div>
                <p style="color:#999;font-style:italic;">Minutes have not been drafted yet.</p>
            </div>`;
        }
        
        // ============================================================
        // SIGNATURES
        // ============================================================
        html += `<div class="signatures">
            <div>
                <span class="label">Chairperson:</span><br>
                <span class="signature-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                <br><span style="font-size:13px;">${meeting.chairperson_name || '_________________'}</span>
                ${minutes && minutes.chairperson_signed ? `<br><span style="font-size:11px;color:#28a745;">✅ Signed on ${new Date(minutes.chairperson_signed_at).toLocaleDateString()}</span>` : ''}
            </div>
            <div>
                <span class="label">Secretary:</span><br>
                <span class="signature-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                <br><span style="font-size:13px;">${meeting.secretary_name || '_________________'}</span>
                ${minutes && minutes.secretary_signed ? `<br><span style="font-size:11px;color:#28a745;">✅ Signed on ${new Date(minutes.secretary_signed_at).toLocaleDateString()}</span>` : ''}
            </div>
        </div>`;
        
        // ============================================================
        // FOOTER
        // ============================================================
        html += `<div class="footer">
            Generated on ${new Date().toLocaleString()} · MtaaLink Village Management System
            <br>This is an official document of ${meeting.village_name || 'the village'}
        </div>`;
        
        html += `</body></html>`;
        
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
        
    } catch (error) {
        showToast('Error printing: ' + error.message, 'error');
        console.error('Print error:', error);
    }
}

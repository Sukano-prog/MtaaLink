/* ============================================================
   Management System - Reports Page
   ============================================================ */

import { getMembers, getMeetings, getContributions, getGroups, getProjects, getEvents, getAnnouncements } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showModal, showConfirm, showFormModal } from '../components/modal.js';

let reportData = {
    members: null,
    meetings: null,
    contributions: null,
    groups: null,
    projects: null,
    events: null,
    announcements: null
};

export async function renderReports() {
    const content = document.getElementById('pageContent');
    
    try {
        content.innerHTML = `
            <div class="page-header">
                <h2>Reports</h2>
                <span style="font-size:var(--font-size-sm);color:var(--gray-500);">Export PDF reports for all organization activities</span>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
                <div class="card">
                    <div class="card-header">
                        <h3>Members</h3>
                    </div>
                    <div class="card-body">
                        <p style="font-size:var(--font-size-sm);color:var(--gray-500);">View and export member directory</p>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                            <button class="btn btn-sm btn-primary" onclick="window.viewMemberReport()">View</button>
                            <button class="btn btn-sm btn-success" onclick="window.exportMemberPDF()">PDF</button>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Groups</h3>
                    </div>
                    <div class="card-body">
                        <p style="font-size:var(--font-size-sm);color:var(--gray-500);">Group member counts and details</p>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                            <button class="btn btn-sm btn-primary" onclick="window.viewGroupReport()">View</button>
                            <button class="btn btn-sm btn-success" onclick="window.exportGroupPDF()">PDF</button>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Meetings</h3>
                    </div>
                    <div class="card-body">
                        <p style="font-size:var(--font-size-sm);color:var(--gray-500);">Meeting history and attendance</p>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                            <button class="btn btn-sm btn-primary" onclick="window.viewMeetingReport()">View</button>
                            <button class="btn btn-sm btn-success" onclick="window.exportMeetingPDF()">PDF</button>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Projects</h3>
                    </div>
                    <div class="card-body">
                        <p style="font-size:var(--font-size-sm);color:var(--gray-500);">Project progress, budget, milestones</p>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                            <button class="btn btn-sm btn-primary" onclick="window.viewProjectReport()">View</button>
                            <button class="btn btn-sm btn-success" onclick="window.exportProjectPDF()">PDF</button>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Events</h3>
                    </div>
                    <div class="card-body">
                        <p style="font-size:var(--font-size-sm);color:var(--gray-500);">Event attendance and contributions</p>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                            <button class="btn btn-sm btn-primary" onclick="window.viewEventReport()">View</button>
                            <button class="btn btn-sm btn-success" onclick="window.exportEventPDF()">PDF</button>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Contributions</h3>
                    </div>
                    <div class="card-body">
                        <p style="font-size:var(--font-size-sm);color:var(--gray-500);">Financial summary and payments</p>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                            <button class="btn btn-sm btn-primary" onclick="window.viewContributionReport()">View</button>
                            <button class="btn btn-sm btn-success" onclick="window.exportContributionPDF()">PDF</button>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Announcements</h3>
                    </div>
                    <div class="card-body">
                        <p style="font-size:var(--font-size-sm);color:var(--gray-500);">Delivery statistics and read rates</p>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                            <button class="btn btn-sm btn-primary" onclick="window.viewAnnouncementReport()">View</button>
                            <button class="btn btn-sm btn-success" onclick="window.exportAnnouncementPDF()">PDF</button>
                        </div>
                    </div>
                </div>
                
                <div class="card" style="grid-column:span 1;">
                    <div class="card-header">
                        <h3>Organization Summary</h3>
                    </div>
                    <div class="card-body">
                        <p style="font-size:var(--font-size-sm);color:var(--gray-500);">Complete organization overview</p>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                            <button class="btn btn-sm btn-primary" onclick="window.viewSummaryReport()">View</button>
                            <button class="btn btn-sm btn-success" onclick="window.exportSummaryPDF()">PDF</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="reportPreview" style="margin-top:20px;display:none;">
                <div class="card">
                    <div class="card-header">
                        <h3 id="reportPreviewTitle">Report Preview</h3>
                        <button class="btn btn-sm btn-outline" onclick="window.closeReportPreview()">Close</button>
                    </div>
                    <div class="card-body" id="reportPreviewContent">
                    </div>
                </div>
            </div>
        `;
        
        window.viewMemberReport = viewMemberReport;
        window.viewGroupReport = viewGroupReport;
        window.viewMeetingReport = viewMeetingReport;
        window.viewProjectReport = viewProjectReport;
        window.viewEventReport = viewEventReport;
        window.viewContributionReport = viewContributionReport;
        window.viewAnnouncementReport = viewAnnouncementReport;
        window.viewSummaryReport = viewSummaryReport;
        
        window.exportMemberPDF = exportMemberPDF;
        window.exportGroupPDF = exportGroupPDF;
        window.exportMeetingPDF = exportMeetingPDF;
        window.exportProjectPDF = exportProjectPDF;
        window.exportEventPDF = exportEventPDF;
        window.exportContributionPDF = exportContributionPDF;
        window.exportAnnouncementPDF = exportAnnouncementPDF;
        window.exportSummaryPDF = exportSummaryPDF;
        
        window.closeReportPreview = closeReportPreview;
        
    } catch (error) {
        content.innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load reports: ${error.message}</p>
                <button class="btn btn-primary" onclick="renderReports()">Retry</button>
            </div></div>
        `;
    }
}

async function viewMemberReport() {
    try {
        const data = await getMembers();
        showReportPreview('Member Report', `
            <div style="overflow-x:auto;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div class="stat-card"><div class="stat-label">Total Members</div><div class="stat-value">${data.length}</div></div>
                    <div class="stat-card"><div class="stat-label">Active</div><div class="stat-value">${data.filter(m => m.is_active).length}</div></div>
                    <div class="stat-card"><div class="stat-label">Inactive</div><div class="stat-value">${data.filter(m => !m.is_active).length}</div></div>
                </div>
                <table class="table">
                    <thead><tr><th>#</th><th>Name</th><th>Member ID</th><th>Phone</th><th>Role</th><th>Status</th></tr></thead>
                    <tbody>
                        ${data.map(function(m, i) {
                            return `<tr>
                                <td>${i + 1}</td>
                                <td>${m.full_name || m.first_name + ' ' + m.last_name}</td>
                                <td>${m.member_number || 'N/A'}</td>
                                <td>${m.phone || '-'}</td>
                                <td><span class="badge badge-primary">${m.role || 'member'}</span></td>
                                <td><span class="badge ${m.is_active ? 'badge-success' : 'badge-danger'}">${m.is_active ? 'Active' : 'Inactive'}</span></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `);
    } catch (error) {
        showError('Failed to load member report: ' + error.message);
    }
}

async function viewGroupReport() {
    try {
        const data = await getGroups();
        showReportPreview('Group Report', `
            <div style="overflow-x:auto;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div class="stat-card"><div class="stat-label">Total Groups</div><div class="stat-value">${data.length}</div></div>
                    <div class="stat-card"><div class="stat-label">Total Members in Groups</div><div class="stat-value">${data.reduce((sum, g) => sum + (g.member_count || 0), 0)}</div></div>
                </div>
                <table class="table">
                    <thead><tr><th>#</th><th>Group Name</th><th>Members</th><th>Description</th></tr></thead>
                    <tbody>
                        ${data.map(function(g, i) {
                            return `<tr>
                                <td>${i + 1}</td>
                                <td><strong>${g.name}</strong></td>
                                <td>${g.member_count || 0}</td>
                                <td>${g.description || '-'}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `);
    } catch (error) {
        showError('Failed to load group report: ' + error.message);
    }
}

async function viewMeetingReport() {
    try {
        const data = await getMeetings();
        const total = data.length;
        const completed = data.filter(m => m.status === 'completed').length;
        const scheduled = data.filter(m => m.status === 'scheduled').length;
        const ongoing = data.filter(m => m.status === 'ongoing').length;
        
        showReportPreview('Meeting Report', `
            <div style="overflow-x:auto;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value">${total}</div></div>
                    <div class="stat-card"><div class="stat-label">Completed</div><div class="stat-value">${completed}</div></div>
                    <div class="stat-card"><div class="stat-label">Scheduled</div><div class="stat-value">${scheduled}</div></div>
                    <div class="stat-card"><div class="stat-label">Ongoing</div><div class="stat-value">${ongoing}</div></div>
                </div>
                <table class="table">
                    <thead><tr><th>#</th><th>Title</th><th>Date</th><th>Status</th><th>Attendance</th></tr></thead>
                    <tbody>
                        ${data.map(function(m, i) {
                            return `<tr>
                                <td>${i + 1}</td>
                                <td>${m.title}</td>
                                <td>${m.date}</td>
                                <td><span class="badge badge-${m.status === 'completed' ? 'success' : m.status === 'scheduled' ? 'primary' : 'warning'}">${m.status}</span></td>
                                <td>${m.attendance_count || 0}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `);
    } catch (error) {
        showError('Failed to load meeting report: ' + error.message);
    }
}

async function viewProjectReport() {
    try {
        const data = await getProjects();
        const total = data.length;
        const completed = data.filter(p => p.status === 'completed').length;
        const ongoing = data.filter(p => p.status === 'ongoing').length;
        const planning = data.filter(p => p.status === 'planning').length;
        const totalBudget = data.reduce((sum, p) => sum + (p.budget || 0), 0);
        const totalSpent = data.reduce((sum, p) => sum + (p.amount_spent || 0), 0);
        
        showReportPreview('Project Report', `
            <div style="overflow-x:auto;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div class="stat-card"><div class="stat-label">Total Projects</div><div class="stat-value">${total}</div></div>
                    <div class="stat-card"><div class="stat-label">Completed</div><div class="stat-value">${completed}</div></div>
                    <div class="stat-card"><div class="stat-label">Ongoing</div><div class="stat-value">${ongoing}</div></div>
                    <div class="stat-card"><div class="stat-label">Planning</div><div class="stat-value">${planning}</div></div>
                    <div class="stat-card"><div class="stat-label">Total Budget</div><div class="stat-value">KES ${totalBudget.toLocaleString()}</div></div>
                    <div class="stat-card"><div class="stat-label">Total Spent</div><div class="stat-value">KES ${totalSpent.toLocaleString()}</div></div>
                </div>
                <table class="table">
                    <thead><tr><th>#</th><th>Project</th><th>Status</th><th>Progress</th><th>Budget</th><th>Spent</th></tr></thead>
                    <tbody>
                        ${data.map(function(p, i) {
                            return `<tr>
                                <td>${i + 1}</td>
                                <td><strong>${p.title}</strong></td>
                                <td><span class="badge badge-${p.status === 'completed' ? 'success' : p.status === 'ongoing' ? 'warning' : 'gray'}">${p.status}</span></td>
                                <td><div style="background:var(--gray-200);border-radius:4px;height:6px;width:80px;overflow:hidden;display:inline-block;vertical-align:middle;">
                                    <div style="background:var(--primary);height:100%;width:${p.progress || 0}%;"></div>
                                </div> ${p.progress || 0}%</td>
                                <td>KES ${(p.budget || 0).toLocaleString()}</td>
                                <td>KES ${(p.amount_spent || 0).toLocaleString()}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `);
    } catch (error) {
        showError('Failed to load project report: ' + error.message);
    }
}

async function viewEventReport() {
    try {
        const data = await getEvents();
        const total = data.length;
        const completed = data.filter(e => e.status === 'completed').length;
        const upcoming = data.filter(e => e.status === 'upcoming').length;
        const totalAttendees = data.reduce((sum, e) => sum + (e.attendance_count || 0), 0);
        const totalContrib = data.reduce((sum, e) => sum + (e.total_contributions || 0), 0);
        
        showReportPreview('Event Report', `
            <div style="overflow-x:auto;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div class="stat-card"><div class="stat-label">Total Events</div><div class="stat-value">${total}</div></div>
                    <div class="stat-card"><div class="stat-label">Completed</div><div class="stat-value">${completed}</div></div>
                    <div class="stat-card"><div class="stat-label">Upcoming</div><div class="stat-value">${upcoming}</div></div>
                    <div class="stat-card"><div class="stat-label">Total Attendees</div><div class="stat-value">${totalAttendees}</div></div>
                    <div class="stat-card"><div class="stat-label">Total Contributions</div><div class="stat-value">KES ${totalContrib.toLocaleString()}</div></div>
                </div>
                <table class="table">
                    <thead><tr><th>#</th><th>Title</th><th>Type</th><th>Date</th><th>Status</th><th>Attendees</th><th>Contributions</th></tr></thead>
                    <tbody>
                        ${data.map(function(e, i) {
                            return `<tr>
                                <td>${i + 1}</td>
                                <td><strong>${e.title}</strong></td>
                                <td>${e.event_type}</td>
                                <td>${e.date}</td>
                                <td><span class="badge badge-${e.status === 'completed' ? 'success' : e.status === 'upcoming' ? 'primary' : 'warning'}">${e.status}</span></td>
                                <td>${e.attendance_count || 0}</td>
                                <td>KES ${(e.total_contributions || 0).toLocaleString()}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `);
    } catch (error) {
        showError('Failed to load event report: ' + error.message);
    }
}

async function viewContributionReport() {
    try {
        const data = await getContributions();
        const contributions = data.contributions || [];
        let totalAmount = 0;
        let totalPaid = 0;
        let pending = 0;
        let paid = 0;
        
        contributions.forEach(function(c) {
            totalAmount += parseFloat(c.amount || 0);
            totalPaid += parseFloat(c.paid_amount || 0);
            if (c.status === 'pending') pending++;
            if (c.status === 'paid') paid++;
        });
        
        showReportPreview('Contribution Report', `
            <div style="overflow-x:auto;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div class="stat-card"><div class="stat-label">Total Contributions</div><div class="stat-value">${contributions.length}</div></div>
                    <div class="stat-card"><div class="stat-label">Total Amount</div><div class="stat-value">KES ${totalAmount.toLocaleString()}</div></div>
                    <div class="stat-card"><div class="stat-label">Total Paid</div><div class="stat-value">KES ${totalPaid.toLocaleString()}</div></div>
                    <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value">${pending}</div></div>
                </div>
                <table class="table">
                    <thead><tr><th>#</th><th>Member</th><th>Amount</th><th>Paid</th><th>Status</th></tr></thead>
                    <tbody>
                        ${contributions.map(function(c, i) {
                            return `<tr>
                                <td>${i + 1}</td>
                                <td>${c.member_name || 'Unknown'}</td>
                                <td>KES ${(c.amount || 0).toLocaleString()}</td>
                                <td>KES ${(c.paid_amount || 0).toLocaleString()}</td>
                                <td><span class="badge badge-${c.status === 'paid' ? 'success' : c.status === 'pending' ? 'warning' : 'danger'}">${c.status || 'pending'}</span></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `);
    } catch (error) {
        showError('Failed to load contribution report: ' + error.message);
    }
}

async function viewAnnouncementReport() {
    try {
        const data = await getAnnouncements();
        const total = data.length;
        const sent = data.filter(a => a.status === 'sent').length;
        const draft = data.filter(a => a.status === 'draft').length;
        const totalDeliveries = data.reduce((sum, a) => sum + (a.delivery_count || 0), 0);
        
        showReportPreview('Announcement Report', `
            <div style="overflow-x:auto;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div class="stat-card"><div class="stat-label">Total Announcements</div><div class="stat-value">${total}</div></div>
                    <div class="stat-card"><div class="stat-label">Sent</div><div class="stat-value">${sent}</div></div>
                    <div class="stat-card"><div class="stat-label">Draft</div><div class="stat-value">${draft}</div></div>
                    <div class="stat-card"><div class="stat-label">Total Deliveries</div><div class="stat-value">${totalDeliveries}</div></div>
                </div>
                <table class="table">
                    <thead><tr><th>#</th><th>Title</th><th>Status</th><th>Sent Via</th><th>Deliveries</th></tr></thead>
                    <tbody>
                        ${data.map(function(a, i) {
                            return `<tr>
                                <td>${i + 1}</td>
                                <td><strong>${a.title}</strong></td>
                                <td><span class="badge badge-${a.status === 'sent' ? 'success' : 'gray'}">${a.status}</span></td>
                                <td>${a.sent_via || 'SMS'}</td>
                                <td>${a.delivery_count || 0}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `);
    } catch (error) {
        showError('Failed to load announcement report: ' + error.message);
    }
}

async function viewSummaryReport() {
    try {
        const [members, groups, meetings, projects, events, contributions, announcements] = await Promise.all([
            getMembers().catch(() => []),
            getGroups().catch(() => []),
            getMeetings().catch(() => []),
            getProjects().catch(() => []),
            getEvents().catch(() => []),
            getContributions().catch(() => ({ contributions: [] })),
            getAnnouncements().catch(() => [])
        ]);
        
        const contribData = contributions.contributions || [];
        const totalContrib = contribData.reduce((sum, c) => sum + parseFloat(c.paid_amount || 0), 0);
        
        showReportPreview('Organization Summary Report', `
            <div style="overflow-x:auto;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div class="stat-card"><div class="stat-label">Members</div><div class="stat-value">${members.length}</div></div>
                    <div class="stat-card"><div class="stat-label">Groups</div><div class="stat-value">${groups.length}</div></div>
                    <div class="stat-card"><div class="stat-label">Meetings</div><div class="stat-value">${meetings.length}</div></div>
                    <div class="stat-card"><div class="stat-label">Projects</div><div class="stat-value">${projects.length}</div></div>
                    <div class="stat-card"><div class="stat-label">Events</div><div class="stat-value">${events.length}</div></div>
                    <div class="stat-card"><div class="stat-label">Announcements</div><div class="stat-value">${announcements.length}</div></div>
                    <div class="stat-card"><div class="stat-label">Total Contributions</div><div class="stat-value">KES ${totalContrib.toLocaleString()}</div></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="card"><div class="card-header"><h4>Project Status</h4></div><div class="card-body">
                        <div>Completed: ${projects.filter(p => p.status === 'completed').length}</div>
                        <div>Ongoing: ${projects.filter(p => p.status === 'ongoing').length}</div>
                        <div>Planning: ${projects.filter(p => p.status === 'planning').length}</div>
                    </div></div>
                    <div class="card"><div class="card-header"><h4>Meeting Status</h4></div><div class="card-body">
                        <div>Completed: ${meetings.filter(m => m.status === 'completed').length}</div>
                        <div>Scheduled: ${meetings.filter(m => m.status === 'scheduled').length}</div>
                        <div>Ongoing: ${meetings.filter(m => m.status === 'ongoing').length}</div>
                    </div></div>
                </div>
            </div>
        `);
    } catch (error) {
        showError('Failed to load summary report: ' + error.message);
    }
}

function exportMemberPDF() { downloadPDF('/reports/export/members/pdf', 'members_report'); }
function exportGroupPDF() { downloadPDF('/reports/export/groups/pdf', 'groups_report'); }
function exportMeetingPDF() { downloadPDF('/reports/export/meetings/pdf', 'meetings_report'); }
function exportProjectPDF() { downloadPDF('/reports/export/projects/pdf', 'projects_report'); }
function exportEventPDF() { downloadPDF('/reports/export/events/pdf', 'events_report'); }
function exportContributionPDF() { downloadPDF('/reports/export/contributions/pdf', 'contributions_report'); }
function exportAnnouncementPDF() { downloadPDF('/reports/export/announcements/pdf', 'announcements_report'); }
function exportSummaryPDF() { downloadPDF('/reports/export/summary/pdf', 'organization_summary'); }

function downloadPDF(endpoint, filename) {
    const token = localStorage.getItem('token');
    
    fetch('/api/v1' + endpoint, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(function(response) {
        if (!response.ok) {
            return response.json().then(function(err) {
                throw new Error(err.detail || 'Failed to generate PDF');
            });
        }
        return response.blob();
    })
    .then(function(blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('PDF downloaded successfully!');
    })
    .catch(function(error) {
        showError(error.message || 'Failed to download PDF');
    });
}

function showReportPreview(title, content) {
    const preview = document.getElementById('reportPreview');
    const titleEl = document.getElementById('reportPreviewTitle');
    const contentEl = document.getElementById('reportPreviewContent');
    
    if (preview) {
        preview.style.display = 'block';
        if (titleEl) titleEl.textContent = title;
        if (contentEl) contentEl.innerHTML = content;
        preview.scrollIntoView({ behavior: 'smooth' });
    }
}

function closeReportPreview() {
    const preview = document.getElementById('reportPreview');
    if (preview) {
        preview.style.display = 'none';
    }
}

window.renderReports = renderReports;

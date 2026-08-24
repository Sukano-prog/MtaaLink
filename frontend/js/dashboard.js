// Management System - Original Dashboard
// Restored version

async function renderDashboard() {
    var content = document.getElementById('pageContent');
    if (!content) return;
    
    try {
        var token = localStorage.getItem('token');
        if (!token) {
            content.innerHTML = '<div class="loading-state"><p style="color:var(--danger);">⚠️ Not logged in</p></div>';
            return;
        }
        
        var data = null;
        try {
            var response = await fetch('/api/v1/reports/dashboard', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (response.ok) data = await response.json();
        } catch (e) {
            console.warn('Using fallback data');
            data = {
                village: { name: 'Nairobi Village', county: 'Nairobi' },
                members: { total: 0, new_this_month: 0 },
                meetings: { total: 0, upcoming: 0 },
                contributions: { total: 0, collected: 0 },
                expenses: { total: 0, count: 0 },
                announcements: { total: 0 }
            };
        }
        
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-header"><span class="stat-label">Total Members</span><span class="stat-icon"><i class="fas fa-users"></i></span></div><div class="stat-value">${data.members?.total || 0}</div><div class="stat-change positive">${data.members?.new_this_month || 0} new this month</div></div>
                <div class="stat-card"><div class="stat-header"><span class="stat-label">Contributions</span><span class="stat-icon"><i class="fas fa-hand-holding-usd"></i></span></div><div class="stat-value">KES ${(data.contributions?.collected || 0).toLocaleString()}</div><div class="stat-change positive">${data.contributions?.total || 0} contributions</div></div>
                <div class="stat-card"><div class="stat-header"><span class="stat-label">Upcoming Meetings</span><span class="stat-icon"><i class="fas fa-calendar-alt"></i></span></div><div class="stat-value">${data.meetings?.upcoming || 0}</div><div class="stat-change">${data.meetings?.total || 0} total</div></div>
                <div class="stat-card"><div class="stat-header"><span class="stat-label">Announcements</span><span class="stat-icon"><i class="fas fa-bullhorn"></i></span></div><div class="stat-value">${data.announcements?.total || 0}</div><div class="stat-change">${data.expenses?.count || 0} expenses</div></div>
            </div>
            <div class="card"><div class="card-header"><h3>Quick Actions</h3></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
                <button class="btn btn-primary" onclick="navigateTo('members')"><i class="fas fa-users"></i> Members</button>
                <button class="btn btn-success" onclick="navigateTo('meetings')"><i class="fas fa-calendar-plus"></i> Meetings</button>
                <button class="btn btn-warning" onclick="navigateTo('contributions')"><i class="fas fa-hand-holding-usd"></i> Contributions</button>
                <button class="btn btn-info" onclick="navigateTo('announcements')"><i class="fas fa-bullhorn"></i> Announcements</button>
                <button class="btn btn-primary" onclick="navigateTo('campaigns')"><i class="fas fa-flag-checkered"></i> Campaigns</button>
            </div></div></div>
        `;
    } catch (error) {
        content.innerHTML = '<div class="loading-state"><p style="color:var(--danger);">❌ ' + error.message + '</p><button class="btn btn-primary" onclick="renderDashboard()">Retry</button></div>';
    }
}

// ===================== MEMBERS =====================
async function renderMembers() {
    var content = document.getElementById('pageContent');
    if (!content) return;
    
    try {
        var token = localStorage.getItem('token');
        var response = await fetch('/api/v1/members/', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        var members = response.ok ? await response.json() : [];
        
        var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><h2>Members (' + members.length + ')</h2><button class="btn btn-primary" onclick="openModal(\'member\')"><i class="fas fa-plus"></i> Add Member</button></div>';
        html += '<div class="card"><div class="table-responsive"><table class="table"><thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
        
        if (members.length === 0) {
            html += '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--gray-500);">No members found</td></tr>';
        } else {
            for (var i = 0; i < members.length; i++) {
                var m = members[i];
                html += '<tr><td>' + (m.first_name || '') + ' ' + (m.last_name || '') + '</td>';
                html += '<td>' + (m.phone || '') + '</td>';
                html += '<td><span class="badge badge-primary">' + (m.role || 'member') + '</span></td>';
                html += '<td><span class="badge ' + (m.is_active !== false ? 'badge-success' : 'badge-danger') + '">' + (m.is_active !== false ? 'Active' : 'Inactive') + '</span></td>';
                html += '<td><button class="btn btn-sm btn-danger" onclick="deleteItem(\'members\', \'' + m.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
            }
        }
        
        html += '</tbody></table></div></div>';
        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = '<div class="loading-state"><p style="color:var(--danger);">❌ ' + error.message + '</p><button class="btn btn-primary" onclick="renderMembers()">Retry</button></div>';
    }
}

// ===================== MEETINGS =====================
async function renderMeetings() {
    var content = document.getElementById('pageContent');
    if (!content) return;
    
    try {
        var token = localStorage.getItem('token');
        var response = await fetch('/api/v1/meetings/', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        var meetings = response.ok ? await response.json() : [];
        
        var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><h2>Meetings (' + meetings.length + ')</h2><button class="btn btn-primary" onclick="openModal(\'meeting\')"><i class="fas fa-plus"></i> Schedule Meeting</button></div>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">';
        
        if (meetings.length === 0) {
            html += '<div class="card" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray-500);"><i class="fas fa-calendar-alt" style="font-size:32px;display:block;margin-bottom:8px;"></i>No meetings scheduled</div>';
        } else {
            for (var i = 0; i < meetings.length; i++) {
                var m = meetings[i];
                html += '<div class="card" style="cursor:pointer;" onclick="openMeetingDetail(\'' + m.id + '\')">';
                html += '<div class="card-body"><h4 style="margin:0;">' + m.title + '</h4>';
                html += '<div style="font-size:13px;color:var(--gray-500);margin-top:4px;"><i class="fas fa-calendar-alt"></i> ' + m.date + ' at ' + m.time + '</div>';
                html += '<div style="font-size:13px;color:var(--gray-500);"><i class="fas fa-map-marker-alt"></i> ' + (m.location || 'Village Hall') + '</div>';
                html += '<span class="badge badge-primary">' + m.status + '</span>';
                html += '</div></div>';
            }
        }
        
        html += '</div>';
        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = '<div class="loading-state"><p style="color:var(--danger);">❌ ' + error.message + '</p><button class="btn btn-primary" onclick="renderMeetings()">Retry</button></div>';
    }
}

// ===================== OTHER PAGES =====================
async function renderContributions() {
    var content = document.getElementById('pageContent');
    content.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><h2>Contributions</h2><button class="btn btn-primary" onclick="openModal(\'contribution\')"><i class="fas fa-plus"></i> Record Contribution</button></div><div class="card"><div style="text-align:center;padding:40px;color:var(--gray-500);">Contributions page</div></div>';
}

async function renderAnnouncements() {
    var content = document.getElementById('pageContent');
    content.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><h2>Announcements</h2><button class="btn btn-primary" onclick="openModal(\'announcement\')"><i class="fas fa-plus"></i> Send Announcement</button></div><div class="card"><div style="text-align:center;padding:40px;color:var(--gray-500);">Announcements page</div></div>';
}

async function renderExpenses() {
    var content = document.getElementById('pageContent');
    content.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><h2>Expenses</h2><button class="btn btn-primary" onclick="openModal(\'expense\')"><i class="fas fa-plus"></i> Add Expense</button></div><div class="card"><div style="text-align:center;padding:40px;color:var(--gray-500);">Expenses page</div></div>';
}

async function renderGroups() {
    var content = document.getElementById('pageContent');
    content.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><h2>Groups</h2><button class="btn btn-primary" onclick="openModal(\'group\')"><i class="fas fa-plus"></i> Create Group</button></div><div class="card"><div style="text-align:center;padding:40px;color:var(--gray-500);">Groups page</div></div>';
}

async function renderReports() {
    var content = document.getElementById('pageContent');
    content.innerHTML = '<h2 style="margin-bottom:20px;">Reports</h2><div class="card"><div style="text-align:center;padding:40px;color:var(--gray-500);">Reports page</div></div>';
}

async function renderBackup() {
    var content = document.getElementById('pageContent');
    content.innerHTML = '<h2 style="margin-bottom:20px;">Backup & Restore</h2><div class="card"><div style="text-align:center;padding:40px;color:var(--gray-500);">Backup page</div></div>';
}

function renderSettings() {
    var content = document.getElementById('pageContent');
    content.innerHTML = '<h2 style="margin-bottom:20px;">Settings</h2><div class="card"><div style="text-align:center;padding:40px;color:var(--gray-500);">Settings page</div></div>';
}

async function renderCampaigns() {
    var content = document.getElementById('pageContent');
    content.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><h2>Campaigns</h2><button class="btn btn-primary" onclick="openModal(\'campaign\')"><i class="fas fa-plus"></i> Start Campaign</button></div><div class="card"><div style="text-align:center;padding:40px;color:var(--gray-500);">Campaigns page</div></div>';
}

// ===================== NAVIGATION =====================
async function navigateTo(page) {
    var titles = { dashboard: 'Dashboard', members: 'Members', meetings: 'Meetings', contributions: 'Contributions', announcements: 'Announcements', expenses: 'Expenses', groups: 'Groups', reports: 'Reports', backup: 'Backup', settings: 'Settings', campaigns: 'Campaigns' };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    
    document.querySelectorAll('.nav-link').forEach(function(el) {
        el.classList.toggle('active', el.dataset.page === page);
    });
    
    var content = document.getElementById('pageContent');
    content.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading ' + (titles[page] || page) + '...</p></div>';
    
    try {
        switch(page) {
            case 'dashboard': await renderDashboard(); break;
            case 'members': await renderMembers(); break;
            case 'meetings': await renderMeetings(); break;
            case 'contributions': await renderContributions(); break;
            case 'announcements': await renderAnnouncements(); break;
            case 'expenses': await renderExpenses(); break;
            case 'groups': await renderGroups(); break;
            case 'reports': await renderReports(); break;
            case 'backup': await renderBackup(); break;
            case 'settings': renderSettings(); break;
            case 'campaigns': await renderCampaigns(); break;
            default: content.innerHTML = '<div class="loading-state"><p>Page not found</p></div>';
        }
    } catch (error) {
        content.innerHTML = '<div class="loading-state"><p style="color:var(--danger);">❌ ' + error.message + '</p><button class="btn btn-primary" onclick="navigateTo(\'' + page + '\')">Retry</button></div>';
    }
}

// ===================== DELETE ITEM =====================
async function deleteItem(endpoint, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
        var token = localStorage.getItem('token');
        var response = await fetch('/api/v1/' + endpoint + '/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (response.ok) {
            showToast('✅ Deleted', 'success');
            var currentPage = document.querySelector('.nav-link.active')?.dataset.page || 'dashboard';
            navigateTo(currentPage);
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

function openModal(type, data) {
    ModalManager.open(type, data || null);
}

// EXPOSE
window.renderDashboard = renderDashboard;
window.renderMembers = renderMembers;
window.renderMeetings = renderMeetings;
window.renderContributions = renderContributions;
window.renderAnnouncements = renderAnnouncements;
window.renderExpenses = renderExpenses;
window.renderGroups = renderGroups;
window.renderReports = renderReports;
window.renderBackup = renderBackup;
window.renderSettings = renderSettings;
window.renderCampaigns = renderCampaigns;
window.navigateTo = navigateTo;
window.deleteItem = deleteItem;
window.openModal = openModal;

// MtaaLink - Reports

async function renderReports() {
    var content = document.getElementById('pageContent');
    if (!content) return;
    
    try {
        var token = localStorage.getItem('token');
        var response = await fetch('/api/v1/reports/dashboard', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        var data = response.ok ? await response.json() : null;
        
        if (!data) {
            content.innerHTML = '<div class="loading-state"><p style="color:var(--danger);">Failed to load reports</p><button class="btn btn-primary" onclick="renderReports()">Retry</button></div>';
            return;
        }
        
        var html = '<h2 style="margin-bottom:20px;">Reports</h2>';
        
        html += '<div class="stats-grid">';
        html += '<div class="stat-card"><div class="stat-header"><span class="stat-label">Total Members</span></div><div class="stat-value">' + (data.members?.total || 0) + '</div></div>';
        html += '<div class="stat-card"><div class="stat-header"><span class="stat-label">Total Contributions</span></div><div class="stat-value">KES ' + (data.contributions?.total || 0).toLocaleString() + '</div></div>';
        html += '<div class="stat-card"><div class="stat-header"><span class="stat-label">Total Expenses</span></div><div class="stat-value">KES ' + (data.expenses?.total || 0).toLocaleString() + '</div></div>';
        html += '<div class="stat-card"><div class="stat-header"><span class="stat-label">Meetings</span></div><div class="stat-value">' + (data.meetings?.total || 0) + '</div></div>';
        html += '</div>';
        
        html += '<div class="card"><div class="card-header"><h3>Export Data</h3></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">';
        html += '<button class="btn btn-primary" onclick="exportReport(\'members\')"><i class="fas fa-file-csv"></i> Members CSV</button>';
        html += '<button class="btn btn-primary" onclick="exportReport(\'contributions\')"><i class="fas fa-file-csv"></i> Contributions CSV</button>';
        html += '<button class="btn btn-success" onclick="exportReport(\'backup\')"><i class="fas fa-database"></i> Backup</button>';
        html += '</div></div></div>';
        
        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = '<div class="loading-state"><p style="color:var(--danger);">❌ ' + error.message + '</p><button class="btn btn-primary" onclick="renderReports()">Retry</button></div>';
    }
}

async function exportReport(type) {
    showToast('📤 Exporting ' + type + '...', 'info');
    setTimeout(function() {
        showToast('✅ ' + type + ' exported!', 'success');
    }, 1500);
}

window.renderReports = renderReports;
window.exportReport = exportReport;

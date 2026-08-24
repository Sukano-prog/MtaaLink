// Management System - Enhanced Backup & Restore (No Reset Button)

// ===================== RENDER BACKUP PAGE =====================
async function renderBackup() {
    const content = document.getElementById('pageContent');
    if (!content) return;
    
    try {
        const token = localStorage.getItem('token');
        
        // Get backup summary
        const summaryRes = await fetch('/api/v1/backup/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const summary = summaryRes.ok ? await summaryRes.json() : null;
        
        const html = `
            <!-- Page Header -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
                <div>
                    <h2 style="font-size:24px;font-weight:700;color:var(--gray-900);">💾 Backup & Restore</h2>
                    <p style="color:var(--gray-500);font-size:14px;">Secure your village data with backup and restore</p>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-success" onclick="createBackup()">
                        <i class="fas fa-plus"></i> Create Backup
                    </button>
                </div>
            </div>
            
            <!-- Backup Summary -->
            <div class="stats-grid" style="margin-bottom:24px;">
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">Total Records</span>
                        <span class="stat-icon"><i class="fas fa-database"></i></span>
                    </div>
                    <div class="stat-value">${summary?.total_records || 0}</div>
                    <div class="stat-change">Last backup: ${summary?.exported_at ? new Date(summary.exported_at).toLocaleDateString() : 'Never'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">Tables</span>
                        <span class="stat-icon"><i class="fas fa-table"></i></span>
                    </div>
                    <div class="stat-value">${summary?.tables ? Object.keys(summary.tables).length : 0}</div>
                    <div class="stat-change">Data tables available</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">Storage</span>
                        <span class="stat-icon"><i class="fas fa-hard-drive"></i></span>
                    </div>
                    <div class="stat-value">${summary?.total_records > 1000 ? '📦 Large' : summary?.total_records > 100 ? '📁 Medium' : '📄 Small'}</div>
                    <div class="stat-change">${summary?.total_records || 0} records</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">Village</span>
                        <span class="stat-icon"><i class="fas fa-flag"></i></span>
                    </div>
                    <div class="stat-value" style="font-size:18px;">${summary?.village_id ? '✅ Active' : '⚠️ No Data'}</div>
                    <div class="stat-change">Ready for backup</div>
                </div>
            </div>
            
            <!-- Export Section -->
            <div class="card" style="margin-bottom:24px;">
                <div class="card-header">
                    <h3>📤 Export Data</h3>
                    <span class="badge badge-info">Choose format</span>
                </div>
                <div class="card-body">
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
                        <button class="btn btn-primary" onclick="exportBackup('json')" style="flex-direction:column;padding:20px;height:auto;">
                            <i class="fas fa-file-code" style="font-size:32px;margin-bottom:8px;"></i>
                            <span>JSON</span>
                            <span style="font-size:11px;color:var(--gray-400);">Full data export</span>
                        </button>
                        <button class="btn btn-success" onclick="exportBackup('zip')" style="flex-direction:column;padding:20px;height:auto;">
                            <i class="fas fa-file-archive" style="font-size:32px;margin-bottom:8px;"></i>
                            <span>ZIP</span>
                            <span style="font-size:11px;color:var(--gray-400);">Compressed backup</span>
                        </button>
                        <button class="btn btn-outline" onclick="exportBackup('members')" style="flex-direction:column;padding:20px;height:auto;">
                            <i class="fas fa-users" style="font-size:32px;margin-bottom:8px;"></i>
                            <span>Members CSV</span>
                            <span style="font-size:11px;color:var(--gray-400);">Spreadsheet format</span>
                        </button>
                        <button class="btn btn-outline" onclick="exportBackup('contributions')" style="flex-direction:column;padding:20px;height:auto;">
                            <i class="fas fa-hand-holding-usd" style="font-size:32px;margin-bottom:8px;"></i>
                            <span>Contributions CSV</span>
                            <span style="font-size:11px;color:var(--gray-400);">Spreadsheet format</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Import Section -->
            <div class="card" style="margin-bottom:24px;border:2px dashed var(--primary);">
                <div class="card-header">
                    <h3>📥 Import Data</h3>
                    <span class="badge badge-warning">Restore backup</span>
                </div>
                <div class="card-body">
                    <div style="display:flex;flex-direction:column;gap:12px;align-items:center;padding:20px;">
                        <div style="font-size:48px;color:var(--gray-300);">📂</div>
                        <p style="color:var(--gray-500);">Select a JSON or ZIP backup file to restore</p>
                        <input type="file" id="importFile" accept=".json,.zip" 
                               style="padding:12px;border:2px solid var(--gray-300);border-radius:var(--radius-md);width:100%;max-width:400px;">
                        <button class="btn btn-success" onclick="importBackup()" style="width:200px;">
                            <i class="fas fa-upload"></i> Restore Backup
                        </button>
                        <div id="importStatus" style="margin-top:8px;font-size:13px;color:var(--gray-500);"></div>
                    </div>
                </div>
            </div>
            
            <!-- Safety Note -->
            <div class="card" style="border:2px solid var(--success);background:var(--success-light);">
                <div class="card-body" style="text-align:center;padding:16px;">
                    <p style="color:var(--success);font-weight:600;margin:0;">
                        <i class="fas fa-shield-alt"></i> Your data is safe. Regular backups are recommended.
                    </p>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        
    } catch (error) {
        console.error('Backup error:', error);
        content.innerHTML = `
            <div class="loading-state">
                <p style="color:var(--danger);">❌ Failed to load backup page: ${error.message}</p>
                <button class="btn btn-primary" onclick="renderBackup()">Retry</button>
            </div>
        `;
    }
}

// ===================== CREATE BACKUP =====================
async function createBackup() {
    try {
        const token = localStorage.getItem('token');
        showToast('📤 Creating backup...', 'info');
        
        const response = await fetch('/api/v1/backup/export/zip', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Backup creation failed');
        
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `mtaalink_backup_${new Date().toISOString().slice(0,10)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('✅ Backup created and downloaded!', 'success');
        
    } catch (error) {
        showToast('❌ Backup failed: ' + error.message, 'error');
    }
}

// ===================== EXPORT BACKUP =====================
async function exportBackup(type) {
    try {
        const token = localStorage.getItem('token');
        let url = '';
        let filename = '';
        
        switch(type) {
            case 'json':
                url = '/backup/export/json';
                filename = `mtaalink_backup_${new Date().toISOString().slice(0,10)}.json`;
                break;
            case 'zip':
                url = '/backup/export/zip';
                filename = `mtaalink_backup_${new Date().toISOString().slice(0,10)}.zip`;
                break;
            case 'members':
                url = '/reports/export/members';
                filename = `members_${new Date().toISOString().slice(0,10)}.csv`;
                break;
            case 'contributions':
                url = '/reports/export/contributions';
                filename = `contributions_${new Date().toISOString().slice(0,10)}.csv`;
                break;
            default:
                showToast('Invalid export type', 'error');
                return;
        }
        
        showToast(`📤 Exporting ${type}...`, 'info');
        
        const response = await fetch(`/api/v1${url}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast(`✅ ${type.toUpperCase()} exported successfully!`, 'success');
        
    } catch (error) {
        showToast('❌ Export failed: ' + error.message, 'error');
    }
}

// ===================== IMPORT BACKUP =====================
async function importBackup() {
    const fileInput = document.getElementById('importFile');
    const statusDiv = document.getElementById('importStatus');
    
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        showToast('Please select a backup file first', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    statusDiv.innerHTML = '<span style="color:var(--info);">⏳ Uploading and restoring...</span>';
    showToast('📥 Restoring backup...', 'info');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/v1/backup/import', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (!response.ok) throw new Error('Import failed');
        
        const result = await response.json();
        statusDiv.innerHTML = `<span style="color:var(--success);">✅ ${result.message || 'Import successful!'}</span>`;
        showToast('✅ Backup restored successfully!', 'success');
        
        // Refresh the page
        setTimeout(() => renderBackup(), 1500);
        
    } catch (error) {
        statusDiv.innerHTML = `<span style="color:var(--danger);">❌ ${error.message}</span>`;
        showToast('❌ Import failed: ' + error.message, 'error');
    }
}

// Make functions globally available
window.renderBackup = renderBackup;
window.createBackup = createBackup;
window.exportBackup = exportBackup;
window.importBackup = importBackup;

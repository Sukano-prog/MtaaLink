// Management System - Enhanced Settings

// ===================== RENDER SETTINGS PAGE =====================
function renderSettings() {
    const content = document.getElementById('pageContent');
    if (!content) return;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const village = JSON.parse(localStorage.getItem('village') || '{}');
    
    const html = `
        <!-- Page Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
            <div>
                <h2 style="font-size:24px;font-weight:700;color:var(--gray-900);">⚙️ Settings</h2>
                <p style="color:var(--gray-500);font-size:14px;">Manage your account and village preferences</p>
            </div>
        </div>
        
        <!-- Profile Settings -->
        <div class="card" style="margin-bottom:24px;">
            <div class="card-header">
                <h3><i class="fas fa-user-circle" style="color:var(--primary);"></i> Profile</h3>
                <button class="btn btn-sm btn-primary" onclick="editProfile()">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">Full Name</div>
                        <div style="font-weight:600;font-size:16px;">${user?.first_name || 'Admin'} ${user?.last_name || 'User'}</div>
                    </div>
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">Email</div>
                        <div style="font-weight:600;font-size:16px;">${user?.email || 'admin@mtaalink.com'}</div>
                    </div>
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">Role</div>
                        <div style="font-weight:600;font-size:16px;"><span class="badge badge-primary">${user?.role || 'Administrator'}</span></div>
                    </div>
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">Phone</div>
                        <div style="font-weight:600;font-size:16px;">${user?.phone || '0712345678'}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Village Settings -->
        <div class="card" style="margin-bottom:24px;">
            <div class="card-header">
                <h3><i class="fas fa-flag" style="color:var(--success);"></i> Village</h3>
                <button class="btn btn-sm btn-primary" onclick="editVillage()">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">Village Name</div>
                        <div style="font-weight:600;font-size:16px;">${village?.name || 'Nairobi Village'}</div>
                    </div>
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">County</div>
                        <div style="font-weight:600;font-size:16px;">${village?.county || 'Nairobi'}</div>
                    </div>
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">Ward</div>
                        <div style="font-weight:600;font-size:16px;">${village?.ward || 'Central'}</div>
                    </div>
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">Budget</div>
                        <div style="font-weight:600;font-size:16px;">KES ${(village?.budget || 0).toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Security Settings -->
        <div class="card" style="margin-bottom:24px;">
            <div class="card-header">
                <h3><i class="fas fa-lock" style="color:var(--warning);"></i> Security</h3>
            </div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <button class="btn btn-outline" onclick="changePassword()" style="justify-content:center;">
                        <i class="fas fa-key"></i> Change Password
                    </button>
                    <button class="btn btn-outline" onclick="enable2FA()" style="justify-content:center;">
                        <i class="fas fa-shield-alt"></i> Enable 2FA
                    </button>
                    <button class="btn btn-outline" onclick="showSessions()" style="justify-content:center;">
                        <i class="fas fa-desktop"></i> Active Sessions
                    </button>
                    <button class="btn btn-outline" onclick="showAuditLog()" style="justify-content:center;">
                        <i class="fas fa-history"></i> Audit Log
                    </button>
                </div>
            </div>
        </div>
        
        <!-- App Settings -->
        <div class="card" style="margin-bottom:24px;">
            <div class="card-header">
                <h3><i class="fas fa-sliders-h" style="color:var(--info);"></i> App Preferences</h3>
            </div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                            <input type="checkbox" id="darkMode" onchange="toggleDarkMode()">
                            🌙 Dark Mode
                        </label>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                            <input type="checkbox" id="notifications" onchange="toggleNotifications()" checked>
                            🔔 Notifications
                        </label>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                            <input type="checkbox" id="offlineMode" onchange="toggleOfflineMode()">
                            📡 Offline Mode
                        </label>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                            <input type="checkbox" id="autoSync" onchange="toggleAutoSync()" checked>
                            🔄 Auto Sync
                        </label>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- About -->
        <div class="card" style="margin-bottom:24px;">
            <div class="card-header">
                <h3><i class="fas fa-info-circle" style="color:var(--primary);"></i> About</h3>
            </div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">App Name</div>
                        <div style="font-weight:600;">Management System</div>
                    </div>
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">Version</div>
                        <div style="font-weight:600;">v1.0.0</div>
                    </div>
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">Status</div>
                        <div><span class="badge badge-success">🟢 Online</span></div>
                    </div>
                    <div>
                        <div style="font-size:12px;color:var(--gray-500);">Built for</div>
                        <div style="font-weight:600;">🇰🇪 Kenya</div>
                    </div>
                </div>
                <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200);text-align:center;color:var(--gray-500);font-size:13px;">
                    Built with ❤️ for Kenyan villages
                </div>
            </div>
        </div>
        
        <!-- Logout -->
        <div style="text-align:center;">
            <button class="btn btn-danger" onclick="logout()" style="padding:12px 40px;">
                <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
        </div>
    `;
    
    content.innerHTML = html;
    
    // Load saved preferences
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) document.getElementById('darkMode')?.setAttribute('checked', 'checked');
}

// ===================== SETTINGS FUNCTIONS =====================

function toggleDarkMode() {
    const enabled = document.getElementById('darkMode').checked;
    localStorage.setItem('darkMode', enabled);
    document.body.classList.toggle('dark-mode', enabled);
    showToast(enabled ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'info');
}

function toggleNotifications() {
    const enabled = document.getElementById('notifications').checked;
    localStorage.setItem('notifications', enabled);
    showToast(enabled ? '🔔 Notifications enabled' : '🔕 Notifications disabled', 'info');
}

function toggleOfflineMode() {
    const enabled = document.getElementById('offlineMode').checked;
    localStorage.setItem('offlineMode', enabled);
    showToast(enabled ? '📡 Offline mode enabled' : '📡 Offline mode disabled', 'info');
}

function toggleAutoSync() {
    const enabled = document.getElementById('autoSync').checked;
    localStorage.setItem('autoSync', enabled);
    showToast(enabled ? '🔄 Auto sync enabled' : '🔄 Auto sync disabled', 'info');
}

function editProfile() {
    showToast('👤 Edit profile coming soon', 'info');
}

function editVillage() {
    showToast('🏘️ Edit village coming soon', 'info');
}

function changePassword() {
    showToast('🔑 Change password coming soon', 'info');
}

function enable2FA() {
    showToast('🔐 2FA coming soon', 'info');
}

function showSessions() {
    showToast('💻 Active sessions coming soon', 'info');
}

function showAuditLog() {
    showToast('📋 Audit log coming soon', 'info');
}

// Make functions globally available
window.renderSettings = renderSettings;
window.toggleDarkMode = toggleDarkMode;
window.toggleNotifications = toggleNotifications;
window.toggleOfflineMode = toggleOfflineMode;
window.toggleAutoSync = toggleAutoSync;
window.editProfile = editProfile;
window.editVillage = editVillage;
window.changePassword = changePassword;
window.enable2FA = enable2FA;
window.showSessions = showSessions;
window.showAuditLog = showAuditLog;

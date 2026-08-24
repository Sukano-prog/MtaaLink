// Page Renderers

async function renderDashboard() {
    try {
        const data = await apiRequest('/reports/dashboard');
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-icon">👥</span>
                    <div class="stat-value">${data.members?.total || 0}</div>
                    <div class="stat-label">Total Members</div>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">💰</span>
                    <div class="stat-value">KES ${(data.contributions?.collected || 0).toLocaleString()}</div>
                    <div class="stat-label">Contributions</div>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">📅</span>
                    <div class="stat-value">${data.meetings?.upcoming || 0}</div>
                    <div class="stat-label">Upcoming Meetings</div>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">📢</span>
                    <div class="stat-value">${data.announcements?.total || 0}</div>
                    <div class="stat-label">Announcements</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🏘️ Village Details</div>
                <p><strong>Name:</strong> ${data.village?.name || 'N/A'}</p>
                <p><strong>County:</strong> ${data.village?.county || 'N/A'}</p>
                <p><strong>Budget:</strong> KES ${(data.village?.budget || 0).toLocaleString()}</p>
            </div>
            
            <div class="card">
                <div class="card-title">📊 Quick Actions</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;">
                    <button onclick="navigateTo('members')" style="padding:12px;border:none;border-radius:8px;background:var(--primary-light);color:var(--primary);cursor:pointer;">
                        👥 View Members
                    </button>
                    <button onclick="navigateTo('meetings')" style="padding:12px;border:none;border-radius:8px;background:var(--primary-light);color:var(--primary);cursor:pointer;">
                        📅 Schedule Meeting
                    </button>
                    <button onclick="navigateTo('contributions')" style="padding:12px;border:none;border-radius:8px;background:var(--primary-light);color:var(--primary);cursor:pointer;">
                        💰 Add Contribution
                    </button>
                    <button onclick="navigateTo('announcements')" style="padding:12px;border:none;border-radius:8px;background:var(--primary-light);color:var(--primary);cursor:pointer;">
                        📢 Send Announcement
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="loading-screen"><p style="color:var(--danger);">❌ ${error.message}</p></div>`;
    }
}

async function renderMembers() {
    try {
        const members = await apiRequest('/members/');
        
        if (!members || members.length === 0) {
            return `
                <div class="card">
                    <div class="card-title">👥 Members</div>
                    <p style="color:var(--gray);text-align:center;padding:20px;">No members registered yet</p>
                    <button onclick="showAddMember()" style="padding:10px 20px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;width:100%;">
                        ➕ Add First Member
                    </button>
                </div>
            `;
        }
        
        let html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h2>👥 Members (${members.length})</h2>
                <button onclick="showAddMember()" style="padding:8px 16px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;">
                    ➕ Add
                </button>
            </div>
            <div class="card">
        `;
        
        members.forEach(m => {
            html += `
                <div class="list-item">
                    <div class="avatar">${m.first_name[0]}${m.last_name[0]}</div>
                    <div class="info">
                        <div class="name">${m.first_name} ${m.last_name}</div>
                        <div class="detail">📱 ${m.phone} ${m.email ? '· 📧 ' + m.email : ''}</div>
                    </div>
                    <div class="badge">${m.role}</div>
                </div>
            `;
        });
        
        html += `</div>`;
        return html;
        
    } catch (error) {
        return `<div class="loading-screen"><p style="color:var(--danger);">❌ ${error.message}</p></div>`;
    }
}

async function renderMeetings() {
    try {
        const meetings = await apiRequest('/meetings/');
        
        if (!meetings || meetings.length === 0) {
            return `
                <div class="card">
                    <div class="card-title">📅 Meetings</div>
                    <p style="color:var(--gray);text-align:center;padding:20px;">No meetings scheduled</p>
                    <button onclick="showAddMeeting()" style="padding:10px 20px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;width:100%;">
                        📅 Schedule Meeting
                    </button>
                </div>
            `;
        }
        
        let html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h2>📅 Meetings</h2>
                <button onclick="showAddMeeting()" style="padding:8px 16px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;">
                    ➕ Schedule
                </button>
            </div>
            <div class="card">
        `;
        
        meetings.forEach(m => {
            html += `
                <div class="list-item">
                    <div style="font-size:28px;">📅</div>
                    <div class="info">
                        <div class="name">${m.title}</div>
                        <div class="detail">📆 ${m.date} at ${m.time} · 📍 ${m.location || 'Village Hall'}</div>
                        <div class="detail" style="color:${m.status === 'scheduled' ? 'var(--success)' : 'var(--gray)'}">
                            Status: ${m.status} · Quorum: ${m.quorum_required}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        return html;
        
    } catch (error) {
        return `<div class="loading-screen"><p style="color:var(--danger);">❌ ${error.message}</p></div>`;
    }
}

async function renderContributions() {
    try {
        const contributions = await apiRequest('/contributions/');
        
        if (!contributions || contributions.length === 0) {
            return `
                <div class="card">
                    <div class="card-title">💰 Contributions</div>
                    <p style="color:var(--gray);text-align:center;padding:20px;">No contributions recorded</p>
                    <button onclick="showAddContribution()" style="padding:10px 20px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;width:100%;">
                        💰 Record Contribution
                    </button>
                </div>
            `;
        }
        
        let html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h2>💰 Contributions</h2>
                <button onclick="showAddContribution()" style="padding:8px 16px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;">
                    ➕ Record
                </button>
            </div>
            <div class="card">
        `;
        
        contributions.forEach(c => {
            const statusColor = c.status === 'paid' ? 'success' : c.status === 'pending' ? 'warning' : 'danger';
            html += `
                <div class="list-item">
                    <div style="font-size:28px;">💰</div>
                    <div class="info">
                        <div class="name">KES ${c.amount.toLocaleString()}</div>
                        <div class="detail">Paid: KES ${c.paid_amount.toLocaleString()} · Balance: KES ${c.balance.toLocaleString()}</div>
                        <div class="badge ${statusColor}">${c.status.toUpperCase()}</div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        return html;
        
    } catch (error) {
        return `<div class="loading-screen"><p style="color:var(--danger);">❌ ${error.message}</p></div>`;
    }
}

async function renderAnnouncements() {
    try {
        const announcements = await apiRequest('/announcements/');
        
        let html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h2>📢 Announcements</h2>
                <button onclick="showAddAnnouncement()" style="padding:8px 16px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;">
                    ➕ New
                </button>
            </div>
        `;
        
        if (!announcements || announcements.length === 0) {
            html += `
                <div class="card">
                    <p style="color:var(--gray);text-align:center;padding:20px;">No announcements yet</p>
                </div>
            `;
        } else {
            html += `<div class="card">`;
            announcements.forEach(a => {
                html += `
                    <div class="list-item">
                        <div style="font-size:24px;">📢</div>
                        <div class="info">
                            <div class="name">${a.title}</div>
                            <div class="detail">${a.message.substring(0, 100)}${a.message.length > 100 ? '...' : ''}</div>
                            <div class="detail" style="font-size:11px;color:var(--gray);">
                                ${a.sent_via || 'SMS'} · ${a.status} · ${a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }
        
        return html;
        
    } catch (error) {
        return `<div class="loading-screen"><p style="color:var(--danger);">❌ ${error.message}</p></div>`;
    }
}

async function renderReports() {
    try {
        const data = await apiRequest('/reports/dashboard');
        
        return `
            <h2 style="margin-bottom:16px;">📊 Reports</h2>
            
            <div class="card">
                <div class="card-title">📊 Summary</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
                    <div><strong>Total Members:</strong> ${data.members?.total || 0}</div>
                    <div><strong>Total Contributions:</strong> KES ${(data.contributions?.collected || 0).toLocaleString()}</div>
                    <div><strong>Meetings:</strong> ${data.meetings?.total || 0}</div>
                    <div><strong>Announcements:</strong> ${data.announcements?.total || 0}</div>
                </div>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="card" style="text-align:center;">
                    <button onclick="exportData('members')" style="padding:12px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;width:100%;">
                        👥 Export Members CSV
                    </button>
                </div>
                <div class="card" style="text-align:center;">
                    <button onclick="exportData('contributions')" style="padding:12px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;width:100%;">
                        💰 Export Contributions CSV
                    </button>
                </div>
                <div class="card" style="text-align:center;">
                    <button onclick="exportData('meetings')" style="padding:12px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;width:100%;">
                        📅 Export Meetings CSV
                    </button>
                </div>
                <div class="card" style="text-align:center;">
                    <button onclick="backupData()" style="padding:12px;border:none;border-radius:8px;background:var(--success);color:white;cursor:pointer;width:100%;">
                        💾 Backup All Data
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="loading-screen"><p style="color:var(--danger);">❌ ${error.message}</p></div>`;
    }
}

function renderBackup() {
    return `
        <h2 style="margin-bottom:16px;">💾 Backup & Restore</h2>
        
        <div class="card">
            <div class="card-title">📤 Export Data</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
                <button onclick="exportData('json')" style="padding:12px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;">
                    📄 Export as JSON
                </button>
                <button onclick="exportData('zip')" style="padding:12px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;">
                    📦 Export as ZIP
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="card-title">📥 Import Data</div>
            <input type="file" id="importFile" accept=".json,.zip" style="margin:8px 0;padding:8px;width:100%;">
            <button onclick="importData()" style="padding:12px;border:none;border-radius:8px;background:var(--success);color:white;cursor:pointer;width:100%;">
                📥 Import Data
            </button>
        </div>
        
        <div class="card" style="border:2px solid var(--danger);">
            <div class="card-title" style="color:var(--danger);">⚠️ Danger Zone</div>
            <button onclick="resetData()" style="padding:12px;border:none;border-radius:8px;background:var(--danger);color:white;cursor:pointer;width:100%;">
                🗑️ Reset All Data
            </button>
        </div>
    `;
}

function renderSettings() {
    return `
        <h2 style="margin-bottom:16px;">⚙️ Settings</h2>
        
        <div class="card">
            <div class="card-title">👤 Profile</div>
            <p><strong>Name:</strong> ${state.user?.first_name} ${state.user?.last_name}</p>
            <p><strong>Email:</strong> ${state.user?.email}</p>
            <p><strong>Role:</strong> ${state.user?.role}</p>
            <p><strong>Village:</strong> ${state.village?.name}</p>
        </div>
        
        <div class="card">
            <div class="card-title">📱 App Settings</div>
            <div style="display:flex;flex-direction:column;gap:12px;">
                <label>
                    <input type="checkbox" id="offlineMode" ${state.isOffline ? 'checked' : ''}> 
                    Offline Mode
                </label>
                <label>
                    <input type="checkbox" id="darkMode"> 
                    Dark Mode
                </label>
                <button onclick="clearCache()" style="padding:8px 16px;border:none;border-radius:8px;background:var(--gray);color:white;cursor:pointer;">
                    🗑️ Clear Cache
                </button>
                <button onclick="syncData()" style="padding:8px 16px;border:none;border-radius:8px;background:var(--primary);color:white;cursor:pointer;">
                    🔄 Force Sync
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="card-title">ℹ️ About</div>
            <p><strong>App:</strong> MtaaLink v1.0.0</p>
            <p><strong>Status:</strong> ${state.isOffline ? '📡 Offline' : '🟢 Online'}</p>
            <p><strong>Server:</strong> ${API_BASE}</p>
            <p style="margin-top:8px;color:var(--gray);font-size:12px;">
                Built with ❤️ for Kenya 🇰🇪
            </p>
        </div>
    `;
}

// Export functions
async function exportData(type) {
    try {
        let url = '';
        switch(type) {
            case 'members':
                url = '/reports/export/members';
                break;
            case 'contributions':
                url = '/reports/export/contributions';
                break;
            case 'meetings':
                url = '/reports/export/meetings';
                break;
            case 'json':
                url = '/backup/export/json';
                break;
            case 'zip':
                url = '/backup/export/zip';
                break;
        }
        
        const response = await fetch(`${API_BASE}${url}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `mtaalink_${type}_${Date.now()}.${type === 'zip' ? 'zip' : type === 'json' ? 'json' : 'csv'}`;
        link.click();
        
        showToast(`✅ ${type} exported successfully!`, 'success');
        
    } catch (error) {
        showToast('Export failed: ' + error.message, 'error');
    }
}

async function backupData() {
    await exportData('zip');
}

async function importData() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files || !fileInput.files[0]) {
        showToast('Please select a file first', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE}/backup/import`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.token}` },
            body: formData
        });
        
        if (!response.ok) throw new Error('Import failed');
        
        const result = await response.json();
        showToast(`✅ Import successful! ${result.total_imported} records imported`, 'success');
        
    } catch (error) {
        showToast('Import failed: ' + error.message, 'error');
    }
}

async function resetData() {
    if (!confirm('⚠️ Are you sure you want to reset ALL village data? This cannot be undone!')) {
        return;
    }
    
    if (!confirm('⚠️⚠️ FINAL WARNING: This will delete all data. Are you ABSOLUTELY sure?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/backup/reset`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        if (!response.ok) throw new Error('Reset failed');
        
        showToast('✅ Data reset successfully', 'success');
        navigateTo('dashboard');
        
    } catch (error) {
        showToast('Reset failed: ' + error.message, 'error');
    }
}

// Modal functions
function showAddMember() {
    showModal('Add Member', `
        <form id="addMemberForm">
            <input type="text" name="first_name" placeholder="First Name" required>
            <input type="text" name="last_name" placeholder="Last Name" required>
            <input type="tel" name="phone" placeholder="Phone Number" required>
            <input type="email" name="email" placeholder="Email (optional)">
            <select name="role">
                <option value="member">Member</option>
                <option value="elder">Elder</option>
                <option value="youth">Youth</option>
                <option value="treasurer">Treasurer</option>
                <option value="secretary">Secretary</option>
            </select>
            <button type="submit" style="padding:12px;border:none;border-radius:8px;background:var(--primary);color:white;font-size:16px;font-weight:600;cursor:pointer;">
                Add Member
            </button>
        </form>
    `);
    
    document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            await apiRequest('/members/', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showToast('✅ Member added successfully!', 'success');
            closeModal();
            navigateTo('members');
        } catch (error) {
            showToast('Failed to add member: ' + error.message, 'error');
        }
    });
}

function showAddMeeting() {
    showModal('Schedule Meeting', `
        <form id="addMeetingForm">
            <input type="text" name="title" placeholder="Meeting Title" required>
            <input type="date" name="date" required>
            <input type="time" name="time" required>
            <input type="text" name="location" placeholder="Location (optional)">
            <textarea name="agenda" placeholder="Agenda (optional)" rows="3"></textarea>
            <input type="number" name="quorum_required" placeholder="Quorum Required" value="10">
            <button type="submit" style="padding:12px;border:none;border-radius:8px;background:var(--primary);color:white;font-size:16px;font-weight:600;cursor:pointer;">
                Schedule Meeting
            </button>
        </form>
    `);
    
    document.getElementById('addMeetingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            await apiRequest('/meetings/', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showToast('✅ Meeting scheduled successfully!', 'success');
            closeModal();
            navigateTo('meetings');
        } catch (error) {
            showToast('Failed to schedule meeting: ' + error.message, 'error');
        }
    });
}

function showAddContribution() {
    showModal('Record Contribution', `
        <form id="addContributionForm">
            <input type="text" name="member_id" placeholder="Member ID" required>
            <input type="number" name="amount" placeholder="Amount (KES)" required>
            <input type="date" name="due_date" placeholder="Due Date">
            <select name="payment_method">
                <option value="">Payment Method</option>
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank</option>
                <option value="till">Buy Goods Till</option>
            </select>
            <textarea name="notes" placeholder="Notes (optional)" rows="2"></textarea>
            <button type="submit" style="padding:12px;border:none;border-radius:8px;background:var(--primary);color:white;font-size:16px;font-weight:600;cursor:pointer;">
                Record Contribution
            </button>
        </form>
    `);
    
    document.getElementById('addContributionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            await apiRequest('/contributions/', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showToast('✅ Contribution recorded successfully!', 'success');
            closeModal();
            navigateTo('contributions');
        } catch (error) {
            showToast('Failed to record contribution: ' + error.message, 'error');
        }
    });
}

function showAddAnnouncement() {
    showModal('Send Announcement', `
        <form id="addAnnouncementForm">
            <input type="text" name="title" placeholder="Announcement Title" required>
            <textarea name="message" placeholder="Message" required rows="4"></textarea>
            <select name="sent_via">
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="both">Both</option>
            </select>
            <input type="datetime-local" name="scheduled_for" placeholder="Schedule (optional)">
            <button type="submit" style="padding:12px;border:none;border-radius:8px;background:var(--primary);color:white;font-size:16px;font-weight:600;cursor:pointer;">
                Send Announcement
            </button>
        </form>
    `);
    
    document.getElementById('addAnnouncementForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            const result = await apiRequest('/announcements/', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showToast('✅ Announcement created successfully!', 'success');
            closeModal();
            navigateTo('announcements');
        } catch (error) {
            showToast('Failed to create announcement: ' + error.message, 'error');
        }
    });
}

// Modal helper functions
function showModal(title, content) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modalOverlay';
    overlay.style.cssText = `
        position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);
        z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background:var(--white);border-radius:12px;padding:24px;max-width:500px;width:100%;
        max-height:80vh;overflow-y:auto;
    `;
    modal.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3>${title}</h3>
            <button onclick="closeModal()" style="background:none;border:none;font-size:24px;cursor:pointer;">✕</button>
        </div>
        ${content}
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.remove();
}

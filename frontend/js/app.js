import { initPWA } from "./core/pwa.js";
// ============================================================
// MtaaLink - Main Application
// ============================================================

// ===== DOM HELPERS =====
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== STATE =====
let currentPage = 'dashboard';
let groupsList = [];

// ===== SIDEBAR HELPERS =====
function openSidebar() {
    $('sidebar').classList.add('open');
}

function closeSidebar() {
    $('sidebar').classList.remove('open');
}

function toggleSidebar() {
    $('sidebar').classList.toggle('open');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 MtaaLink starting...');
    
    if (localStorage.getItem('token')) {
        showApp();
    } else {
        showLogin();
    }
});

// ===== AUTH UI =====
function showLogin() {
    console.log('📱 Showing login screen');
    $('loginScreen').style.display = 'flex';
    $('registerScreen').style.display = 'none';
    $('appContainer').style.display = 'none';
    closeSidebar();
}

function showRegister() {
    console.log('📱 Showing register screen');
    $('loginScreen').style.display = 'none';
    $('registerScreen').style.display = 'flex';
    $('appContainer').style.display = 'none';
    closeSidebar();
}

function showApp() {
    console.log('📱 Showing app');
    $('loginScreen').style.display = 'none';
    $('registerScreen').style.display = 'none';
    $('appContainer').style.display = 'block';
    initApp();
}

function logout() {
    ['token', 'village_id', 'village_name', 'role', 'member_id'].forEach(function(k) {
        localStorage.removeItem(k);
    });
    showLogin();
    showToast('Signed out', 'info');
    closeSidebar();
}

// ===== LOGIN =====
function handleLogin(e) {
    if (e) e.preventDefault();
    console.log('🔐 Login button clicked');
    
    var email = $('loginEmail').value.trim();
    var password = $('loginPassword').value;
    
    if (!email || !password) {
        showToast('Please enter email and password', 'error');
        return;
    }
    
    console.log('📤 Logging in with:', email);
    
    api.login(email, password)
        .then(function(data) {
            console.log('✅ Login success:', data);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('village_id', data.village_id);
            localStorage.setItem('village_name', data.village_name);
            localStorage.setItem('role', data.role);
            localStorage.setItem('member_id', data.member_id);
            showToast('Welcome back, ' + data.village_name + '!', 'success');
            showApp();
        })
        .catch(function(err) {
            console.error('❌ Login error:', err);
            showToast(err.message || 'Login failed', 'error');
        });
}

// ===== REGISTER =====
function handleRegister(e) {
    e.preventDefault();
    console.log('📝 Register button clicked');
    
    var data = {
        email: $('regEmail').value.trim(),
        password: $('regPassword').value,
        village_name: $('regVillageName').value.trim(),
        first_name: $('regFirstName').value.trim(),
        last_name: $('regLastName').value.trim(),
        phone: $('regPhone').value.trim()
    };
    
    api.register(data)
        .then(function() {
            showToast('✅ Registered! Please sign in.', 'success');
            showLogin();
        })
        .catch(function(err) {
            showToast(err.message || 'Registration failed', 'error');
        });
}

// ===== INIT APP =====
function initApp() {
    console.log('🚀 Initializing app...');
    
    // Set user info
    api.getCurrentUser()
        .then(function(user) {
            $('userAvatar').textContent = user.first_name ? user.first_name[0] : 'A';
            $('userName').textContent = user.first_name + ' ' + user.last_name;
            $('userRole').textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member';
        })
        .catch(function(err) {
            console.log('User info not available:', err);
        });
    
    // Load groups
    api.getGroups()
        .then(function(groups) {
            groupsList = groups;
            window.groupsList = groups;
            console.log('✅ Groups loaded:', groups.length);
        })
        .catch(function(err) {
            console.log('Groups not loaded:', err);
            groupsList = [];
        });
    
    // Load dashboard
    navigateTo('dashboard');
    updateBadges();
    
    // Setup navigation events
    setupNavEvents();
    setupSidebarEvents();
}

// ===== SIDEBAR EVENTS =====
function setupSidebarEvents() {
    console.log('🔧 Setting up sidebar events...');
    
    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        var sidebar = $('sidebar');
        var menuToggle = $('menuToggle');
        
        // If sidebar is open and click is outside sidebar and outside menu toggle
        if (sidebar && sidebar.classList.contains('open')) {
            var isClickInsideSidebar = sidebar.contains(e.target);
            var isClickOnToggle = menuToggle && menuToggle.contains(e.target);
            
            if (!isClickInsideSidebar && !isClickOnToggle) {
                closeSidebar();
            }
        }
    });
    
    // Close sidebar on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSidebar();
        }
    });
}

// ===== NAVIGATION EVENTS =====
function setupNavEvents() {
    console.log('🔧 Setting up navigation...');
    
    var navLinks = document.querySelectorAll('.nav-link');
    console.log('Found ' + navLinks.length + ' nav links');
    
    navLinks.forEach(function(link) {
        link.removeEventListener('click', handleNavClick);
        link.addEventListener('click', handleNavClick);
    });
}

function handleNavClick(e) {
    e.preventDefault();
    var page = this.dataset.page;
    console.log('🔗 Nav clicked:', page);
    if (page) {
        // Close sidebar first
        closeSidebar();
        // Then navigate
        navigateTo(page);
    }
}

// ===== BADGES =====
function updateBadges() {
    api.getMembers()
        .then(function(members) {
            var count = $('memberCount');
            if (count) count.textContent = members.length || 0;
        })
        .catch(function() {});
    
    api.getMeetings()
        .then(function(meetings) {
            var upcoming = meetings.filter(function(m) {
                return m.status === 'scheduled' || m.status === 'ongoing';
            });
            var count = $('meetingCount');
            if (count) count.textContent = upcoming.length || 0;
        })
        .catch(function() {});
}

// ===== NAVIGATION =====
function navigateTo(page) {
    console.log('📄 Navigating to:', page);
    
    var titles = {
        dashboard: 'Dashboard',
        members: 'Members',
        meetings: 'Meetings',
        contributions: 'Contributions',
        groups: 'Groups',
        settings: 'Settings'
    };
    
    currentPage = page;
    $('pageTitle').textContent = titles[page] || page;
    
    // Update active nav
    document.querySelectorAll('.nav-link').forEach(function(el) {
        el.classList.toggle('active', el.dataset.page === page);
    });
    
    // Show loading
    $('pageContent').innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
    
    var renderMap = {
        dashboard: renderDashboard,
        members: renderMembers,
        meetings: renderMeetings,
        contributions: renderContributions,
        groups: renderGroups,
        settings: renderSettings
    };
    
    var renderFn = renderMap[page];
    if (renderFn) {
        renderFn().catch(function(err) {
            console.error('Render error:', err);
            $('pageContent').innerHTML = `
                <div class="loading-state">
                    <p style="color:var(--danger);">❌ ${err.message}</p>
                    <button class="btn btn-primary" onclick="navigateTo('${page}')">Retry</button>
                </div>
            `;
        });
    } else {
        $('pageContent').innerHTML = '<p>Page not found</p>';
    }
}

// ===== RENDER FUNCTIONS =====

function renderDashboard() {
    return Promise.all([
        api.getMembers().catch(function() { return []; }),
        api.getMeetings().catch(function() { return []; })
    ]).then(function(results) {
        var members = results[0];
        var meetings = results[1];
        
        $('pageContent').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">Total Members</span>
                        <span class="stat-icon"><i class="fas fa-users"></i></span>
                    </div>
                    <div class="stat-value">${members.length}</div>
                    <div class="stat-change">Active members</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">Total Meetings</span>
                        <span class="stat-icon"><i class="fas fa-calendar-alt"></i></span>
                    </div>
                    <div class="stat-value">${meetings.length}</div>
                    <div class="stat-change">Scheduled & completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">Groups</span>
                        <span class="stat-icon"><i class="fas fa-layer-group"></i></span>
                    </div>
                    <div class="stat-value">${groupsList.length}</div>
                    <div class="stat-change">Village groups</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">Status</span>
                        <span class="stat-icon"><i class="fas fa-check-circle"></i></span>
                    </div>
                    <div class="stat-value">✅ Online</div>
                    <div class="stat-change">System ready</div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Quick Actions</h3></div>
                <div class="card-body">
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">
                        <button class="btn btn-primary" onclick="navigateTo('members')"><i class="fas fa-users"></i> Members</button>
                        <button class="btn btn-success" onclick="navigateTo('meetings')"><i class="fas fa-calendar-plus"></i> Meetings</button>
                        <button class="btn btn-warning" onclick="openModal('group')"><i class="fas fa-layer-group"></i> New Group</button>
                        <button class="btn btn-danger" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderMembers() {
    return api.getMembers().catch(function() { return []; }).then(function(members) {
        var html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
                <h2 style="margin:0;">Members (${members.length})</h2>
                <button class="btn btn-primary" onclick="openModal('member')">
                    <i class="fas fa-plus"></i> Add Member
                </button>
            </div>
            <div class="card">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        if (!members.length) {
            html += `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--gray-500);">No members yet</td></tr>`;
        } else {
            members.forEach(function(m) {
                html += `
                    <tr>
                        <td><strong>${m.full_name || m.first_name + ' ' + m.last_name}</strong></td>
                        <td>${m.phone || '-'}</td>
                        <td><span class="badge badge-primary">${m.role || 'member'}</span></td>
                        <td><span class="badge ${m.is_active ? 'badge-success' : 'badge-danger'}">${m.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editMember('${m.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="deleteMember('${m.id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `</tbody></table></div></div>`;
        $('pageContent').innerHTML = html;
    });
}

function renderMeetings() {
    return api.getMeetings().catch(function() { return []; }).then(function(meetings) {
        var html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
                <h2 style="margin:0;">Meetings (${meetings.length})</h2>
                <button class="btn btn-primary" onclick="openModal('meeting')">
                    <i class="fas fa-plus"></i> Schedule Meeting
                </button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
        `;
        
        if (!meetings.length) {
            html += `
                <div class="card" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray-500);">
                    <i class="fas fa-calendar-alt" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    No meetings scheduled
                </div>
            `;
        } else {
            meetings.forEach(function(m) {
                var colors = {
                    scheduled: 'var(--primary)',
                    ongoing: 'var(--success)',
                    completed: 'var(--info)',
                    cancelled: 'var(--danger)'
                };
                var color = colors[m.status] || 'var(--gray)';
                
                html += `
                    <div class="card" style="border-left:4px solid ${color};">
                        <div class="card-body">
                            <h4 style="margin:0;">${m.title}</h4>
                            <div style="font-size:13px;color:var(--gray-500);margin-top:4px;">
                                <i class="fas fa-calendar-alt"></i> ${m.date} at ${m.time}
                            </div>
                            <div style="font-size:13px;color:var(--gray-500);">
                                <i class="fas fa-map-marker-alt"></i> ${m.location || 'Village Hall'}
                            </div>
                            <div style="margin-top:8px;">
                                <span class="badge badge-primary">${m.status}</span>
                                <span class="badge badge-info">${m.attendance_count || 0} attending</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `</div>`;
        $('pageContent').innerHTML = html;
    });
}

function renderContributions() {
    return api.getContributions().catch(function() { return { contributions: [] }; }).then(function(data) {
        var contributions = data.contributions || [];
        
        var html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
                <h2 style="margin:0;">Contributions (${contributions.length})</h2>
                <button class="btn btn-primary" onclick="openModal('contribution')">
                    <i class="fas fa-plus"></i> Record Contribution
                </button>
            </div>
            <div class="card">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Amount</th>
                                <th>Paid</th>
                                <th>Balance</th>
                                <th>Status</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        if (!contributions.length) {
            html += `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-500);">No contributions recorded</td></tr>`;
        } else {
            contributions.forEach(function(c) {
                var statusClass = {
                    paid: 'badge-success',
                    pending: 'badge-warning',
                    overdue: 'badge-danger',
                    partial: 'badge-info'
                }[c.status] || 'badge-secondary';
                
                html += `
                    <tr>
                        <td>${c.member_name || c.member_id || 'Unknown'}</td>
                        <td><strong>KES ${(c.amount || 0).toLocaleString()}</strong></td>
                        <td>KES ${(c.paid_amount || 0).toLocaleString()}</td>
                        <td>KES ${(c.balance || 0).toLocaleString()}</td>
                        <td><span class="badge ${statusClass}">${c.status || 'pending'}</span></td>
                        <td>${c.due_date || '-'}</td>
                    </tr>
                `;
            });
        }
        
        html += `</tbody></table></div></div>`;
        $('pageContent').innerHTML = html;
    });
}

function renderGroups() {
    return api.getGroups().catch(function() { return []; }).then(function(groups) {
        groupsList = groups;
        window.groupsList = groups;
        
        var html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
                <h2 style="margin:0;">Groups (${groups.length})</h2>
                <button class="btn btn-primary" onclick="openModal('group')">
                    <i class="fas fa-plus"></i> Create Group
                </button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">
        `;
        
        if (!groups.length) {
            html += `
                <div class="card" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray-500);">
                    <i class="fas fa-layer-group" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    No groups created
                </div>
            `;
        } else {
            groups.forEach(function(g) {
                html += `
                    <div class="card">
                        <div class="card-body">
                            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                                <h4 style="margin:0;">${g.name}</h4>
                                <span class="badge badge-primary">${g.member_count || 0}</span>
                            </div>
                            <div style="font-size:13px;color:var(--gray-500);margin-top:4px;">${g.description || 'No description'}</div>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `</div>`;
        $('pageContent').innerHTML = html;
    });
}

function renderSettings() {
    $('pageContent').innerHTML = `
        <h2 style="margin-bottom:20px;">Settings</h2>
        <div class="card">
            <div class="card-header"><h3>Village Information</h3></div>
            <div class="card-body">
                <p><strong>Village:</strong> ${localStorage.getItem('village_name') || 'Not set'}</p>
                <p><strong>Role:</strong> ${localStorage.getItem('role') || 'Member'}</p>
                <p><strong>Member ID:</strong> ${localStorage.getItem('member_id') || 'N/A'}</p>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>About</h3></div>
            <div class="card-body">
                <p><strong>App:</strong> MtaaLink v1.0.0</p>
                <p style="color:var(--gray-500);">Digitalizing villages, one community at a time. 🇰🇪</p>
            </div>
        </div>
        <div class="card" style="border:2px solid var(--danger);">
            <div class="card-header" style="border-bottom-color:var(--danger);">
                <h3 style="color:var(--danger);">Danger Zone</h3>
            </div>
            <div class="card-body">
                <button class="btn btn-danger" onclick="if(confirm('Are you sure?')) logout()">
                    <i class="fas fa-sign-out-alt"></i> Sign Out
                </button>
            </div>
        </div>
    `;
}

// ===== EDIT/DELETE =====
function editMember(id) {
    api.getMember(id)
        .then(function(member) {
            openModal('member', member);
        })
        .catch(function() {
            showToast('Error loading member', 'error');
        });
}

function deleteMember(id) {
    if (!confirm('Delete this member?')) return;
    api.deleteMember(id)
        .then(function() {
            showToast('Member deleted', 'success');
            renderMembers();
            updateBadges();
        })
        .catch(function() {
            showToast('Error deleting member', 'error');
        });
}

// ===== MODAL =====
function openModal(type, data) {
    data = data || null;
    
    var titles = {
        member: data ? 'Edit Member' : 'Add Member',
        meeting: data ? 'Edit Meeting' : 'Schedule Meeting',
        contribution: 'Record Contribution',
        group: data ? 'Edit Group' : 'Create Group'
    };
    
    $('modalTitle').textContent = titles[type] || 'Modal';
    $('modalBody').innerHTML = getModalForm(type, data);
    $('modalOverlay').classList.add('active');
    window._modalType = type;
    window._modalData = data;
}

function closeModal() {
    $('modalOverlay').classList.remove('active');
}

function submitModal() {
    var form = $('modalForm');
    if (!form) return;
    
    var data = {};
    var formData = new FormData(form);
    formData.forEach(function(value, key) {
        data[key] = value;
    });
    
    var type = window._modalType;
    var isEdit = !!window._modalData;
    var id = window._modalData ? window._modalData.id : null;
    
    // Validate required
    var required = form.querySelectorAll('[required]');
    var hasError = false;
    required.forEach(function(f) {
        if (!f.value.trim()) {
            f.classList.add('error');
            hasError = true;
        } else {
            f.classList.remove('error');
        }
    });
    if (hasError) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    var promise;
    switch (type) {
        case 'member':
            promise = isEdit && id ? api.updateMember(id, data) : api.createMember(data);
            break;
        case 'meeting':
            promise = isEdit && id ? api.updateMeeting(id, data) : api.createMeeting(data);
            break;
        case 'group':
            promise = isEdit && id ? api.updateGroup(id, data) : api.createGroup(data);
            break;
        case 'contribution':
            promise = api.createContribution(data);
            break;
        default:
            return;
    }
    
    promise
        .then(function() {
            closeModal();
            showToast('✅ Saved!', 'success');
            navigateTo(currentPage);
            updateBadges();
        })
        .catch(function(err) {
            showToast(err.message || 'Error saving', 'error');
        });
}

function getModalForm(type, data) {
    data = data || {};
    
    var forms = {
        member: `
            <form id="modalForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name <span class="required">*</span></label>
                        <input type="text" class="form-control" name="first_name" value="${data.first_name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name <span class="required">*</span></label>
                        <input type="text" class="form-control" name="last_name" value="${data.last_name || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Phone <span class="required">*</span></label>
                    <input type="tel" class="form-control" name="phone" value="${data.phone || ''}" placeholder="0712345678" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" class="form-control" name="email" value="${data.email || ''}">
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select class="form-control form-select" name="role">
                        <option value="member" ${data.role === 'member' ? 'selected' : ''}>Member</option>
                        <option value="elder" ${data.role === 'elder' ? 'selected' : ''}>Elder</option>
                        <option value="secretary" ${data.role === 'secretary' ? 'selected' : ''}>Secretary</option>
                        <option value="treasurer" ${data.role === 'treasurer' ? 'selected' : ''}>Treasurer</option>
                        <option value="chairperson" ${data.role === 'chairperson' ? 'selected' : ''}>Chairperson</option>
                    </select>
                </div>
            </form>
        `,
        meeting: `
            <form id="modalForm">
                <div class="form-group">
                    <label>Title <span class="required">*</span></label>
                    <input type="text" class="form-control" name="title" value="${data.title || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Date <span class="required">*</span></label>
                        <input type="date" class="form-control" name="date" value="${data.date || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Time <span class="required">*</span></label>
                        <input type="time" class="form-control" name="time" value="${data.time || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" class="form-control" name="location" value="${data.location || ''}" placeholder="Village Hall">
                </div>
                <div class="form-group">
                    <label>Agenda</label>
                    <textarea class="form-control" name="agenda" rows="3">${data.agenda || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Quorum</label>
                    <input type="number" class="form-control" name="quorum_required" value="${data.quorum_required || 10}" min="1">
                </div>
            </form>
        `,
        contribution: `
            <form id="modalForm">
                <div class="form-group">
                    <label>Member ID <span class="required">*</span></label>
                    <input type="text" class="form-control" name="member_id" placeholder="Enter member ID" required>
                </div>
                <div class="form-group">
                    <label>Amount (KES) <span class="required">*</span></label>
                    <input type="number" class="form-control" name="amount" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Due Date</label>
                    <input type="date" class="form-control" name="due_date">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select class="form-control form-select" name="status">
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                    </select>
                </div>
            </form>
        `,
        group: `
            <form id="modalForm">
                <div class="form-group">
                    <label>Group Name <span class="required">*</span></label>
                    <input type="text" class="form-control" name="name" value="${data.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea class="form-control" name="description" rows="3">${data.description || ''}</textarea>
                </div>
            </form>
        `
    };
    
    return forms[type] || '<p>Unknown form</p>';
}

// ===== TOAST =====
function showToast(message, type) {
    type = type || 'info';
    var container = $('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
}

// ===== EVENTS =====
function setupEvents() {
    console.log('🔧 Setting up events...');
    
    // Login button
    var loginBtn = document.querySelector('#loginForm button[type="submit"]');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        console.log('✅ Login button attached');
    }
    
    // Login form
    var loginForm = $('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    var registerForm = $('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Logout
    var logoutBtn = $('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Menu toggle (mobile)
    var menuToggle = $('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSidebar();
        });
    }
    
    
    // Modal overlay
    var modalOverlay = $('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === e.currentTarget) closeModal();
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeSidebar();
        }
        if (e.ctrlKey && e.key === '1') navigateTo('dashboard');
        if (e.ctrlKey && e.key === '2') navigateTo('members');
        if (e.ctrlKey && e.key === '3') navigateTo('meetings');
    });
    
    // Search
    var searchInput = $('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var query = e.target.value.trim();
                if (query) {
                    showToast('Search: "' + query + '"', 'info');
                    e.target.value = '';
                }
            }
        });
    }
    
    // Close sidebar on resize to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
}

// ===== MAKE GLOBALLY AVAILABLE =====
window.navigateTo = navigateTo;
window.openModal = openModal;
window.closeModal = closeModal;
window.submitModal = submitModal;
window.showToast = showToast;
window.editMember = editMember;
window.deleteMember = deleteMember;
window.logout = logout;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.renderDashboard = renderDashboard;
window.renderMembers = renderMembers;
window.renderMeetings = renderMeetings;
window.renderContributions = renderContributions;
window.renderGroups = renderGroups;
window.renderSettings = renderSettings;
window.closeSidebar = closeSidebar;
window.openSidebar = openSidebar;
window.toggleSidebar = toggleSidebar;

// ===== START APP =====
console.log('✅ App script loaded');
setupEvents();
console.log('✅ MtaaLink ready!');

// Initialize PWA
document.addEventListener('DOMContentLoaded', function() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        // Store the event for later use
        window.deferredPrompt = e;
        console.log('PWA install prompt ready');
    });
});

// Add install button to header
function addInstallButton() {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return;
    }
    
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;
    
    // Check if button already exists
    if (document.getElementById('pwaInstallBtn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'pwaInstallBtn';
    btn.className = 'btn btn-sm btn-success';
    btn.textContent = '📱 Install App';
    btn.style.marginRight = '8px';
    btn.style.fontSize = '12px';
    btn.addEventListener('click', function() {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then(function(choiceResult) {
                if (choiceResult.outcome === 'accepted') {
                    console.log('App installed');
                    document.getElementById('pwaInstallBtn').style.display = 'none';
                } else {
                    console.log('Install dismissed');
                }
                window.deferredPrompt = null;
            });
        } else {
            alert('Install prompt not available. Try using the browser menu to install.');
        }
    });
    headerRight.appendChild(btn);
}

// Call this when page loads
setTimeout(addInstallButton, 2000);

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registered successfully');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

/* ============================================================
   Management System - Dashboard Page (No Emojis, Clean Labels)
   ============================================================ */

import { getMembers, getMeetings, getGroups, getContributions, getCurrentUser, getAnnouncements } from '../core/api.js';
import { showToast, showError } from '../components/toast.js';

let dashboardData = {
    members: [],
    meetings: [],
    groups: [],
    contributions: [],
    announcements: []
};

export async function renderDashboard() {
    const app = document.getElementById('app');
    if (!app) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
        if (typeof renderLogin === 'function') {
            renderLogin();
        } else {
            window.location.reload();
        }
        return;
    }
    
    try {
        app.innerHTML = `
            <div class="app-container">
                <aside class="sidebar" id="sidebar">
                    <div class="sidebar-brand">
                        <span class="brand-name">Management System</span>
                        <span class="brand-tagline">Complete Management</span>
                    </div>
                    <nav class="sidebar-nav">
                        <div class="nav-section">
                            <span class="nav-label">Main</span>
                            <a href="#" class="nav-link active" data-page="dashboard">Dashboard</a>
                            <a href="#" class="nav-link" data-page="members">Members</a>
                            <a href="#" class="nav-link" data-page="groups">Groups</a>
                            <a href="#" class="nav-link" data-page="meetings">Meetings</a>
                            <a href="#" class="nav-link" data-page="contributions">Contributions</a>
                            <a href="#" class="nav-link" data-page="contribution_types">Contribution Types</a>
                            <a href="#" class="nav-link" data-page="projects">Projects</a>
                            <a href="#" class="nav-link" data-page="events">Events</a>
                            <a href="#" class="nav-link" data-page="elections">Elections</a>
                            <a href="#" class="nav-link" data-page="expenses">Expenses</a>
                            <a href="#" class="nav-link" data-page="announcements">Announcements</a>
                            <a href="#" class="nav-link" data-page="reports">Reports</a>
                        </div>
                        <div class="nav-section">
                            <span class="nav-label">System</span>
                            <a href="#" class="nav-link" data-page="settings">Settings</a>
                        </div>
                    </nav>
                    <div class="sidebar-footer">
                        <div class="user-card">
                            <div class="user-avatar" id="userAvatar">A</div>
                            <div class="user-info">
                                <span class="user-name" id="userName"></span>
                                <span class="user-role" id="userRole">Member</span>
                            </div>
                            <button class="logout-btn" id="logoutBtn">Sign Out</button>
                        </div>
                    </div>
                </aside>
                
                <main class="main-content">
                    <header class="top-header">
                        <div class="header-left">
                            <button class="menu-toggle" id="menuToggle">☰</button>
                            <h1 id="pageTitle">${localStorage.getItem("org_name") || localStorage.getItem("organization_name") || "Management System"}</h1>
                        </div>
                        <div class="header-right">
                            <span id="onlineStatus" style="font-size:12px;padding:4px 8px;border-radius:4px;background:var(--gray-50);">Online</span>
                            <button class="header-btn" id="syncBtn">⟳</button>
                        </div>
                    </header>
                    
                    <div class="page-content" id="pageContent">
                        ${Skeletons.stats()}
                    </div>
                </main>
            </div>
        `;
        
        setupSidebar();
        setupNavigation();
        
        await loadUserData();
        
        const currentPage = localStorage.getItem('current_page') || 'dashboard';
        if (currentPage === 'dashboard') {
            await loadDashboardData();
            renderDashboardContent();
        }
        
    } catch (error) {
        console.error('Dashboard error:', error);
        const content = document.getElementById('pageContent');
        if (content) {
            content.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <div class="empty-state">
                            <p style="color:var(--danger);">${error.message || 'Failed to load dashboard'}</p>
                            <button class="btn btn-primary" onclick="renderDashboard()">Retry</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

async function loadUserData() {
    try {
        const user = await getCurrentUser();
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        
        if (userAvatar) {
            userAvatar.textContent = user.first_name ? user.first_name.charAt(0).toUpperCase() : 'A';
        }
        if (userName) {
            userName.textContent = user.full_name || (user.first_name || '') + ' ' + (user.last_name || '');
        }
        if (userRole) {
            userRole.textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member';
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        const role = localStorage.getItem('role');
        const organizationName = localStorage.getItem('org_name') || localStorage.getItem('organization_name') || "Management System";
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        
        if (userNameEl && organizationName) {
            userNameEl.textContent = organizationName;
        }
        if (userRoleEl && role) {
            userRoleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        }
    }
}

async function loadDashboardData() {
    try {
        const [members, meetings, groups, contributions, announcements] = await Promise.all([
            getMembers().catch(function() { return []; }),
            getMeetings().catch(function() { return []; }),
            getGroups().catch(function() { return []; }),
            getContributions().catch(function() { return { contributions: [] }; }),
            getAnnouncements().catch(function() { return []; })
        ]);
        
        dashboardData.members = members || [];
        dashboardData.meetings = meetings || [];
        dashboardData.groups = groups || [];
        dashboardData.contributions = contributions.contributions || [];
        dashboardData.announcements = announcements || [];
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        throw error;
    }
}

function renderDashboardContent() {
    const content = document.getElementById('pageContent');
    if (!content) return;
    
    const totalMembers = dashboardData.members.length;
    const totalMeetings = dashboardData.meetings.length;
    const totalGroups = dashboardData.groups.length;
    const totalContributions = dashboardData.contributions.length;
    const totalAnnouncements = dashboardData.announcements.length;
    
    let totalCollected = 0;
    dashboardData.contributions.forEach(function(c) {
        totalCollected += parseFloat(c.paid_amount || 0);
    });
    
    const upcomingMeetings = dashboardData.meetings
        .filter(function(m) { return m.status === 'scheduled' || m.status === 'ongoing'; })
        .slice(0, 3);
    
    const recentMembers = dashboardData.members.slice(0, 5);
    const recentAnnouncements = dashboardData.announcements.slice(0, 3);
    
    content.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Members</div>
                <div class="stat-value">${totalMembers}</div>
                <div class="stat-change">Active members</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Meetings</div>
                <div class="stat-value">${totalMeetings}</div>
                <div class="stat-change">Scheduled and completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Contributions</div>
                <div class="stat-value">KES ${totalCollected.toLocaleString()}</div>
                <div class="stat-change">${totalContributions} contributions</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Groups</div>
                <div class="stat-value">${totalGroups}</div>
                <div class="stat-change">Organization groups</div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>Quick Actions</h3>
            </div>
            <div class="card-body">
                <div class="quick-actions">
                    <button class="btn btn-blue" onclick="navigateTo('members')">Members</button>
                    <button class="btn btn-purple" onclick="navigateTo('groups')">Groups</button>
                    <button class="btn btn-green" onclick="navigateTo('meetings')">Meetings</button>
                    <button class="btn btn-orange" onclick="navigateTo('contributions')">Contributions</button>
                    <button class="btn btn-teal" onclick="navigateTo('projects')">Projects</button>
                    <button class="btn btn-pink" onclick="navigateTo('events')">Events</button>
                    <button class="btn btn-red" onclick="navigateTo('expenses')">Expenses</button>
                    <button class="btn btn-indigo" onclick="navigateTo('announcements')">Announcements</button>
                    <button class="btn btn-cyan" onclick="navigateTo('reports')">Reports</button>
                </div>
            </div>
        </div>
        
        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3>Upcoming Meetings</h3>
                    <a href="#" onclick="navigateTo('meetings')" class="view-all">View all</a>
                </div>
                <div class="card-body">
                    ${upcomingMeetings.length === 0 ? `
                        <p class="text-muted">No upcoming meetings</p>
                    ` : `
                        <div class="meeting-list">
                            ${upcomingMeetings.map(function(m) {
                                return `
                                    <div class="meeting-item">
                                        <div>
                                            <div class="meeting-title">${m.title}</div>
                                            <div class="meeting-date">${m.date} at ${m.time}</div>
                                        </div>
                                        <span class="badge badge-primary">${m.status}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3>Recent Members</h3>
                    <a href="#" onclick="navigateTo('members')" class="view-all">View all</a>
                </div>
                <div class="card-body">
                    ${recentMembers.length === 0 ? `
                        <p class="text-muted">No members yet</p>
                    ` : `
                        <div class="activity-list">
                            ${recentMembers.map(function(m) {
                                return `
                                    <div class="activity-item">
                                        <div class="activity-icon">${m.first_name ? m.first_name[0] : 'M'}</div>
                                        <div class="activity-content">
                                            <span class="activity-text">${m.full_name || m.first_name + ' ' + m.last_name}</span>
                                            <span class="activity-time">${m.role || 'Member'}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>Recent Announcements</h3>
                <a href="#" onclick="navigateTo('announcements')" class="view-all">View all</a>
            </div>
            <div class="card-body">
                ${recentAnnouncements.length === 0 ? `
                    <p class="text-muted">No announcements yet</p>
                ` : `
                    <div class="activity-list">
                        ${recentAnnouncements.map(function(a) {
                            return `
                                <div class="activity-item">
                                    <div class="activity-icon">A</div>
                                    <div class="activity-content">
                                        <span class="activity-text"><strong>${a.title}</strong></span>
                                        <span class="activity-time">${a.status} · ${new Date(a.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

function setupSidebar() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            localStorage.removeItem('organization_id');
            localStorage.removeItem('organization_name');
            localStorage.removeItem('role');
            localStorage.removeItem('member_id');
            localStorage.removeItem('current_page');
            showToast('Signed out', 'info');
            setTimeout(function() {
                if (typeof renderLogin === 'function') {
                    renderLogin();
                } else {
                    window.location.reload();
                }
            }, 1500);
        });
    }
    
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('open');
        });
    }
    
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('menuToggle');
        if (sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.addEventListener("click", function() {
            showToast("Page refreshed", "success");
        });
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) {
                if (typeof navigateTo === 'function') {
                    navigateTo(page);
                }
            }
        });
    });
}

window.renderDashboard = renderDashboard;

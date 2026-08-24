// MtaaLink PWA - Main Application

const API_BASE = 'http://localhost:8000/api/v1';
let state = {
    token: localStorage.getItem('token'),
    village: null,
    user: null,
    currentPage: 'dashboard',
    isOffline: !navigator.onLine,
    isSyncing: false
};

// DOM Elements
const elements = {
    mainContent: document.getElementById('mainContent'),
    sidebar: document.getElementById('sidebar'),
    menuToggle: document.getElementById('menuToggle'),
    closeSidebar: document.getElementById('closeSidebar'),
    logoutBtn: document.getElementById('logoutBtn'),
    syncBtn: document.getElementById('syncBtn'),
    villageName: document.getElementById('villageName'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    offlineIndicator: document.getElementById('offlineIndicator'),
    toastContainer: document.getElementById('toastContainer'),
    bottomNav: document.getElementById('bottomNav')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAuth();
    setupOfflineListener();
    registerServiceWorker();
});

// Event Listeners
function setupEventListeners() {
    // Menu toggle for mobile
    elements.menuToggle?.addEventListener('click', () => {
        elements.sidebar.classList.toggle('open');
    });
    
    elements.closeSidebar?.addEventListener('click', () => {
        elements.sidebar.classList.remove('open');
    });
    
    // Logout
    elements.logoutBtn?.addEventListener('click', logout);
    
    // Sync
    elements.syncBtn?.addEventListener('click', syncData);
    
    // Sidebar menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
            elements.sidebar.classList.remove('open');
        });
    });
    
    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
}

// Check Authentication
function checkAuth() {
    if (!state.token) {
        showLogin();
        return;
    }
    
    // Load user data
    loadUserData();
}

// Show Login
function showLogin() {
    elements.mainContent.innerHTML = `
        <div class="loading-screen">
            <div class="login-container" style="max-width:400px;margin:40px auto;">
                <h2>🏘️ MtaaLink</h2>
                <p style="color:var(--gray);margin-bottom:20px;">Welcome back! Please login to continue.</p>
                <form id="loginForm" style="display:flex;flex-direction:column;gap:12px;">
                    <input type="email" id="loginEmail" placeholder="Email" required 
                           style="padding:12px;border-radius:8px;border:1px solid #ddd;font-size:16px;">
                    <input type="password" id="loginPassword" placeholder="Password" required 
                           style="padding:12px;border-radius:8px;border:1px solid #ddd;font-size:16px;">
                    <button type="submit" style="padding:14px;border-radius:8px;border:none;
                            background:var(--primary);color:white;font-size:16px;font-weight:600;cursor:pointer;">
                        Login
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await login(email, password);
    });
}

// Login
async function login(email, password) {
    try {
        showToast('Logging in...', 'info');
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) throw new Error('Login failed');
        
        const data = await response.json();
        state.token = data.access_token;
        localStorage.setItem('token', state.token);
        
        showToast('Login successful!', 'success');
        await loadUserData();
        
    } catch (error) {
        showToast('Login failed: ' + error.message, 'error');
    }
}

// Load User Data
async function loadUserData() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load user data');
        
        const data = await response.json();
        state.user = data;
        state.village = data.village;
        
        // Update UI
        elements.villageName.textContent = data.village?.name || 'Village';
        elements.userName.textContent = `${data.first_name} ${data.last_name}`;
        elements.userRole.textContent = data.role || 'Member';
        
        // Navigate to dashboard
        navigateTo('dashboard');
        
    } catch (error) {
        console.error('Error loading user data:', error);
        // If token is invalid, logout
        if (error.message.includes('401')) {
            logout();
        }
    }
}

// Navigate to Page
async function navigateTo(page) {
    state.currentPage = page;
    
    // Update active states
    document.querySelectorAll('.menu-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === page);
    });
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === page);
    });
    
    // Load page content
    await loadPage(page);
}

// Load Page Content
async function loadPage(page) {
    const content = elements.mainContent;
    content.innerHTML = `
        <div class="loading-screen">
            <div class="spinner"></div>
            <p>Loading ${page}...</p>
        </div>
    `;
    
    try {
        let html = '';
        switch(page) {
            case 'dashboard':
                html = await renderDashboard();
                break;
            case 'members':
                html = await renderMembers();
                break;
            case 'meetings':
                html = await renderMeetings();
                break;
            case 'contributions':
                html = await renderContributions();
                break;
            case 'announcements':
                html = await renderAnnouncements();
                break;
            case 'reports':
                html = await renderReports();
                break;
            case 'backup':
                html = renderBackup();
                break;
            case 'settings':
                html = renderSettings();
                break;
            default:
                html = '<p>Page not found</p>';
        }
        content.innerHTML = html;
        
    } catch (error) {
        content.innerHTML = `
            <div class="loading-screen">
                <p style="color:var(--danger);">❌ Error: ${error.message}</p>
                <button onclick="navigateTo('dashboard')" 
                        style="margin-top:12px;padding:10px 24px;border:none;border-radius:8px;
                               background:var(--primary);color:white;cursor:pointer;">
                    Go to Dashboard
                </button>
            </div>
        `;
    }
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Logout
function logout() {
    state.token = null;
    localStorage.removeItem('token');
    showToast('Logged out successfully', 'info');
    showLogin();
}

// Offline/Online Listeners
function setupOfflineListener() {
    window.addEventListener('online', () => {
        state.isOffline = false;
        elements.offlineIndicator.style.display = 'none';
        showToast('You are back online!', 'success');
        syncData();
    });
    
    window.addEventListener('offline', () => {
        state.isOffline = true;
        elements.offlineIndicator.style.display = 'block';
        showToast('You are offline. Changes will sync when online.', 'warning');
    });
}

// Sync Data
async function syncData() {
    if (state.isOffline) {
        showToast('Cannot sync while offline', 'warning');
        return;
    }
    
    if (state.isSyncing) return;
    
    state.isSyncing = true;
    elements.syncBtn.classList.add('syncing');
    showToast('Syncing data...', 'info');
    
    try {
        // Sync pending changes from IndexedDB
        const pending = await getPendingChanges();
        if (pending.length > 0) {
            for (const change of pending) {
                await syncChange(change);
            }
            await clearSyncedChanges();
            showToast(`Synced ${pending.length} changes`, 'success');
        } else {
            showToast('All data is in sync', 'success');
        }
        
        // Refresh current page
        await loadPage(state.currentPage);
        
    } catch (error) {
        showToast('Sync failed: ' + error.message, 'error');
    } finally {
        state.isSyncing = false;
        elements.syncBtn.classList.remove('syncing');
    }
}

// Register Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ Service Worker registered'))
            .catch(err => console.log('❌ Service Worker registration failed:', err));
    }
}

// Export for use in other files
window.MtaaLink = {
    state,
    elements,
    showToast,
    navigateTo,
    loadPage,
    syncData
};

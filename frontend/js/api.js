// ============================================================
// MtaaLink - API Layer
// ============================================================

const API_BASE = '/api/v1';

function getToken() {
    return localStorage.getItem('token');
}

function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
}

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: getHeaders()
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (!response.ok) {
            let errorMessage = 'Request failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {}
            
            if (response.status === 401) {
                localStorage.removeItem('token');
                if (typeof showLogin === 'function') showLogin();
            }
            throw new Error(errorMessage);
        }
        
        if (response.status === 204) return null;
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== AUTH =====
function login(email, password) {
    return apiCall('/auth/login', 'POST', { email, password });
}

function register(data) {
    return apiCall('/auth/register', 'POST', data);
}

function getCurrentUser() {
    return apiCall('/auth/me');
}

function logout() {
    return apiCall('/auth/logout', 'POST');
}

// ===== MEMBERS =====
function getMembers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiCall('/members' + (qs ? '?' + qs : ''));
}

function getMember(id) {
    return apiCall('/members/' + id);
}

function createMember(data) {
    return apiCall('/members', 'POST', data);
}

function updateMember(id, data) {
    return apiCall('/members/' + id, 'PUT', data);
}

function deleteMember(id) {
    return apiCall('/members/' + id, 'DELETE');
}

// ===== GROUPS =====
function getGroups() {
    return apiCall('/groups');
}

function getGroup(id) {
    return apiCall('/groups/' + id);
}

function createGroup(data) {
    return apiCall('/groups', 'POST', data);
}

function updateGroup(id, data) {
    return apiCall('/groups/' + id, 'PUT', data);
}

function deleteGroup(id) {
    return apiCall('/groups/' + id, 'DELETE');
}

// ===== MEETINGS =====
function getMeetings(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiCall('/meetings' + (qs ? '?' + qs : ''));
}

function getMeeting(id) {
    return apiCall('/meetings/' + id);
}

function createMeeting(data) {
    return apiCall('/meetings', 'POST', data);
}

function updateMeeting(id, data) {
    return apiCall('/meetings/' + id, 'PUT', data);
}

function deleteMeeting(id) {
    return apiCall('/meetings/' + id, 'DELETE');
}

function startMeeting(id) {
    return apiCall('/meetings/' + id + '/start', 'POST');
}

function completeMeeting(id, minutes) {
    return apiCall('/meetings/' + id + '/complete?minutes=' + encodeURIComponent(minutes), 'POST');
}

// ===== CONTRIBUTIONS =====
function getContributions(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiCall('/contributions' + (qs ? '?' + qs : ''));
}

function createContribution(data) {
    return apiCall('/contributions', 'POST', data);
}

// ===== ANNOUNCEMENTS =====
function getAnnouncements() {
    return apiCall('/announcements');
}

function createAnnouncement(data) {
    return apiCall('/announcements', 'POST', data);
}

// ===== EXPENSES =====
function getExpenses() {
    return apiCall('/expenses');
}

function createExpense(data) {
    return apiCall('/expenses', 'POST', data);
}

// ===== EXPOSE TO GLOBAL SCOPE =====
window.api = {
    login: login,
    register: register,
    getCurrentUser: getCurrentUser,
    logout: logout,
    getMembers: getMembers,
    getMember: getMember,
    createMember: createMember,
    updateMember: updateMember,
    deleteMember: deleteMember,
    getGroups: getGroups,
    getGroup: getGroup,
    createGroup: createGroup,
    updateGroup: updateGroup,
    deleteGroup: deleteGroup,
    getMeetings: getMeetings,
    getMeeting: getMeeting,
    createMeeting: createMeeting,
    updateMeeting: updateMeeting,
    deleteMeeting: deleteMeeting,
    startMeeting: startMeeting,
    completeMeeting: completeMeeting,
    getContributions: getContributions,
    createContribution: createContribution,
    getAnnouncements: getAnnouncements,
    createAnnouncement: createAnnouncement,
    getExpenses: getExpenses,
    createExpense: createExpense
};


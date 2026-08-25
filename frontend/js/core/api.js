/* ============================================================
   Management System - API Core
   ============================================================ */

const API_BASE = '/api/v1';

function getToken() {
    return localStorage.getItem('token');
}

function getHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    const token = getToken();
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    return headers;
}

async function apiCall(endpoint, method = 'GET', data = null) {
    let url = API_BASE + endpoint;
    
    const options = {
        method: method,
        headers: getHeaders()
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            let errorMessage = 'Request failed with status ' + response.status;
            try {
                const errorData = await response.json();
                if (response.status === 422 && errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        const errors = errorData.detail.map(function(err) {
                            return err.msg + ' (field: ' + (err.loc ? err.loc.join('.') : 'unknown') + ')';
                        }).join('; ');
                        errorMessage = 'Validation error: ' + errors;
                    } else {
                        errorMessage = errorData.detail || errorMessage;
                    }
                } else {
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                }
            } catch (e) {
                try {
                    const text = await response.text();
                    if (text) errorMessage = text;
                } catch (e2) {}
            }
            
            if (response.status === 401) {
                localStorage.removeItem('token');
                if (typeof renderLogin === 'function') {
                    renderLogin();
                }
            }
            
            throw new Error(errorMessage);
        }
        
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== AUTH =====
export const login = (email, password) => apiCall('/auth/login', 'POST', { email, password });
export const register = (data) => apiCall('/auth/register', 'POST', data);
export const getCurrentUser = () => apiCall('/auth/me');
export const logout = () => apiCall('/auth/logout', 'POST');

// ===== MEMBERS =====
export const getMembers = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall('/members/' + (qs ? '?' + qs : ''));
};
export const getMember = (id) => apiCall('/members/' + id + '/');
export const createMember = (data) => apiCall('/members/', 'POST', data);
export const updateMember = (id, data) => apiCall('/members/' + id + '/', 'PUT', data);
export const deleteMember = (id) => apiCall('/members/' + id + '/', 'DELETE');
export const assignGroupToMember = (memberId, groupId) => apiCall('/members/' + memberId + '/assign-group?group_id=' + groupId, 'POST');
export const removeGroupFromMember = (memberId) => apiCall('/members/' + memberId + '/remove-group', 'DELETE');

// ===== MEETINGS =====
export const getMeetings = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall('/meetings/' + (qs ? '?' + qs : ''));
};
export const getMeeting = (id) => apiCall('/meetings/' + id + '/');
export const createMeeting = (data) => apiCall('/meetings/', 'POST', data);
export const updateMeeting = (id, data) => apiCall('/meetings/' + id + '/', 'PUT', data);
export const deleteMeeting = (id) => apiCall('/meetings/' + id + '/', 'DELETE');
export const startMeeting = (id) => apiCall('/meetings/' + id + '/start/', 'POST');
export const completeMeeting = (id, minutes) => apiCall('/meetings/' + id + '/complete/?minutes=' + encodeURIComponent(minutes), 'POST');
export const markAttendance = (id, memberIds) => apiCall('/meetings/' + id + '/attendance/', 'POST', memberIds);

// ===== GROUPS =====
export const getGroups = () => apiCall('/groups/');
export const getGroup = (id) => apiCall('/groups/' + id + '/');
export const createGroup = (data) => apiCall('/groups/', 'POST', data);
export const updateGroup = (id, data) => apiCall('/groups/' + id + '/', 'PUT', data);
export const deleteGroup = (id) => apiCall('/groups/' + id + '/', 'DELETE');
export const addMemberToGroup = (groupId, memberId) => apiCall('/groups/' + groupId + '/members/' + memberId + '/', 'POST');
export const removeMemberFromGroup = (groupId, memberId) => apiCall('/groups/' + groupId + '/members/' + memberId + '/', 'DELETE');

// ===== CONTRIBUTIONS =====
export const getContributions = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall('/contributions/' + (qs ? '?' + qs : ''));
};
export const createContribution = (data) => apiCall('/contributions', 'POST', data);
export const updateContribution = (id, data) => apiCall('/contributions/' + id, 'PUT', data);
export const deleteContribution = (id) => apiCall('/contributions/' + id, 'DELETE');
export const getContributionTypes = () => apiCall('/contributions/types');
export const createContributionType = (data) => apiCall('/contributions/types', 'POST', data);
export const updateContributionType = (id, data) => apiCall('/contributions/types/' + id, 'PUT', data);
export const deleteContributionType = (id) => apiCall('/contributions/types/' + id, 'DELETE');

// ===== ANNOUNCEMENTS =====
export const getAnnouncements = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall('/announcements/' + (qs ? '?' + qs : ''));
};
export const getAnnouncement = (id) => apiCall('/announcements/' + id + '/');
export const createAnnouncement = (data) => apiCall('/announcements/', 'POST', data);
export const updateAnnouncement = (id, data) => apiCall('/announcements/' + id + '/', 'PUT', data);
export const deleteAnnouncement = (id) => apiCall('/announcements/' + id + '/', 'DELETE');
export const sendAnnouncement = (id) => apiCall('/announcements/' + id + '/send/', 'POST');

// ===== PROJECTS =====
export const getProjects = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall('/projects/' + (qs ? '?' + qs : ''));
};
export const getProject = (id) => apiCall('/projects/' + id);
export const createProject = (data) => apiCall('/projects', 'POST', data);
export const updateProject = (id, data) => apiCall('/projects/' + id, 'PUT', data);
export const deleteProject = (id) => apiCall('/projects/' + id, 'DELETE');

// ===== EVENTS =====
export const getEvents = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall('/events/' + (qs ? '?' + qs : ''));
};
export const getEvent = (id) => apiCall('/events/' + id);
export const createEvent = (data) => apiCall('/events', 'POST', data);
export const updateEvent = (id, data) => apiCall('/events/' + id, 'PUT', data);
export const deleteEvent = (id) => apiCall('/events/' + id, 'DELETE');
export const addEventAttendance = (eventId, memberId, role = null) => {
    const url = '/events/' + eventId + '/attendance/' + memberId + (role ? '?role=' + encodeURIComponent(role) : '');
    return apiCall(url, 'POST');
};
export const addEventContribution = (eventId, data) => apiCall('/events/' + eventId + '/contributions', 'POST', data);

// ===== EXPENSES =====
export const getExpenses = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall('/expenses/' + (qs ? '?' + qs : ''));
};
export const getExpense = (id) => apiCall('/expenses/' + id + '/');
export const createExpense = (data) => apiCall('/expenses/', 'POST', data);
export const updateExpense = (id, data) => apiCall('/expenses/' + id + '/', 'PUT', data);
export const deleteExpense = (id) => apiCall('/expenses/' + id + '/', 'DELETE');
export const getExpenseCategories = () => apiCall('/expenses/categories/');
export const createExpenseCategory = (data) => apiCall('/expenses/categories/', 'POST', data);

// ===== ELECTIONS =====
export const getElections = () => apiCall('/elections');
export const getElection = (id) => apiCall('/elections/' + id);
export const createElection = (data) => apiCall('/elections', 'POST', data);
export const updateElection = (id, data) => apiCall('/elections/' + id, 'PUT', data);
export const startElection = (id) => apiCall('/elections/' + id + '/start', 'POST');
export const closeElection = (id) => apiCall('/elections/' + id + '/close', 'POST');
export const getElectionResults = (id) => apiCall('/elections/' + id + '/results');
export const castVote = (data) => apiCall('/elections/vote', 'POST', data);

// ===== ELECTIONS - Voter Codes =====
export const getVoterCodes = (electionId) => apiCall('/elections/' + electionId + '/voters');
export const generateVoterCodes = (electionId) => apiCall('/elections/' + electionId + '/generate-codes', 'POST');
export const resendVoterCode = (voterCode) => apiCall('/elections/resend-code/', 'POST', { voter_code: voterCode });
export const verifyVoterCode = (electionId, voterCode) => apiCall('/elections/' + electionId + '/verify/' + voterCode);

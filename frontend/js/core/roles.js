/* ============================================================
   MtaaLink - Role-Based UI Visibility
   ============================================================ */

const ADMIN_ROLES = ['admin', 'chairperson', 'secretary', 'elder', 'treasurer'];

// Selectors for buttons/links that are admin-only.
// Anything matching gets hidden for members.
const ADMIN_SELECTORS = [
    // Members page
    '#addMemberBtn', '.edit-member', '.delete-member',
    // Groups
    '#addGroupBtn', '#addMemberBtn', '.edit-group', '.delete-group', '.remove-member-btn',
    // Meetings
    '#addMeetingBtn',
    // Contributions
    '#addContributionBtn', '.record-payment', '.delete-contribution',
    // Contribution types
    '#addTypeBtn', '.edit-type', '.delete-type',
    // Elections
    '#addElectionBtn', '.edit-election', '.start-election', '.close-election',
    '.finalize-election', '.manage-codes', '.resend-code', '#generateCodesBtn',
    // Events
    '#addEventBtn', '.edit-event', '.delete-event', '.manage-attendance', '.manage-contributions',
    // Event detail
    '.add-attendee-btn',
    // Expenses
    '#addExpenseBtn', '#addCategoryBtn', '.edit-expense', '.delete-expense',
    // Announcements
    '#addAnnouncementBtn', '.send-announcement', '.edit-announcement', '.delete-announcement',
    // Projects
    '#addProjectBtn', '.add-milestone-btn', '.add-task-btn',
    // Sidebar
    '[data-admin-only]',
];

export function getUserRole() {
    return (localStorage.getItem('role') || 'member').toLowerCase();
}

export function isAdmin() {
    return ADMIN_ROLES.includes(getUserRole());
}

export function applyRoleVisibility() {
    const admin = isAdmin();

    // Hide data-admin-only elements (tagged directly)
    document.querySelectorAll('[data-admin-only]').forEach(el => {
        el.style.display = admin ? '' : 'none';
    });

    // Hide class-based admin selectors
    ADMIN_SELECTORS.forEach(sel => {
        try {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = admin ? '' : 'none';
            });
        } catch (e) {
            console.warn('[roles] Invalid selector:', sel);
        }
    });

    // Show member-only elements only to members
    document.querySelectorAll('[data-member-only]').forEach(el => {
        el.style.display = admin ? 'none' : '';
    });

    document.body.classList.toggle('role-admin', admin);
    document.body.classList.toggle('role-member', !admin);
    document.body.dataset.role = getUserRole();
}

// Runtime click interceptor — safety net for anything we missed
export function installAdminActionBlocker() {
    if (window._roleBlockerInstalled) return;
    window._roleBlockerInstalled = true;

    document.addEventListener('click', function(e) {
        if (isAdmin()) return;
        const btn = e.target.closest('button, a.btn, [role="button"]');
        if (!btn) return;

        const text = (btn.textContent || '').trim().toLowerCase();
        const cls = (btn.className || '').toLowerCase();
        const id = (btn.id || '').toLowerCase();

        // Never block these
        const safe = /\b(back|retry|view|cancel|close|ok|print|export|download|filter|previous|next|sign out|logout|save|toggle|show|hide|open)\b/i;
        if (safe.test(text)) return;

        const isAdminAction =
            /\b(add|create|new|edit|delete|remove|schedule|record|send|manage|start|close|finalize|generate|resend|complete|mark|approve|reject)\b/i.test(text) ||
            /\b(add|create|edit|delete|remove|manage|send|generate|resend|start|close|finalize)\b/.test(cls) ||
            /\b(add|create|edit|delete|new|manage|generate|resend)\b/.test(id);

        if (isAdminAction) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.showToast === 'function') {
                window.showToast('View-only access. Contact an admin to make changes.', 'warning');
            }
            return false;
        }
    }, true);
}

// Expose for inline use + debugging
window.MtaaRoles = {
    getUserRole,
    isAdmin,
    applyRoleVisibility,
    installAdminActionBlocker,
};

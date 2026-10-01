/* ============================================================
   MtaaLink - Role-Based UI Visibility
   ============================================================ */

const ADMIN_ROLES = ['admin', 'chairperson', 'secretary', 'elder', 'treasurer'];

/**
 * Get the current user's role from localStorage (lowercase).
 */
export function getUserRole() {
    return (localStorage.getItem('role') || 'member').toLowerCase();
}

/**
 * Check if the current user has admin permissions.
 */
export function isAdmin() {
    return ADMIN_ROLES.includes(getUserRole());
}

/**
 * Apply role-based visibility to the DOM.
 * - Hides [data-admin-only] elements for members
 * - Hides [data-member-only] elements for admins
 * - Adds body classes: role-admin / role-member for CSS targeting
 *
 * Should be called AFTER any page render completes.
 */
export function applyRoleVisibility() {
    const admin = isAdmin();

    document.querySelectorAll('[data-admin-only]').forEach(function(el) {
        el.style.display = admin ? '' : 'none';
    });

    document.querySelectorAll('[data-member-only]').forEach(function(el) {
        el.style.display = admin ? 'none' : '';
    });

    // Body class for CSS targeting (optional)
    document.body.classList.toggle('role-admin', admin);
    document.body.classList.toggle('role-member', !admin);
    document.body.dataset.role = getUserRole();
}

// Expose globally for inline onclick handlers or debugging
window.MtaaRoles = { getUserRole, isAdmin, applyRoleVisibility };

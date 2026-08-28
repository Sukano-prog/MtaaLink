/* ============================================================
   MtaaLink - Settings Page
   ============================================================ */

import { getCurrentUser, updateMember } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showFormModal, showConfirm, showModal } from '../components/modal.js';

let currentUser = null;

export async function renderSettings() {
    const content = document.getElementById('pageContent');
    
    try {
        currentUser = await getCurrentUser();
        
        // Get organization data from API
        const orgId = localStorage.getItem('organization_id') || localStorage.getItem('village_id');
        let orgData = {};
        if (orgId && orgId !== 'null' && orgId !== 'undefined') {
            try {
                const response = await fetch('/api/v1/organizations/' + orgId, {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                });
                if (response.ok) {
                    orgData = await response.json();
                }
            } catch (e) {
                console.warn('Could not fetch organization data:', e);
            }
        }
        
        content.innerHTML = `
            <div class="page-header">
                <h2>Settings</h2>
                <p style="color:var(--gray-500);margin:4px 0 0 0;">Manage your organization and account settings</p>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div class="card">
                    <div class="card-header">
                        <h3>Organization</h3>
                        <button class="btn btn-sm btn-outline" onclick="window.editOrganizationProfile()">Edit</button>
                    </div>
                    <div class="card-body">
                        <div><strong>Name:</strong> ${orgData.name || localStorage.getItem('org_name') || 'Not set'}</div>
                        <div><strong>Region:</strong> ${orgData.county || localStorage.getItem('org_region') || 'Not set'}</div>
                        <div><strong>Sub-Location:</strong> ${orgData.ward || localStorage.getItem('org_sublocation') || 'Not set'}</div>
                        <div><strong>Phone:</strong> ${orgData.phone || localStorage.getItem('org_phone') || 'Not set'}</div>
                        <div><strong>Email:</strong> ${orgData.admin_email || localStorage.getItem('org_email') || 'Not set'}</div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Admin</h3>
                        <button class="btn btn-sm btn-outline" onclick="window.editAdminProfile()">Edit</button>
                    </div>
                    <div class="card-body">
                        <div><strong>Name:</strong> ${currentUser?.full_name || 'Not set'}</div>
                        <div><strong>Email:</strong> ${currentUser?.email || 'Not set'}</div>
                        <div><strong>Phone:</strong> ${currentUser?.phone || 'Not set'}</div>
                        <div><strong>Role:</strong> ${currentUser?.role || 'Not set'}</div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Security</h3>
                    </div>
                    <div class="card-body">
                        <button class="btn btn-primary" onclick="window.changePassword()">Change Password</button>
                        <button class="btn btn-danger" onclick="window.handleLogout()">Sign Out</button>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3>System</h3>
                </div>
                <div class="card-body">
                    <div><strong>App:</strong> MtaaLink v1.0.0</div>
                </div>
            </div>
        `;
        
    } catch (error) {
        content.innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load settings: ${error.message}</p>
                <button class="btn btn-primary" onclick="renderSettings()">Retry</button>
            </div></div>
        `;
    }
}

window.editOrganizationProfile = function() {
    showFormModal({
        title: 'Edit Organization Profile',
        size: 'md',
        submitLabel: 'Update',
        fields: [
            {
                id: 'org_name',
                label: 'Organization Name',
                type: 'text',
                value: localStorage.getItem('org_name') || '',
                required: true,
                placeholder: 'Enter organization name'
            },
            {
                id: 'org_region',
                label: 'Region',
                type: 'text',
                value: localStorage.getItem('org_region') || '',
                required: false,
                placeholder: 'Enter region'
            },
            {
                id: 'org_sublocation',
                label: 'Sub-Location',
                type: 'text',
                value: localStorage.getItem('org_sublocation') || '',
                required: false,
                placeholder: 'Enter sub-location'
            },
            {
                id: 'org_phone',
                label: 'Phone',
                type: 'tel',
                value: localStorage.getItem('org_phone') || '',
                required: false,
                placeholder: '0712345678'
            },
            {
                id: 'org_email',
                label: 'Email',
                type: 'email',
                value: localStorage.getItem('org_email') || '',
                required: false,
                placeholder: 'organization@example.com'
            }
        ],
        onSubmit: function(data, done) {
            localStorage.setItem('org_name', data.org_name);
            localStorage.setItem('org_region', data.org_region);
            localStorage.setItem('org_sublocation', data.org_sublocation);
            localStorage.setItem('org_phone', data.org_phone);
            localStorage.setItem('org_email', data.org_email);
            
            showSuccess('Organization profile updated');
            done();
            renderSettings();
        }
    });
};

window.editAdminProfile = function() {
    if (!currentUser) {
        showError('User not loaded');
        return;
    }
    
    showFormModal({
        title: 'Edit Admin Profile',
        size: 'md',
        submitLabel: 'Update',
        fields: [
            {
                id: 'first_name',
                label: 'First Name',
                type: 'text',
                value: currentUser.first_name || '',
                required: true,
                placeholder: 'Enter first name'
            },
            {
                id: 'last_name',
                label: 'Last Name',
                type: 'text',
                value: currentUser.last_name || '',
                required: true,
                placeholder: 'Enter last name'
            },
            {
                id: 'phone',
                label: 'Phone',
                type: 'tel',
                value: currentUser.phone || '',
                required: false,
                placeholder: '0712345678'
            },
            {
                id: 'email',
                label: 'Email',
                type: 'email',
                value: currentUser.email || '',
                required: false,
                placeholder: 'admin@example.com'
            }
        ],
        onSubmit: function(data, done) {
            const formattedData = {
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone || '',
                email: data.email || ''
            };
            
            updateMember(currentUser.id, formattedData)
                .then(function() {
                    showSuccess('Profile updated successfully');
                    currentUser.first_name = data.first_name;
                    currentUser.last_name = data.last_name;
                    currentUser.phone = data.phone;
                    currentUser.email = data.email;
                    done();
                    renderSettings();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to update profile');
                });
        }
    });
};

window.changePassword = function() {
    showFormModal({
        title: 'Change Password',
        size: 'sm',
        submitLabel: 'Update Password',
        fields: [
            {
                id: 'old_password',
                label: 'Current Password',
                type: 'password',
                value: '',
                required: true,
                placeholder: 'Enter current password'
            },
            {
                id: 'new_password',
                label: 'New Password',
                type: 'password',
                value: '',
                required: true,
                placeholder: 'Enter new password (min 8 characters)',
                helper: 'Password must be at least 8 characters'
            },
            {
                id: 'confirm_password',
                label: 'Confirm New Password',
                type: 'password',
                value: '',
                required: true,
                placeholder: 'Confirm new password'
            }
        ],
        onSubmit: function(data, done) {
            if (data.new_password.length < 8) {
                showError('Password must be at least 8 characters');
                return;
            }
            if (data.new_password !== data.confirm_password) {
                showError('Passwords do not match');
                return;
            }
            
            fetch('/api/v1/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({
                    old_password: data.old_password,
                    new_password: data.new_password
                })
            })
            .then(function(response) {
                if (!response.ok) {
                    return response.json().then(function(err) {
                        throw new Error(err.detail || 'Failed to change password');
                    });
                }
                return response.json();
            })
            .then(function() {
                showSuccess('Password changed successfully');
                done();
            })
            .catch(function(error) {
                showError(error.message || 'Failed to change password');
            });
        }
    });
};

window.handleLogout = function() {
    showConfirm({
        title: 'Sign Out',
        message: 'Are you sure you want to sign out?',
        confirmLabel: 'Sign Out',
        confirmClass: 'btn-danger',
        onConfirm: function(done) {
            localStorage.removeItem('token');
            localStorage.removeItem('organization_id');
            localStorage.removeItem('org_name');
            localStorage.removeItem('org_region');
            localStorage.removeItem('org_sublocation');
            localStorage.removeItem('org_phone');
            localStorage.removeItem('org_email');
            localStorage.removeItem('role');
            localStorage.removeItem('member_id');
            localStorage.removeItem('current_page');
            showSuccess('Signed out successfully');
            done();
            if (typeof renderLogin === 'function') {
                renderLogin();
            } else {
                window.location.reload();
            }
        }
    });
};

window.renderSettings = renderSettings;

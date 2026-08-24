/* ============================================================
   Management System - Settings Page
   ============================================================ */

import { getCurrentUser, updateMember } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showFormModal, showConfirm, showModal } from '../components/modal.js';

let currentUser = null;

export async function renderSettings() {
    const content = document.getElementById('pageContent');
    
    try {
        currentUser = await getCurrentUser();
        // Get village data from API
        const villageData = await fetch('/api/v1/organizations/' + localStorage.getItem('village_id'), {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        }).then(r => r.json()).catch(() => ({}));
        
        content.innerHTML = `
            <div class="page-header">
                <h2>Settings</h2>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div class="card">
                    <div class="card-header">
                        <h3>Organization Profile</h3>
                        <button class="btn btn-sm btn-outline" onclick="window.editOrganizationProfile()">Edit</button>
                    </div>
                    <div class="card-body">
                        <div><strong>Name:</strong> ${villageData.name || 'Not set'}</div>
                        <div><strong>Region:</strong> ${villageData.county || 'Not set'}</div>
                        <div><strong>Sub-Location:</strong> ${villageData.ward || 'Not set'}</div>
                        <div><strong>Phone:</strong> ${villageData.phone || 'Not set'}</div>
                        <div><strong>Email:</strong> ${villageData.admin_email || 'Not set'}</div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Admin Profile</h3>
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
                        <button class="btn btn-danger" style="margin-left:10px;" onclick="window.handleLogout()">Sign Out</button>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Preferences</h3>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="languageSelect">Language</label>
                            <select id="languageSelect" class="form-control form-select" onchange="window.changeLanguage(this.value)">
                                <option value="en" ${localStorage.getItem('language') === 'en' ? 'selected' : ''}>English</option>
                                <option value="sw" ${localStorage.getItem('language') === 'sw' ? 'selected' : ''}>Swahili</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card" style="margin-top:20px;">
                <div class="card-header">
                    <h3>System Information</h3>
                </div>
                <div class="card-body">
                    <div><strong>App Name:</strong> Management System</div>
                    <div><strong>Version:</strong> 1.0.0</div>
                    <div><strong>Organization ID:</strong> ${localStorage.getItem('village_id') || 'N/A'}</div>
                    <div><strong>Member ID:</strong> ${localStorage.getItem('member_id') || 'N/A'}</div>
                    <div><strong>Role:</strong> ${localStorage.getItem('role') || 'Member'}</div>
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
                placeholder: 'Enter village name'
            },
            {
                id: 'org_region',
                label: 'Region',
                type: 'text',
                value: localStorage.getItem('org_region') || '',
                required: false,
                placeholder: 'Enter county'
            },
            {
                id: 'org_sublocation',
                label: 'Sub-Location',
                type: 'text',
                value: localStorage.getItem('org_sublocation') || '',
                required: false,
                placeholder: 'Enter ward'
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
                placeholder: 'village@example.com'
            }
        ],
        onSubmit: function(data, done) {
            localStorage.setItem('org_name', data.org_name);
            localStorage.setItem('org_region', data.org_region);
            localStorage.setItem('org_sublocation', data.org_sublocation);
            localStorage.setItem('org_phone', data.org_phone);
            localStorage.setItem('org_email', data.org_email);
            
            showSuccess('Village profile updated');
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

window.changeLanguage = function(lang) {
    localStorage.setItem('language', lang);
    showSuccess('Language changed to ' + (lang === 'en' ? 'English' : 'Swahili'));
    renderSettings();
};

window.handleLogout = function() {
    showConfirm({
        title: 'Sign Out',
        message: 'Are you sure you want to sign out?',
        confirmLabel: 'Sign Out',
        confirmClass: 'btn-danger',
        onConfirm: function(done) {
            localStorage.removeItem('token');
            localStorage.removeItem('village_id');
            localStorage.removeItem('org_name');
            localStorage.removeItem('org_region');
            localStorage.removeItem('org_sublocation');
            localStorage.removeItem('org_phone');
            localStorage.removeItem('org_email');
            localStorage.removeItem('role');
            localStorage.removeItem('member_id');
            localStorage.removeItem('current_page');
            localStorage.removeItem('language');
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

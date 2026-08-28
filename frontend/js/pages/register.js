/* ============================================================
   MtaaLink - Register Page
   ============================================================ */

import { register } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';

let isLoading = false;

export function renderRegister() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>MtaaLink</h1>
                    <p>Register Your Organization</p>
                </div>
                
                <form id="registerForm" novalidate>
                    <div class="form-group">
                        <label for="regOrganizationName">Organization Name</label>
                        <input type="text" id="regOrganizationName" class="form-control" placeholder="Enter your organization name" required>
                        <div class="form-error" id="organizationNameError"></div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="regFirstName">First Name</label>
                            <input type="text" id="regFirstName" class="form-control" placeholder="First name" required>
                            <div class="form-error" id="firstNameError"></div>
                        </div>
                        <div class="form-group">
                            <label for="regLastName">Last Name</label>
                            <input type="text" id="regLastName" class="form-control" placeholder="Last name" required>
                            <div class="form-error" id="lastNameError"></div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="regPhone">Phone Number</label>
                        <input type="tel" id="regPhone" class="form-control" placeholder="0712345678" required>
                        <div class="form-helper">Format: 0712345678 (10 digits)</div>
                        <div class="form-error" id="phoneError"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="regEmail">Email Address</label>
                        <input type="email" id="regEmail" class="form-control" placeholder="admin@organization.com" required>
                        <div class="form-error" id="emailError"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="regPassword">Password</label>
                        <input type="password" id="regPassword" class="form-control" placeholder="Min 8 characters" required minlength="8">
                        <div class="form-helper">Password must be at least 8 characters</div>
                        <div class="form-error" id="passwordError"></div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block" id="registerBtn">
                        Register Organization
                    </button>
                </form>
                
                <div class="auth-footer">
                    <a id="loginLink">Already have an account? Sign In</a>
                    <span class="credit">Built for Kenya</span>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginLink').addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof renderLogin === 'function') {
            renderLogin();
        }
    });
    
    document.getElementById('regOrganizationName').addEventListener('input', function() {
        clearError('organizationNameError');
    });
    document.getElementById('regFirstName').addEventListener('input', function() {
        clearError('firstNameError');
    });
    document.getElementById('regLastName').addEventListener('input', function() {
        clearError('lastNameError');
    });
    document.getElementById('regPhone').addEventListener('input', function() {
        clearError('phoneError');
    });
    document.getElementById('regEmail').addEventListener('input', function() {
        clearError('emailError');
    });
    document.getElementById('regPassword').addEventListener('input', function() {
        clearError('passwordError');
    });
}

async function handleRegister(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const organizationName = document.getElementById('regOrganizationName').value.trim();
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    
    let hasError = false;
    
    if (!organizationName || organizationName.length < 2) {
        showFieldError('organizationNameError', 'Please enter a valid organization name');
        hasError = true;
    }
    
    if (!firstName || firstName.length < 2) {
        showFieldError('firstNameError', 'Please enter your first name');
        hasError = true;
    }
    
    if (!lastName || lastName.length < 2) {
        showFieldError('lastNameError', 'Please enter your last name');
        hasError = true;
    }
    
    if (!phone || !phone.match(/^0[17]\d{8}$/)) {
        showFieldError('phoneError', 'Phone must be 10 digits starting with 0 (e.g., 0712345678)');
        hasError = true;
    }
    
    if (!email || !email.includes('@') || !email.includes('.')) {
        showFieldError('emailError', 'Please enter a valid email address');
        hasError = true;
    }
    
    if (!password || password.length < 8) {
        showFieldError('passwordError', 'Password must be at least 8 characters');
        hasError = true;
    }
    
    if (hasError) return;
    
    isLoading = true;
    const btn = document.getElementById('registerBtn');
    btn.textContent = 'Registering...';
    btn.disabled = true;
    btn.classList.add('btn-loading');
    
    try {
        const data = {
            organization_name: organizationName,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            email: email,
            password: password
        };
        
        await register(data);
        showSuccess('Registration successful! Please sign in.');
        
        if (typeof renderLogin === 'function') {
            renderLogin();
        }
        
    } catch (error) {
        showError(error.message || 'Registration failed. Please try again.');
    } finally {
        isLoading = false;
        btn.textContent = 'Register Organization';
        btn.disabled = false;
        btn.classList.remove('btn-loading');
    }
}

function showFieldError(id, message) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = message;
        const input = el.closest('.form-group').querySelector('.form-control');
        if (input) input.classList.add('error');
    }
}

function clearError(id) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = '';
        const input = el.closest('.form-group').querySelector('.form-control');
        if (input) input.classList.remove('error');
    }
}

window.renderRegister = renderRegister;

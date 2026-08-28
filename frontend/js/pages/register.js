/* ============================================================
   MtaaLink - Register Page
   ============================================================ */

import { register } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';

let isLoading = false;

export function renderRegister() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="login-wrapper">
            <div class="login-box">
                <div class="login-brand">
                    <h1>MtaaLink</h1>
                    <p>Create your account</p>
                </div>
                
                <form id="registerForm">
                    <div class="form-group">
                        <label>Organization Name</label>
                        <input type="text" id="regOrgName" class="form-control" placeholder="Enter organization name" required>
                        <div class="error" id="orgNameError"></div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>First Name</label>
                            <input type="text" id="regFirstName" class="form-control" placeholder="First name" required>
                            <div class="error" id="firstNameError"></div>
                        </div>
                        <div class="form-group">
                            <label>Last Name</label>
                            <input type="text" id="regLastName" class="form-control" placeholder="Last name" required>
                            <div class="error" id="lastNameError"></div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="tel" id="regPhone" class="form-control" placeholder="0712345678" required>
                        <div class="error" id="phoneError"></div>
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="regEmail" class="form-control" placeholder="you@example.com" required>
                        <div class="error" id="emailError"></div>
                    </div>
                    
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="regPassword" class="form-control" placeholder="Min 8 characters" required minlength="8">
                        <div class="error" id="passwordError"></div>
                    </div>
                    
                    <button type="submit" class="btn-primary" id="registerBtn">Create Account</button>
                </form>
                
                <div class="login-footer">
                    <a id="loginLink">Already have an account? Sign In</a>
                </div>
            </div>
        </div>
    `;
    
    // Add row styles
    const style = document.createElement('style');
    style.textContent = `.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }`;
    document.head.appendChild(style);
    
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginLink').addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof renderLogin === 'function') renderLogin();
    });
}

async function handleRegister(e) {
    e.preventDefault();
    if (isLoading) return;
    
    const data = {
        organization_name: document.getElementById('regOrgName').value.trim(),
        first_name: document.getElementById('regFirstName').value.trim(),
        last_name: document.getElementById('regLastName').value.trim(),
        phone: document.getElementById('regPhone').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value
    };
    
    const btn = document.getElementById('registerBtn');
    let hasError = false;
    
    if (!data.organization_name || data.organization_name.length < 2) {
        document.getElementById('orgNameError').textContent = 'Organization name is required';
        hasError = true;
    }
    if (!data.first_name || data.first_name.length < 2) {
        document.getElementById('firstNameError').textContent = 'First name is required';
        hasError = true;
    }
    if (!data.last_name || data.last_name.length < 2) {
        document.getElementById('lastNameError').textContent = 'Last name is required';
        hasError = true;
    }
    if (!data.phone || !/^0[17]\d{8}$/.test(data.phone)) {
        document.getElementById('phoneError').textContent = 'Enter a valid phone (0712345678)';
        hasError = true;
    }
    if (!data.email || !data.email.includes('@')) {
        document.getElementById('emailError').textContent = 'Enter a valid email';
        hasError = true;
    }
    if (!data.password || data.password.length < 8) {
        document.getElementById('passwordError').textContent = 'Password must be at least 8 characters';
        hasError = true;
    }
    
    if (hasError) return;
    
    isLoading = true;
    btn.textContent = 'Creating...';
    btn.disabled = true;
    
    try {
        await register(data);
        showSuccess('Account created! Please sign in.');
        if (typeof renderLogin === 'function') renderLogin();
    } catch (error) {
        showError(error.message || 'Registration failed');
    } finally {
        isLoading = false;
        btn.textContent = 'Create Account';
        btn.disabled = false;
    }
}

window.renderRegister = renderRegister;

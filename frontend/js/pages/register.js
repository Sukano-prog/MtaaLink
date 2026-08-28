/* ============================================================
   MtaaLink - Premium Register Page
   ============================================================ */

import { register } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';

let isLoading = false;

export function renderRegister() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="login-wrapper">
            <div class="login-container">
                <div class="login-left">
                    <div class="brand-section">
                        <div class="brand-icon">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <rect width="48" height="48" rx="12" fill="#1A73E8"/>
                                <path d="M24 12L32 18V30L24 36L16 30V18L24 12Z" stroke="white" stroke-width="2"/>
                                <path d="M24 20V28M20 24H28" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <h1>MtaaLink</h1>
                        <p>Join the community</p>
                    </div>
                    <div class="features-list">
                        <div class="feature-item">
                            <span class="feature-dot"></span>
                            Connect with your community
                        </div>
                        <div class="feature-item">
                            <span class="feature-dot"></span>
                            Manage events and activities
                        </div>
                        <div class="feature-item">
                            <span class="feature-dot"></span>
                            Real-time communication
                        </div>
                    </div>
                </div>
                
                <div class="login-right">
                    <div class="login-form-container">
                        <div class="form-header">
                            <h2>Create Account</h2>
                            <p>Start managing your community today</p>
                        </div>
                        
                        <form id="registerForm" class="login-form">
                            <div class="form-group">
                                <label>Organization Name</label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M2 4L10 10L18 4M2 16H18V4H2V16Z" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <input type="text" id="regOrgName" class="form-control" placeholder="Your organization name" required>
                                </div>
                                <div class="error" id="orgNameError"></div>
                            </div>
                            
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
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
                                <label>Email Address</label>
                                <input type="email" id="regEmail" class="form-control" placeholder="you@example.com" required>
                                <div class="error" id="emailError"></div>
                            </div>
                            
                            <div class="form-group">
                                <label>Password</label>
                                <input type="password" id="regPassword" class="form-control" placeholder="Minimum 8 characters" required minlength="8">
                                <div class="error" id="passwordError"></div>
                            </div>
                            
                            <button type="submit" class="login-button" id="registerBtn">Create Account</button>
                        </form>
                        
                        <div class="form-footer">
                            <p>Already have an account? <a id="loginLink">Sign In</a></p>
                            <span class="footer-credit">Secure platform for Kenyan communities</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginLink').addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof renderLogin === 'function') renderLogin();
    });
    
    // Clear errors on input
    ['regOrgName', 'regFirstName', 'regLastName', 'regPhone', 'regEmail', 'regPassword'].forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            const errorId = this.id.replace('reg', '').toLowerCase() + 'Error';
            const el = document.getElementById(errorId);
            if (el) el.textContent = '';
        });
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
        document.getElementById('phoneError').textContent = 'Enter a valid phone number (0712345678)';
        hasError = true;
    }
    if (!data.email || !data.email.includes('@')) {
        document.getElementById('emailError').textContent = 'Enter a valid email address';
        hasError = true;
    }
    if (!data.password || data.password.length < 8) {
        document.getElementById('passwordError').textContent = 'Password must be at least 8 characters';
        hasError = true;
    }
    
    if (hasError) return;
    
    isLoading = true;
    btn.textContent = 'Creating Account...';
    btn.disabled = true;
    
    try {
        await register(data);
        showSuccess('Account created successfully! Please sign in.');
        if (typeof renderLogin === 'function') renderLogin();
    } catch (error) {
        showError(error.message || 'Registration failed. Please try again.');
    } finally {
        isLoading = false;
        btn.textContent = 'Create Account';
        btn.disabled = false;
    }
}

window.renderRegister = renderRegister;

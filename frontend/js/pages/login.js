/* ============================================================
   MtaaLink - Login Page
   ============================================================ */

import { login } from '../core/api.js';
import { showToast, showError } from '../components/toast.js';

let isLoading = false;

export function renderLogin() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1 id="loginVillageName">MtaaLink</h1>
                    <p>Village Management System</p>
                </div>
                
                <form id="loginForm" novalidate>
                    <div class="form-group">
                        <label for="loginEmail">Email Address</label>
                        <input 
                            type="email" 
                            id="loginEmail" 
                            class="form-control" 
                            value="admin@mtaalink.com"
                            placeholder="admin@village.com" 
                            required
                            autocomplete="email"
                            autofocus
                        >
                        <div class="form-error" id="emailError"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <div style="position:relative;">
                            <input 
                                type="password" 
                                id="loginPassword" 
                                class="form-control" 
                                value="Secure@Pass2024"
                                placeholder="Enter your password" 
                                required
                                autocomplete="current-password"
                                minlength="8"
                                style="padding-right:65px;"
                            >
                            <button type="button" id="togglePassword" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#6b7280;padding:4px 8px;border-radius:4px;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
</button>
                        </div>
                        <div class="form-error" id="passwordError"></div>
                    </div>
                    
                    <div class="form-group" style="display:flex;align-items:center;gap:8px;">
                        <input type="checkbox" id="rememberMe" checked>
                        <label for="rememberMe" style="margin:0;font-size:13px;font-weight:400;cursor:pointer;">
                            Remember me
                        </label>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block" id="loginBtn">
                        Sign In
                    </button>
                </form>
                
                <div class="auth-footer">
                    <a id="registerLink">Don't have an account? Register</a>
                    <span class="credit">Built for Kenya</span>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerLink').addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof renderRegister === 'function') {
            renderRegister();
        }
    });
    
    document.getElementById('loginEmail').addEventListener('input', function() {
        clearError('emailError');
    });
    
    document.getElementById('loginPassword').addEventListener('input', function() {
        clearError('passwordError');
    });
    
    document.getElementById('loginPassword').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('loginForm').dispatchEvent(new Event('submit'));
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    let hasError = false;
    
    if (!email) {
        showFieldError('emailError', 'Email is required');
        hasError = true;
    } else if (!email.includes('@') || !email.includes('.')) {
        showFieldError('emailError', 'Please enter a valid email address');
        hasError = true;
    }
    
    if (!password) {
        showFieldError('passwordError', 'Password is required');
        hasError = true;
    } else if (password.length < 8) {
        showFieldError('passwordError', 'Password must be at least 8 characters');
        hasError = true;
    }
    
    if (hasError) return;
    
    isLoading = true;
    const btn = document.getElementById('loginBtn');
    btn.textContent = 'Signing in...';
    btn.disabled = true;
    btn.classList.add('btn-loading');
    
    try {
        const data = await login(email, password);
        
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('village_id', data.village_id);
        localStorage.setItem('village_name', data.village_name);
        localStorage.setItem('role', data.role);
        localStorage.setItem('member_id', data.member_id);
        
        showToast('Welcome back, ' + data.village_name + '!', 'success');
        
        if (typeof renderDashboard === 'function') {
            renderDashboard();
        }
        
    } catch (error) {
        showError(error.message || 'Login failed. Please try again.');
    } finally {
        isLoading = false;
        btn.textContent = 'Sign In';
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

    // Password toggle
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('loginPassword');
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function() {
            const eyeOpen = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            const eyeClosed = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.innerHTML = eyeClosed;
            } else {
                passwordInput.type = 'password';
                toggleBtn.innerHTML = eyeOpen;
            }
        });
    }

window.renderLogin = renderLogin;
window.showLogin = renderLogin;

// Update village name after login
function updateVillageName(villageName) {
    const nameEl = document.getElementById('loginVillageName');
    if (nameEl && villageName) {
        nameEl.textContent = villageName;
    }
}

// Export for use in other pages
window.updateVillageName = updateVillageName;

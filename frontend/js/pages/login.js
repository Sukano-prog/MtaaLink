/* ============================================================
   MtaaLink - Login Page
   ============================================================ */

import { login } from '../core/api.js';
import { showToast, showError } from '../components/toast.js';

let isLoading = false;

export function renderLogin() {
    document.body.className = "auth-page";
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="auth-wrapper" style="position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920') no-repeat center center fixed;background-size:cover;">
            <div class="auth-overlay" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.3);"></div>
            <div class="auth-container" style="position:relative;z-index:1;width:100%;max-width:420px;padding:20px;">
                <div class="auth-card">
                    <div class="auth-header">
                        <h1 id="loginOrganizationName">MtaaLink</h1>
                        <p>Sign in to your account</p>
                    </div>
                    
                    <form id="loginForm" novalidate>
                        <div class="form-group">
                            <label for="loginEmail">Email Address</label>
                            <input 
                                type="email" 
                                id="loginEmail" 
                                class="form-control" 
                                placeholder="admin@mtaalink.com"
                                required
                                autocomplete="email"
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
                                    placeholder="Enter your password"
                                    required
                                    autocomplete="current-password"
                                    minlength="8"
                                    style="padding-right:65px;"
                                >
                                <button type="button" id="togglePassword" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#f3f4f6;border:1px solid #d1d5db;cursor:pointer;color:#374151;font-size:12px;padding:4px 10px;border-radius:4px;font-family:sans-serif;">Show</button>
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
                        <br>
                        <a href="/reset-password" style="color: #666; font-size: 13px; text-decoration: none; margin-top: 5px; display: inline-block;">Forgot Password?</a>
                        <span class="credit">Built for Kenya</span>
                    </div>
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
    
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('loginPassword');
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.textContent = 'Hide';
            } else {
                passwordInput.type = 'password';
                toggleBtn.textContent = 'Show';
            }
        });
    }
    
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
        localStorage.setItem('organization_id', data.village_id);
        localStorage.setItem('village_id', data.village_id);
        localStorage.setItem('organization_name', data.village_name);
        localStorage.setItem('org_name', data.village_name);
        
        // Try to load settings for organization name
        try {
            const settingsResponse = await fetch('/api/v1/settings/', {
                headers: { 'Authorization': 'Bearer ' + data.access_token }
            });
            if (settingsResponse.ok) {
                const settings = await settingsResponse.json();
                if (settings.organization_name && settings.organization_name.trim() !== '') {
                    localStorage.setItem('org_name', settings.organization_name);
                    localStorage.setItem('organization_name', settings.organization_name);
                }
            }
        } catch (e) {
            // Use village name as fallback
        }
        localStorage.setItem('org_name', data.organization_name);
        localStorage.setItem('role', data.role);
        localStorage.setItem('member_id', data.member_id);
        
        showToast('Welcome back, ' + data.organization_name + '!', 'success');
        
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

window.renderLogin = renderLogin;
window.showLogin = renderLogin;

function updateOrganizationName(organizationName) {
    const nameEl = document.getElementById('loginOrganizationName');
    if (nameEl && organizationName) {
        nameEl.textContent = organizationName;
    }
}

window.updateOrganizationName = updateOrganizationName;


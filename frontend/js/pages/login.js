/* ============================================================
   MtaaLink - Premium Login Page
   ============================================================ */

import { login } from '../core/api.js';
import { showToast, showError } from '../components/toast.js';

let isLoading = false;

export function renderLogin() {
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
                        <p>Community Management Platform</p>
                    </div>
                    <div class="features-list">
                        <div class="feature-item">
                            <span class="feature-dot"></span>
                            Secure community management
                        </div>
                        <div class="feature-item">
                            <span class="feature-dot"></span>
                            Real-time collaboration
                        </div>
                        <div class="feature-item">
                            <span class="feature-dot"></span>
                            Built for Kenyan communities
                        </div>
                    </div>
                </div>
                
                <div class="login-right">
                    <div class="login-form-container">
                        <div class="form-header">
                            <h2>Welcome Back</h2>
                            <p>Sign in to your account to continue</p>
                        </div>
                        
                        <form id="loginForm" class="login-form">
                            <div class="form-group">
                                <label>Email Address</label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M2 4L10 10L18 4M2 16H18V4H2V16Z" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <input type="email" id="loginEmail" class="form-control" placeholder="you@example.com" required>
                                </div>
                                <div class="error" id="emailError"></div>
                            </div>
                            
                            <div class="form-group">
                                <label>Password</label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M5 10H15M5 10V14M5 10V6C5 4.89543 5.89543 4 7 4H13C14.1046 4 15 4.89543 15 6V10M5 10H3M15 10H17" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
                                    </svg>
                                    <input type="password" id="loginPassword" class="form-control" placeholder="Enter your password" required>
                                    <button type="button" id="togglePassword" class="toggle-password">Show</button>
                                </div>
                                <div class="error" id="passwordError"></div>
                            </div>
                            
                            <div class="form-options">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="rememberMe" checked>
                                    <span class="checkmark"></span>
                                    Remember me
                                </label>
                                <a href="#" class="forgot-link">Forgot password?</a>
                            </div>
                            
                            <button type="submit" class="login-button" id="loginBtn">Sign In</button>
                        </form>
                        
                        <div class="form-footer">
                            <p>Don't have an account? <a id="registerLink">Create one</a></p>
                            <span class="footer-credit">Secure platform for Kenyan communities</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Event Listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerLink').addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof renderRegister === 'function') renderRegister();
    });
    
    document.getElementById('togglePassword').addEventListener('click', function() {
        const input = document.getElementById('loginPassword');
        if (input.type === 'password') {
            input.type = 'text';
            this.textContent = 'Hide';
        } else {
            input.type = 'password';
            this.textContent = 'Show';
        }
    });
    
    document.getElementById('loginEmail').addEventListener('input', function() {
        document.getElementById('emailError').textContent = '';
    });
    document.getElementById('loginPassword').addEventListener('input', function() {
        document.getElementById('passwordError').textContent = '';
    });
}

async function handleLogin(e) {
    e.preventDefault();
    if (isLoading) return;
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    
    let hasError = false;
    
    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        hasError = true;
    } else if (!email.includes('@')) {
        document.getElementById('emailError').textContent = 'Enter a valid email address';
        hasError = true;
    }
    
    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        hasError = true;
    } else if (password.length < 8) {
        document.getElementById('passwordError').textContent = 'Password must be at least 8 characters';
        hasError = true;
    }
    
    if (hasError) return;
    
    isLoading = true;
    btn.textContent = 'Signing in...';
    btn.disabled = true;
    
    try {
        const data = await login(email, password);
        
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('organization_id', data.village_id);
        localStorage.setItem('organization_name', data.village_name);
        localStorage.setItem('role', data.role);
        localStorage.setItem('member_id', data.member_id);
        
        showToast('Welcome back!', 'success');
        if (typeof renderDashboard === 'function') renderDashboard();
        
    } catch (error) {
        showError(error.message || 'Login failed. Please try again.');
    } finally {
        isLoading = false;
        btn.textContent = 'Sign In';
        btn.disabled = false;
    }
}

window.renderLogin = renderLogin;
window.showLogin = renderLogin;

/* ============================================================
   MtaaLink - Login Page
   ============================================================ */

import { login } from '../core/api.js';
import { showToast, showError } from '../components/toast.js';

let isLoading = false;

export function renderLogin() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>MtaaLink</h1>
                    <p>Sign in to your account</p>
                </div>
                
                <form id="loginForm" autocomplete="off">
                    <div class="field">
                        <label>Email</label>
                        <input type="email" id="loginEmail" placeholder="you@example.com">
                        <span class="err" id="emailError"></span>
                    </div>
                    
                    <div class="field">
                        <label>Password</label>
                        <div class="pass-wrap">
                            <input type="password" id="loginPassword" placeholder="Enter your password">
                            <button type="button" id="togglePass" class="show-btn">Show</button>
                        </div>
                        <span class="err" id="passwordError"></span>
                    </div>
                    
                    <div class="options">
                        <label class="check">
                            <input type="checkbox" id="rememberMe" checked>
                            Remember me
                        </label>
                    </div>
                    
                    <button type="submit" class="btn" id="loginBtn">Sign In</button>
                </form>
                
                <div class="auth-footer">
                    <a id="registerLink">Don't have an account? Register</a>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerLink').addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof renderRegister === 'function') renderRegister();
    });
    
    document.getElementById('togglePass').addEventListener('click', function() {
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
        document.getElementById('emailError').textContent = 'Enter a valid email';
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
        showError(error.message || 'Login failed');
    } finally {
        isLoading = false;
        btn.textContent = 'Sign In';
        btn.disabled = false;
    }
}

window.renderLogin = renderLogin;
window.showLogin = renderLogin;

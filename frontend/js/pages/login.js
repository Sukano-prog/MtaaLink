import { login } from '../core/api.js';
import { showToast, showError } from '../components/toast.js';

let isLoading = false;

export function renderLogin() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-header">
                    <span class="logo">MtaaLink</span>
                    <h2>Welcome back</h2>
                    <p>Sign in to your account</p>
                </div>
                
                <form id="loginForm">
                    <div class="field">
                        <label>Email address</label>
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
                        <a href="#" class="forgot">Forgot password?</a>
                    </div>
                    
                    <button type="submit" class="btn" id="loginBtn">Sign in</button>
                </form>
                
                <div class="auth-footer">
                    <p>Don't have an account? <a id="registerLink">Create one</a></p>
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
        this.classList.remove('error');
    });
    document.getElementById('loginPassword').addEventListener('input', function() {
        document.getElementById('passwordError').textContent = '';
        this.classList.remove('error');
    });
}

async function handleLogin(e) {
    e.preventDefault();
    if (isLoading) return;
    
    const email = document.getElementById('loginEmail');
    const password = document.getElementById('loginPassword');
    const btn = document.getElementById('loginBtn');
    
    let hasError = false;
    
    if (!email.value.trim()) {
        document.getElementById('emailError').textContent = 'Email is required';
        email.classList.add('error');
        hasError = true;
    } else if (!email.value.includes('@')) {
        document.getElementById('emailError').textContent = 'Enter a valid email';
        email.classList.add('error');
        hasError = true;
    }
    
    if (!password.value) {
        document.getElementById('passwordError').textContent = 'Password is required';
        password.classList.add('error');
        hasError = true;
    } else if (password.value.length < 8) {
        document.getElementById('passwordError').textContent = 'Minimum 8 characters';
        password.classList.add('error');
        hasError = true;
    }
    
    if (hasError) return;
    
    isLoading = true;
    btn.textContent = 'Signing in...';
    btn.disabled = true;
    
    try {
        const data = await login(email.value.trim(), password.value);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('organization_id', data.village_id);
        localStorage.setItem('organization_name', data.village_name);
        localStorage.setItem('role', data.role);
        localStorage.setItem('member_id', data.member_id);
        showToast('Welcome back!', 'success');
        if (typeof renderDashboard === 'function') renderDashboard();
    } catch (error) {
        showError(error.message || 'Login failed');
        password.classList.add('error');
    } finally {
        isLoading = false;
        btn.textContent = 'Sign in';
        btn.disabled = false;
    }
}

window.renderLogin = renderLogin;
window.showLogin = renderLogin;

import { register } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';

let isLoading = false;

export function renderRegister() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="auth-page">
            <div class="auth-card auth-register">
                <div class="auth-header">
                    <span class="logo">MtaaLink</span>
                    <h2>Create account</h2>
                    <p>Get started with your community</p>
                </div>
                
                <form id="registerForm">
                    <div class="field">
                        <label>Organization name</label>
                        <input type="text" id="regOrg" placeholder="Your organization">
                        <span class="err" id="orgError"></span>
                    </div>
                    
                    <div class="row">
                        <div class="field">
                            <label>First name</label>
                            <input type="text" id="regFirst" placeholder="First name">
                            <span class="err" id="firstError"></span>
                        </div>
                        <div class="field">
                            <label>Last name</label>
                            <input type="text" id="regLast" placeholder="Last name">
                            <span class="err" id="lastError"></span>
                        </div>
                    </div>
                    
                    <div class="field">
                        <label>Phone number</label>
                        <input type="tel" id="regPhone" placeholder="0712345678">
                        <span class="err" id="phoneError"></span>
                    </div>
                    
                    <div class="field">
                        <label>Email address</label>
                        <input type="email" id="regEmail" placeholder="you@example.com">
                        <span class="err" id="emailError"></span>
                    </div>
                    
                    <div class="field">
                        <label>Password</label>
                        <input type="password" id="regPassword" placeholder="Minimum 8 characters">
                        <span class="err" id="passwordError"></span>
                    </div>
                    
                    <button type="submit" class="btn" id="registerBtn">Create account</button>
                </form>
                
                <div class="auth-footer">
                    <p>Already have an account? <a id="loginLink">Sign in</a></p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginLink').addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof renderLogin === 'function') renderLogin();
    });
    
    ['regOrg', 'regFirst', 'regLast', 'regPhone', 'regEmail', 'regPassword'].forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            const errId = this.id.replace('reg', '').toLowerCase() + 'Error';
            const errEl = document.getElementById(errId);
            if (errEl) errEl.textContent = '';
            this.classList.remove('error');
        });
    });
}

async function handleRegister(e) {
    e.preventDefault();
    if (isLoading) return;
    
    const data = {
        organization_name: document.getElementById('regOrg').value.trim(),
        first_name: document.getElementById('regFirst').value.trim(),
        last_name: document.getElementById('regLast').value.trim(),
        phone: document.getElementById('regPhone').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value
    };
    
    const btn = document.getElementById('registerBtn');
    let hasError = false;
    
    if (!data.organization_name || data.organization_name.length < 2) {
        document.getElementById('orgError').textContent = 'Organization name is required';
        document.getElementById('regOrg').classList.add('error');
        hasError = true;
    }
    if (!data.first_name || data.first_name.length < 2) {
        document.getElementById('firstError').textContent = 'First name is required';
        document.getElementById('regFirst').classList.add('error');
        hasError = true;
    }
    if (!data.last_name || data.last_name.length < 2) {
        document.getElementById('lastError').textContent = 'Last name is required';
        document.getElementById('regLast').classList.add('error');
        hasError = true;
    }
    if (!data.phone || !/^0[17]\d{8}$/.test(data.phone)) {
        document.getElementById('phoneError').textContent = 'Enter a valid phone (0712345678)';
        document.getElementById('regPhone').classList.add('error');
        hasError = true;
    }
    if (!data.email || !data.email.includes('@')) {
        document.getElementById('emailError').textContent = 'Enter a valid email';
        document.getElementById('regEmail').classList.add('error');
        hasError = true;
    }
    if (!data.password || data.password.length < 8) {
        document.getElementById('passwordError').textContent = 'Minimum 8 characters';
        document.getElementById('regPassword').classList.add('error');
        hasError = true;
    }
    
    if (hasError) return;
    
    isLoading = true;
    btn.textContent = 'Creating account...';
    btn.disabled = true;
    
    try {
        await register(data);
        showSuccess('Account created!');
        if (typeof renderLogin === 'function') renderLogin();
    } catch (error) {
        showError(error.message || 'Registration failed');
    } finally {
        isLoading = false;
        btn.textContent = 'Create account';
        btn.disabled = false;
    }
}

window.renderRegister = renderRegister;

import { verifyEmail } from '../core/api.js';

export async function renderVerification() {
    const app = document.getElementById('app');
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    app.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px;">
            <div class="auth-card" style="background:white;padding:40px;border-radius:20px;max-width:500px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div id="verificationStatus">
                    <p>Verifying your email...</p>
                </div>
            </div>
        </div>
    `;

    if (!token || !email) {
        document.getElementById('verificationStatus').innerHTML = `
            <h2 style="color:#e74c3c;">Invalid Verification Link</h2>
            <p>The verification link is missing required parameters.</p>
            <a href="/login" class="btn" style="display:inline-block;margin-top:20px;padding:10px 30px;background:#667eea;color:white;text-decoration:none;border-radius:8px;">Go to Login</a>
        `;
        return;
    }

    try {
        const result = await verifyEmail(token, email);
        if (result && result.message) {
            document.getElementById('verificationStatus').innerHTML = `
                <div style="font-size:60px;margin-bottom:20px;">✅</div>
                <h2 style="color:#27ae60;">${result.message}</h2>
                <p style="color:#666;margin-top:10px;">You can now log in to your account.</p>
                <a href="/login?verified=true" class="btn" style="display:inline-block;margin-top:20px;padding:10px 30px;background:#667eea;color:white;text-decoration:none;border-radius:8px;">Go to Login</a>
            `;
        } else {
            throw new Error('Verification failed');
        }
    } catch (error) {
        document.getElementById('verificationStatus').innerHTML = `
            <div style="font-size:60px;margin-bottom:20px;">❌</div>
            <h2 style="color:#e74c3c;">Verification Failed</h2>
            <p style="color:#666;margin-top:10px;">${error.message || 'The verification link is invalid or expired.'}</p>
            <a href="/login" class="btn" style="display:inline-block;margin-top:20px;padding:10px 30px;background:#667eea;color:white;text-decoration:none;border-radius:8px;">Go to Login</a>
        `;
    }
}

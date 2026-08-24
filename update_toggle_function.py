import re

with open('/home/laki/MtaaLink/frontend/js/pages/login.js', 'r') as f:
    content = f.read()

# Update the toggle function to handle SVG
old_func = '''    // Password toggle
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('loginPassword');
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function() {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.textContent = 'Hide';
            } else {
                passwordInput.type = 'password';
                toggleBtn.textContent = 'Show';
            }
        });
    }'''

new_func = '''    // Password toggle
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
    }'''

if old_func in content:
    content = content.replace(old_func, new_func)
    with open('/home/laki/MtaaLink/frontend/js/pages/login.js', 'w') as f:
        f.write(content)
    print("✅ Updated toggle function for SVG")
else:
    print("❌ Pattern not found")

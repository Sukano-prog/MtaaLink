import re

with open('/home/laki/MtaaLink/frontend/js/pages/login.js', 'r') as f:
    content = f.read()

# Use SVG eye icon
old_button = '''<button type="button" id="togglePassword" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:1px solid #d1d5db;cursor:pointer;color:#6b7280;font-size:12px;padding:4px 10px;border-radius:4px;">Show</button>'''

new_button = '''<button type="button" id="togglePassword" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#6b7280;padding:4px 8px;border-radius:4px;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
</button>'''

if old_button in content:
    content = content.replace(old_button, new_button)
    with open('/home/laki/MtaaLink/frontend/js/pages/login.js', 'w') as f:
        f.write(content)
    print("✅ Updated to SVG eye icon")
else:
    print("❌ Pattern not found")

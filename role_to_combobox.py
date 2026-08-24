import re

with open('/home/laki/MtaaLink/frontend/js/pages/members.js', 'r') as f:
    content = f.read()

# Replace select with combobox for role field
old = '''        type: 'select','''
new = '''        type: 'combobox','''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/members.js', 'w') as f:
        f.write(content)
    print("✅ Role field changed to combobox (dropdown + text input)")
else:
    print("❌ Pattern not found")

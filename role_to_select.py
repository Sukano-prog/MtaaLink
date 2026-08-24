import re

with open('/home/laki/MtaaLink/frontend/js/pages/members.js', 'r') as f:
    content = f.read()

# Replace combobox with select for role field
old = '''        type: 'combobox','''
new = '''        type: 'select','''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/members.js', 'w') as f:
        f.write(content)
    print("✅ Role field changed to select dropdown")
else:
    print("❌ Pattern not found")

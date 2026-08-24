import re

with open('/home/laki/MtaaLink/frontend/js/pages/members.js', 'r') as f:
    content = f.read()

# Find and replace the role field with combobox
old = '''    fields.push({
        id: 'mfRole',
        label: 'Role',
        type: 'select',
        value: member?.role || 'member',
        required: false,
        options: [
            { value: 'member', label: 'Member' },
            { value: 'elder', label: 'Elder' },
            { value: 'secretary', label: 'Secretary' },
            { value: 'treasurer', label: 'Treasurer' },
            { value: 'chairperson', label: 'Chairperson' },
            { value: 'youth', label: 'Youth' },
            { value: 'women', label: 'Women' }
        ]
    });'''

new = '''    fields.push({
        id: 'mfRole',
        label: 'Role',
        type: 'combobox',
        value: member?.role || 'member',
        required: false,
        placeholder: 'Select or type a role...',
        options: [
            { value: 'member', label: 'Member' },
            { value: 'elder', label: 'Elder' },
            { value: 'secretary', label: 'Secretary' },
            { value: 'treasurer', label: 'Treasurer' },
            { value: 'chairperson', label: 'Chairperson' },
            { value: 'vice_chairperson', label: 'Vice Chairperson' },
            { value: 'youth_rep', label: 'Youth Representative' },
            { value: 'women_rep', label: 'Women Representative' }
        ],
        helper: 'Select from the list or type any custom role'
    });'''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/members.js', 'w') as f:
        f.write(content)
    print("✅ Role field changed to combobox")
else:
    print("❌ Pattern not found - checking alternative")
    # Try with text input
    old2 = '''    fields.push({
        id: 'mfRole',
        label: 'Role',
        type: 'text',
        value: member?.role || 'member',
        required: false,
        placeholder: 'e.g., member, elder, secretary, or any custom role'
    });'''
    if old2 in content:
        content = content.replace(old2, new)
        with open('/home/laki/MtaaLink/frontend/js/pages/members.js', 'w') as f:
            f.write(content)
        print("✅ Role field changed to combobox (alternative)")
    else:
        print("❌ Pattern not found - manual check needed")

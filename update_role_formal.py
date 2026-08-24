import re

with open('/home/laki/MtaaLink/frontend/js/pages/members.js', 'r') as f:
    content = f.read()

# Find the role field and update with formal roles only
old_role = '''        id: 'mfRole',
        label: 'Role (type or select)',
        type: 'combobox',
        value: member?.role || 'member',
        required: false,
        placeholder: 'e.g., member, elder, secretary, or custom role',
        options: [
            { value: 'member', label: 'Member' },
            { value: 'elder', label: 'Elder' },
            { value: 'secretary', label: 'Secretary' },
            { value: 'treasurer', label: 'Treasurer' },
            { value: 'chairperson', label: 'Chairperson' },
            { value: 'youth', label: 'Youth' },
            { value: 'women', label: 'Women' },
            { value: 'village_elder', label: 'Village Elder' },
            { value: 'community_leader', label: 'Community Leader' },
            { value: 'health_worker', label: 'Health Worker' },
            { value: 'teacher', label: 'Teacher' },
            { value: 'farmer_rep', label: 'Farmer Representative' },
            { value: 'youth_leader', label: 'Youth Leader' },
            { value: 'women_leader', label: 'Women Leader' },
            { value: 'admin', label: 'Admin' },
            { value: 'super_admin', label: 'Super Admin' }
        ],
        helper: 'Select from the list or type any custom role' '''

new_role = '''        id: 'mfRole',
        label: 'Role',
        type: 'combobox',
        value: member?.role || 'member',
        required: false,
        placeholder: 'e.g., member, elder, secretary',
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
        helper: 'Select from the list or type any custom role' '''

if old_role in content:
    content = content.replace(old_role, new_role)
    with open('/home/laki/MtaaLink/frontend/js/pages/members.js', 'w') as f:
        f.write(content)
    print("✅ Role field updated with formal roles")
else:
    print("❌ Pattern not found")

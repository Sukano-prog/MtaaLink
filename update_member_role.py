import re

with open('/home/laki/MtaaLink/frontend/js/pages/members.js', 'r') as f:
    content = f.read()

# Replace the role field type and add Other option
old = '''        type: 'select',
        value: member?.role || 'member',
        required: false,
        options: [
            { value: 'member', label: 'Member' },
            { value: 'elder', label: 'Elder' },
            { value: 'secretary', label: 'Secretary' },
            { value: 'treasurer', label: 'Treasurer' },
            { value: 'chairperson', label: 'Chairperson' },
            { value: 'vice_chairperson', label: 'Vice Chairperson' },
            { value: 'youth_rep', label: 'Youth Representative' },
            { value: 'women_rep', label: 'Women Representative' },
            { value: 'elder_rep', label: 'Elder Representative' },
            { value: 'community_elder', label: 'Community Elder' },
            { value: 'village_admin', label: 'Village Administrator' },
            { value: 'clerk', label: 'Clerk' },
            { value: 'messenger', label: 'Messenger' },
            { value: 'security_rep', label: 'Security Representative' },
            { value: 'health_rep', label: 'Health Representative' },
            { value: 'education_rep', label: 'Education Representative' },
            { value: 'agriculture_rep', label: 'Agriculture Representative' },
            { value: 'youth_leader', label: 'Youth Leader' },
            { value: 'women_leader', label: 'Women Leader' }
        ],
        helper: 'Select a role or choose "Other" to type a custom one'''

new = '''        type: 'select_with_other',
        value: member?.role || 'member',
        required: false,
        options: [
            { value: 'member', label: 'Member' },
            { value: 'elder', label: 'Elder' },
            { value: 'secretary', label: 'Secretary' },
            { value: 'treasurer', label: 'Treasurer' },
            { value: 'chairperson', label: 'Chairperson' },
            { value: 'vice_chairperson', label: 'Vice Chairperson' },
            { value: 'youth_rep', label: 'Youth Representative' },
            { value: 'women_rep', label: 'Women Representative' },
            { value: 'elder_rep', label: 'Elder Representative' },
            { value: 'community_elder', label: 'Community Elder' },
            { value: 'village_admin', label: 'Village Administrator' },
            { value: 'clerk', label: 'Clerk' },
            { value: 'messenger', label: 'Messenger' },
            { value: 'security_rep', label: 'Security Representative' },
            { value: 'health_rep', label: 'Health Representative' },
            { value: 'education_rep', label: 'Education Representative' },
            { value: 'agriculture_rep', label: 'Agriculture Representative' },
            { value: 'youth_leader', label: 'Youth Leader' },
            { value: 'women_leader', label: 'Women Leader' },
            { value: 'other', label: 'Other (type custom role)' }
        ],
        helper: 'Select a role or choose "Other" to type a custom one'''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/members.js', 'w') as f:
        f.write(content)
    print("✅ Member role field updated to select_with_other")
else:
    print("❌ Pattern not found")

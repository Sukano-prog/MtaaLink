import re

with open('/home/laki/MtaaLink/frontend/js/pages/elections.js', 'r') as f:
    content = f.read()

# Find and replace election type options
old = '''        {
            id: 'election_type',
            label: 'Election Type',
            type: 'select',
            value: election?.election_type || 'general',
            required: true,
            options: ELECTION_TYPES
        }'''

new = '''        {
            id: 'election_type',
            label: 'Election Type',
            type: 'select_with_other',
            value: election?.election_type || 'general',
            required: true,
            options: [
                { value: 'village_elders', label: 'Village Elders' },
                { value: 'chairperson', label: 'Chairperson' },
                { value: 'secretary', label: 'Secretary' },
                { value: 'treasurer', label: 'Treasurer' },
                { value: 'committee', label: 'Committee' },
                { value: 'general', label: 'General Election' },
                { value: 'custom', label: 'Custom Election' },
                { value: 'other', label: 'Other (type custom)' }
            ],
            helper: 'Select an election type or choose "Other" to type a custom one'
        }'''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/elections.js', 'w') as f:
        f.write(content)
    print("✅ Election type updated")
else:
    print("❌ Pattern not found")

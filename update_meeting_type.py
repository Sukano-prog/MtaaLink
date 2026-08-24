import re

with open('/home/laki/MtaaLink/frontend/js/pages/meetings.js', 'r') as f:
    content = f.read()

# Find and replace meeting type options
old = '''        {
            id: 'meeting_type',
            label: 'Meeting Type',
            type: 'select',
            value: meeting?.meeting_type || 'general',
            required: true,
            options: MEETING_TYPES
        }'''

new = '''        {
            id: 'meeting_type',
            label: 'Meeting Type',
            type: 'select_with_other',
            value: meeting?.meeting_type || 'general',
            required: true,
            options: [
                { value: 'general', label: 'General Meeting' },
                { value: 'baraza', label: 'Baraza (Village Assembly)' },
                { value: 'committee', label: 'Committee Meeting' },
                { value: 'emergency', label: 'Emergency Meeting' },
                { value: 'election', label: 'Election Meeting' },
                { value: 'planning', label: 'Planning Meeting' },
                { value: 'special', label: 'Special Meeting' },
                { value: 'annual_general', label: 'Annual General Meeting' },
                { value: 'other', label: 'Other (type custom)' }
            ],
            helper: 'Select a meeting type or choose "Other" to type a custom one'
        }'''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/meetings.js', 'w') as f:
        f.write(content)
    print("✅ Meeting type updated")
else:
    print("❌ Pattern not found")

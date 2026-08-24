import re

with open('/home/laki/MtaaLink/frontend/js/pages/events.js', 'r') as f:
    content = f.read()

# Find and replace event type options
old = '''                type: 'select',
                value: event?.event_type || '',
                required: true,
                options: [
                    { value: 'workshop', label: 'Workshop' },
                    { value: 'seminar', label: 'Seminar' },
                    { value: 'fundraising', label: 'Fundraising' },
                    { value: 'cultural', label: 'Cultural' },
                    { value: 'sports', label: 'Sports' },
                    { value: 'meeting', label: 'Meeting' },
                    { value: 'training', label: 'Training' },
                    { value: 'celebration', label: 'Celebration' }
                ]'''

new = '''                type: 'select_with_other',
                value: event?.event_type || '',
                required: true,
                options: [
                    { value: 'workshop', label: 'Workshop' },
                    { value: 'seminar', label: 'Seminar' },
                    { value: 'fundraising', label: 'Fundraising' },
                    { value: 'cultural', label: 'Cultural' },
                    { value: 'sports', label: 'Sports' },
                    { value: 'meeting', label: 'Meeting' },
                    { value: 'training', label: 'Training' },
                    { value: 'celebration', label: 'Celebration' },
                    { value: 'other', label: 'Other (type custom)' }
                ],
                helper: 'Select an event type or choose "Other" to type a custom one' '''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/events.js', 'w') as f:
        f.write(content)
    print("✅ Event type updated")
else:
    print("❌ Pattern not found")

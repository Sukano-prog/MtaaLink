import re

with open('/home/laki/MtaaLink/frontend/js/pages/announcements.js', 'r') as f:
    content = f.read()

# Find and replace sent_via options
old = '''            {
                id: 'sent_via',
                label: 'Send Via',
                type: 'select',
                value: announcement?.sent_via || 'sms',
                options: [
                    { value: 'sms', label: 'SMS' },
                    { value: 'whatsapp', label: 'WhatsApp' },
                    { value: 'both', label: 'Both SMS and WhatsApp' }
                ]
            }'''

new = '''            {
                id: 'sent_via',
                label: 'Send Via',
                type: 'select_with_other',
                value: announcement?.sent_via || 'sms',
                options: [
                    { value: 'sms', label: 'SMS' },
                    { value: 'whatsapp', label: 'WhatsApp' },
                    { value: 'both', label: 'Both SMS and WhatsApp' },
                    { value: 'other', label: 'Other (type custom)' }
                ],
                helper: 'Select a sending method or choose "Other" to type a custom one'
            }'''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/announcements.js', 'w') as f:
        f.write(content)
    print("✅ Announcement sent_via updated")
else:
    print("❌ Pattern not found")

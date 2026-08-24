import re

with open('/home/laki/MtaaLink/app/api/v1/announcements.py', 'r') as f:
    content = f.read()

# Add village name to announcement SMS
old = 'result = SMSService.send_sms('
new = 'result = SMSService.send_sms('

if old in content:
    # Add village_id to the send_sms call
    content = content.replace(
        'SMSService.send_sms(\n                    member.phone,\n                    f"MtaaLink: {announcement.title}\\n\\n{announcement.message}"',
        'SMSService.send_sms(\n                    member.phone,\n                    f"{village_name}: {announcement.title}\\n\\n{announcement.message}"'
    )
    with open('/home/laki/MtaaLink/app/api/v1/announcements.py', 'w') as f:
        f.write(content)
    print("✅ Announcement SMS updated with village name")
else:
    print("❌ Pattern not found")

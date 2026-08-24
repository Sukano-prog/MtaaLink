import re

with open('/home/laki/MtaaLink/app/api/v1/announcements.py', 'r') as f:
    content = f.read()

# Find the send_announcement function and update it to support both SMS and WhatsApp
old = '''        for member in members:
            if member.phone:
                result = SMSService.send_sms(
                    member.phone,
                    f"MtaaLink: {announcement.title}\\n\\n{announcement.message}"
                )
                if result.get('success'):
                    sent_count += 1
                else:
                    failed_count += 1'''

new = '''        for member in members:
            if member.phone:
                # Send based on sent_via
                if announcement.sent_via == 'whatsapp':
                    result = WhatsAppService.send_announcement(
                        member.phone,
                        announcement.title,
                        announcement.message
                    )
                elif announcement.sent_via == 'both':
                    # Send both SMS and WhatsApp
                    result_sms = SMSService.send_sms(
                        member.phone,
                        f"MtaaLink: {announcement.title}\\n\\n{announcement.message}"
                    )
                    result_whatsapp = WhatsAppService.send_announcement(
                        member.phone,
                        announcement.title,
                        announcement.message
                    )
                    result = result_sms if result_sms.get('success') else result_whatsapp
                else:
                    # Default to SMS
                    result = SMSService.send_sms(
                        member.phone,
                        f"MtaaLink: {announcement.title}\\n\\n{announcement.message}"
                    )
                
                if result.get('success'):
                    sent_count += 1
                else:
                    failed_count += 1'''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/app/api/v1/announcements.py', 'w') as f:
        f.write(content)
    print("✅ Announcement WhatsApp support added")
else:
    print("❌ Pattern not found - manual check needed")

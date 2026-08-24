import re

with open('/home/laki/MtaaLink/frontend/js/pages/meeting_detail.js', 'r') as f:
    content = f.read()

# Add village name to meeting report header
old = '<h3 style="margin:0;">${meeting.title}</h3>'
new = '<h3 style="margin:0;">${localStorage.getItem("village_name") || "Village"} - ${meeting.title}</h3>'

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/meeting_detail.js', 'w') as f:
        f.write(content)
    print("✅ Meeting detail updated with village name")
else:
    print("❌ Pattern not found")

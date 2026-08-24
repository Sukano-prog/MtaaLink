import re

with open('/home/laki/MtaaLink/frontend/js/pages/elections.js', 'r') as f:
    content = f.read()

# Find the localStorage line and add debug before it
old = "localStorage.setItem('voted_' + election.id, 'true');"
new = """                                    console.log('DEBUG - election object:', election);
                                    console.log('DEBUG - election.id:', election ? election.id : 'UNDEFINED');
                                    localStorage.setItem('voted_' + election.id, 'true');"""

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/elections.js', 'w') as f:
        f.write(content)
    print("✅ Debug lines added")
else:
    print("❌ Pattern not found")

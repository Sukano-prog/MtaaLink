import re

with open('/home/laki/MtaaLink/frontend/js/pages/elections.js', 'r') as f:
    content = f.read()

# Find the castVote success block
old = '''                                    setTimeout(function() {
                                        loadElections();
                                    }, 1000);'''

new = '''                                    setTimeout(function() {
                                        closeModal();
                                        loadElections();
                                    }, 1500);'''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/elections.js', 'w') as f:
        f.write(content)
    print("✅ Fix applied - modal will close after voting")
else:
    print("Pattern not found, looking for alternative...")
    # Try with different spacing
    old2 = '''                                    setTimeout(function() {
                                        loadElections();
                                    }, 1000);'''
    if old2 in content:
        content = content.replace(old2, new)
        with open('/home/laki/MtaaLink/frontend/js/pages/elections.js', 'w') as f:
            f.write(content)
        print("✅ Fix applied (alternative pattern)")
    else:
        print("❌ Pattern not found - manual edit needed")
        print("Look for 'setTimeout' around the castVote section")

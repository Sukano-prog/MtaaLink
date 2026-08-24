import re

with open('/home/laki/MtaaLink/frontend/js/pages/elections.js', 'r') as f:
    content = f.read()

# 1. Add localStorage flag when vote is cast
old_vote = '''                                    setTimeout(function() {
                                        closeModal();
                                        loadElections();
                                    }, 1500);'''

new_vote = '''                                    // Store that this user voted in this election
                                    localStorage.setItem('voted_' + election.id, 'true');
                                    setTimeout(function() {
                                        closeModal();
                                        loadElections();
                                    }, 1500);'''

if old_vote in content:
    content = content.replace(old_vote, new_vote)
    print("✅ Added localStorage flag after voting")
else:
    print("⚠️ Pattern not found for vote flag")

# 2. Modify the renderElectionsList to check localStorage and disable Vote button
# Find the Vote button rendering
old_button = '''                            <button class="btn btn-sm btn-primary voter-portal" data-id="${e.id}">Vote</button>'''

new_button = '''                            ${localStorage.getItem('voted_' + e.id) === 'true' ? 
                                `<button class="btn btn-sm btn-secondary" disabled style="opacity:0.6;cursor:not-allowed;">Voted</button>` :
                                `<button class="btn btn-sm btn-primary voter-portal" data-id="${e.id}">Vote</button>`
                            }'''

if old_button in content:
    content = content.replace(old_button, new_button)
    print("✅ Added Vote button disabled check")
else:
    print("⚠️ Pattern not found for Vote button")
    # Try alternative pattern
    old_button2 = '                            <button class="btn btn-sm btn-primary voter-portal" data-id="${e.id}">Vote</button>'
    if old_button2 in content:
        content = content.replace(old_button2, new_button)
        print("✅ Added Vote button disabled check (alternative)")

# Write the file
with open('/home/laki/MtaaLink/frontend/js/pages/elections.js', 'w') as f:
    f.write(content)

print("✅ Fix applied - Vote button will be disabled after voting")

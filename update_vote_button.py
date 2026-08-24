import re

with open('/home/laki/MtaaLink/frontend/js/pages/elections.js', 'r') as f:
    content = f.read()

# Find the verifyVoterCode section and update it
old_verify = '''                verifyVoterCode(election.id, code)
                    .then(function(result) {
                        if (result.valid) {
                            verifiedCode = code;
                            showStatus('Valid voter code! Select your candidate below.', 'success');
                            loadCandidates(code);
                        } else {
                            showStatus(result.message || 'Invalid voter code', 'error');
                        }
                    })'''

new_verify = '''                verifyVoterCode(election.id, code)
                    .then(function(result) {
                        if (result.valid) {
                            verifiedCode = code;
                            showStatus('Valid voter code! Select your candidate below.', 'success');
                            loadCandidates(code);
                        } else {
                            // Check if the code was already used
                            if (result.message && result.message.includes('already been used')) {
                                showStatus('This voter code has already been used. You cannot vote again.', 'error');
                                // Permanently disable the voting UI
                                voterCodeInput.disabled = true;
                                verifyBtn.disabled = true;
                                castVoteBtn.style.display = 'none';
                                candidatesContainer.style.display = 'none';
                            } else {
                                showStatus(result.message || 'Invalid voter code', 'error');
                            }
                        }
                    })'''

if old_verify in content:
    content = content.replace(old_verify, new_verify)
    with open('/home/laki/MtaaLink/frontend/js/pages/elections.js', 'w') as f:
        f.write(content)
    print("✅ Fix applied successfully!")
else:
    print("❌ Pattern not found - trying alternative match...")
    # Try a more flexible match
    pattern = r'verifyVoterCode\(election\.id, code\)\s*\.then\(function\(result\)\s*\{\s*if \(result\.valid\)\s*\{\s*verifiedCode = code;\s*showStatus\([^)]+\);\s*loadCandidates\(code\);\s*\}\s*else\s*\{\s*showStatus\(result\.message \|\| [^)]+\);\s*\}\s*\}\)'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        print("Found match, but manual fix needed due to complexity")
        print("Please manually edit the file")
    else:
        print("No match found")

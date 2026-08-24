import re

with open('/home/laki/MtaaLink/frontend/js/pages/projects.js', 'r') as f:
    content = f.read()

# Find the task rendering and add a complete button
old_task = '''                    return `
                        <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid var(--gray-100);font-size:var(--font-size-sm);">
                            <span style="color:${taskColor};font-size:12px;">${t.status === 'completed' ? '' : t.status === 'in_progress' ? '' : ''}</span>
                            <span>${t.title}</span>
                            <span style="font-size:var(--font-size-xs);color:var(--gray-400);margin-left:auto;">${t.status || 'pending'}</span>
                        </div>
                    `;'''

new_task = '''                    return `
                        <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid var(--gray-100);font-size:var(--font-size-sm);">
                            <span style="color:${taskColor};font-size:12px;">${t.status === 'completed' ? '✓' : t.status === 'in_progress' ? '⟳' : '○'}</span>
                            <span style="flex:1;">${t.title}</span>
                            <span style="font-size:var(--font-size-xs);color:var(--gray-400);">${t.status || 'pending'}</span>
                            ${t.status !== 'completed' ? `<button class="btn btn-sm btn-success complete-task-btn" data-project-id="${projectId}" data-task-id="${t.id}" style="font-size:10px;padding:2px 8px;">Complete</button>` : ''}
                        </div>
                    `;'''

if old_task in content:
    content = content.replace(old_task, new_task)
    with open('/home/laki/MtaaLink/frontend/js/pages/projects.js', 'w') as f:
        f.write(content)
    print("✅ Added complete task button")
else:
    print("❌ Pattern not found - checking alternative")
    # Try a different pattern
    old_task2 = '''return `
                        <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid var(--gray-100);font-size:var(--font-size-sm);">
                            <span style="color:${taskColor};font-size:12px;">${t.status === 'completed' ? '' : t.status === 'in_progress' ? '' : ''}</span>
                            <span>${t.title}</span>
                            <span style="font-size:var(--font-size-xs);color:var(--gray-400);margin-left:auto;">${t.status || 'pending'}</span>
                        </div>
                    `'''
    if old_task2 in content:
        content = content.replace(old_task2, '''return `
                        <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid var(--gray-100);font-size:var(--font-size-sm);">
                            <span style="color:${taskColor};font-size:12px;">${t.status === 'completed' ? '✓' : t.status === 'in_progress' ? '⟳' : '○'}</span>
                            <span style="flex:1;">${t.title}</span>
                            <span style="font-size:var(--font-size-xs);color:var(--gray-400);">${t.status || 'pending'}</span>
                            ${t.status !== 'completed' ? `<button class="btn btn-sm btn-success complete-task-btn" data-project-id="${projectId}" data-task-id="${t.id}" style="font-size:10px;padding:2px 8px;">Complete</button>` : ''}
                        </div>
                    `''')
        with open('/home/laki/MtaaLink/frontend/js/pages/projects.js', 'w') as f:
            f.write(content)
        print("✅ Added complete task button (alternative)")
    else:
        print("❌ Pattern not found")

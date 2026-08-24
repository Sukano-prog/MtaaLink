import re

with open('/home/laki/MtaaLink/frontend/js/pages/projects.js', 'r') as f:
    content = f.read()

# Find and replace the task rendering
old = '''                const tasksHtml = (m.tasks || []).map(function(t) {
                    const taskColor = t.status === 'completed' ? 'var(--success)' : t.status === 'in_progress' ? 'var(--warning)' : 'var(--gray)';
                    return `
                        <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid var(--gray-100);font-size:var(--font-size-sm);">
                            <span style="color:${taskColor};font-size:12px;">${t.status === 'completed' ? '✅' : t.status === 'in_progress' ? '⏳' : '⬜'}</span>
                            <span>${t.title}</span>
                            <span style="font-size:var(--font-size-xs);color:var(--gray-400);margin-left:auto;">${t.status || 'pending'}</span>
                        </div>
                    `;
                }).join('');'''

new = '''                const tasksHtml = (m.tasks || []).map(function(t) {
                    const taskColor = t.status === 'completed' ? 'var(--success)' : t.status === 'in_progress' ? 'var(--warning)' : 'var(--gray)';
                    const statusText = t.status || 'pending';
                    return `
                        <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid var(--gray-100);font-size:var(--font-size-sm);">
                            <span style="flex:1;">${t.title}</span>
                            <span class="badge badge-${t.status === 'completed' ? 'success' : 'gray'}">${statusText}</span>
                            ${t.status !== 'completed' ? `<button class="btn btn-sm btn-success complete-task-btn" data-project-id="${project.id}" data-task-id="${t.id}" style="font-size:10px;padding:2px 10px;">Complete</button>` : ''}
                        </div>
                    `;
                }).join('');'''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/projects.js', 'w') as f:
        f.write(content)
    print("✅ Tasks updated - no emojis, with Complete button")
else:
    print("❌ Pattern not found")

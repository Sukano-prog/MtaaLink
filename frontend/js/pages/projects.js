/* ============================================================
   Management System - Projects Page
   ============================================================ */

import { getProjects, getProject, createProject, updateProject, deleteProject, getMembers, getMeetings } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showFormModal, showConfirm, showModal } from '../components/modal.js';

let projectsData = [];
let membersData = [];
let meetingsData = [];
let currentProjectId = null;

export async function renderProjects() {
    const content = document.getElementById('pageContent');
    
    try {
        membersData = await getMembers().catch(() => []);
        meetingsData = await getMeetings().catch(() => []);
        
        content.innerHTML = `
            <div class="page-header">
                <h2>Projects</h2>
                <button class="btn btn-primary" id="addProjectBtn">Create Project</button>
            </div>
            <div class="filter-bar">
                <div class="filter-box">
                    <select id="statusFilter" class="form-control form-select">
                        <option value="">All Status</option>
                        <option value="planning">Planning</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <span class="project-count" id="projectCount">0 projects</span>
            </div>
            <div id="projectsContainer">
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading projects...</p>
                </div>
            </div>
        `;
        
        document.getElementById('addProjectBtn').addEventListener('click', function() {
            openProjectModal();
        });
        
        document.getElementById('statusFilter').addEventListener('change', function() {
            filterProjects();
        });
        
        await loadProjects();
        
    } catch (error) {
        content.innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load projects: ${error.message}</p>
                <button class="btn btn-primary" onclick="renderProjects()">Retry</button>
            </div></div>
        `;
    }
}

async function loadProjects() {
    try {
        projectsData = await getProjects();
        renderProjectsList();
        document.getElementById('projectCount').textContent = projectsData.length + ' projects';
    } catch (error) {
        document.getElementById('projectsContainer').innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load projects: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadProjects()">Retry</button>
            </div></div>
        `;
    }
}

function filterProjects() {
    const status = document.getElementById('statusFilter').value;
    let filtered = projectsData;
    if (status) {
        filtered = filtered.filter(function(p) {
            return p.status === status;
        });
    }
    renderProjectsList(filtered);
    document.getElementById('projectCount').textContent = filtered.length + ' projects';
}

function renderProjectsList(filtered = null) {
    const container = document.getElementById('projectsContainer');
    const projects = filtered !== null ? filtered : projectsData;
    
    if (projects.length === 0) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <div class="empty-state">
                    <p class="text-muted">No projects found</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addProjectBtn').click()">
                        Create your first project
                    </button>
                </div>
            </div></div>
        `;
        return;
    }
    
    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;">';
    
    projects.forEach(function(p) {
        const statusBadge = p.status === 'completed' ? 'badge-success' : 
                           p.status === 'ongoing' ? 'badge-warning' : 
                           p.status === 'planning' ? 'badge-info' : 'badge-gray';
        const progress = p.progress || 0;
        const progressColor = progress >= 100 ? 'var(--success)' : 
                             progress >= 50 ? 'var(--primary)' : 
                             progress >= 25 ? 'var(--warning)' : 'var(--danger)';
        const canComplete = p.status !== 'completed';
        
        html += `
            <div class="card">
                <div class="card-body">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div>
                            <h4 style="margin:0;">${p.title}</h4>
                            <span style="font-size:var(--font-size-xs);color:var(--gray-400);">
                                ${p.milestone_count || 0} milestones · ${p.task_count || 0} tasks
                            </span>
                        </div>
                        <span class="badge ${statusBadge}">${p.status || 'planning'}</span>
                    </div>
                    <div style="font-size:var(--font-size-sm);color:var(--gray-500);margin-top:6px;">
                        ${p.description || 'No description'}
                    </div>
                    <div style="margin-top:8px;">
                        <div style="display:flex;justify-content:space-between;font-size:var(--font-size-xs);color:var(--gray-500);">
                            <span>Budget: KES ${(p.budget || 0).toLocaleString()}</span>
                            <span>Spent: KES ${(p.amount_spent || 0).toLocaleString()}</span>
                        </div>
                        <div style="background:var(--gray-200);border-radius:4px;height:8px;margin-top:4px;overflow:hidden;position:relative;">
                            <div style="background:${progressColor};height:100%;width:${progress}%;border-radius:4px;transition:width 0.5s ease;"></div>
                            <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:10px;font-weight:600;color:${progress > 50 ? 'white' : 'var(--gray-700)'};">${progress}%</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;font-size:var(--font-size-xs);color:var(--gray-500);margin-top:2px;">
                            <span>${p.completed_milestones || 0}/${p.milestone_count || 0} milestones</span>
                            <span>${p.completed_tasks || 0}/${p.task_count || 0} tasks done</span>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary view-project" data-id="${p.id}">View Details</button>
                        <button class="btn btn-sm btn-outline edit-project" data-id="${p.id}">Edit</button>
                        <button class="btn btn-sm btn-info manage-milestones" data-id="${p.id}">Milestones</button>
                        ${canComplete ? `<button class="btn btn-sm btn-success complete-project" data-id="${p.id}">Complete Project</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    container.querySelectorAll('.view-project').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const project = projectsData.find(function(p) { return p.id === this.dataset.id; }.bind(this));
            if (project) viewProjectDetail(project);
        });
    });
    
    container.querySelectorAll('.edit-project').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const project = projectsData.find(function(p) { return p.id === this.dataset.id; }.bind(this));
            if (project) openProjectModal(project);
        });
    });
    
    container.querySelectorAll('.manage-milestones').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const project = projectsData.find(function(p) { return p.id === this.dataset.id; }.bind(this));
            if (project) manageMilestonesModal(project);
        });
    });
    
    container.querySelectorAll('.complete-project').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const project = projectsData.find(function(p) { return p.id === this.dataset.id; }.bind(this));
            if (project) completeProject(project.id);
        });
    });
}

function viewProjectDetail(project) {
    getProject(project.id)
        .then(function(detail) {
            const milestones = detail.milestones || [];
            const progress = detail.progress || 0;
            
            let milestonesHtml = '';
            if (milestones.length > 0) {
                milestonesHtml = milestones.map(function(m) {
                    const statusText = m.status || 'pending';
                    let tasksHtml = '';
                    
                    if (m.tasks && m.tasks.length > 0) {
                        tasksHtml = m.tasks.map(function(t) {
                            const taskStatus = t.status || 'pending';
                            const isCompleted = t.status === 'completed';
                            
                            return `
                                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--gray-100);font-size:var(--font-size-sm);">
                                    <span>${t.title}</span>
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <span class="badge badge-${isCompleted ? 'success' : 'gray'}">${taskStatus}</span>
                                        ${!isCompleted ? `<button class="btn btn-sm btn-success complete-task-btn" data-project-id="${project.id}" data-task-id="${t.id}">Complete</button>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('');
                    } else {
                        tasksHtml = '<div style="padding:8px;color:var(--gray-400);font-size:var(--font-size-sm);">No tasks</div>';
                    }
                    
                    return `
                        <div style="border:1px solid var(--gray-200);border-radius:4px;margin-bottom:8px;overflow:hidden;">
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--gray-50);border-bottom:1px solid var(--gray-200);">
                                <div>
                                    <strong>${m.title}</strong>
                                    <span style="font-size:var(--font-size-xs);color:var(--gray-500);margin-left:8px;">Weight: ${m.weight || 0}%</span>
                                </div>
                                <span class="badge badge-${m.status === 'completed' ? 'success' : 'gray'}">${statusText}</span>
                            </div>
                            <div style="padding:4px 0;">
                                ${tasksHtml}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                milestonesHtml = '<p class="text-muted">No milestones yet.</p>';
            }
            
            showModal({
                title: 'Project Details',
                content: `
                    <div style="margin-bottom:12px;">
                        <h3 style="margin:0 0 8px 0;">${project.title}</h3>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                            <span class="badge badge-primary">Progress: ${progress}%</span>
                            <span class="badge badge-gray">${milestones.length} milestones</span>
                            <span class="badge badge-${project.status === 'completed' ? 'success' : 'gray'}">${project.status || 'planning'}</span>
                        </div>
                        <div style="background:var(--gray-200);border-radius:4px;height:6px;margin-bottom:12px;overflow:hidden;">
                            <div style="background:var(--primary);height:100%;width:${progress}%;border-radius:4px;transition:width 0.5s ease;"></div>
                        </div>
                        ${project.description ? `<p>${project.description}</p>` : ''}
                    </div>
                    <div style="max-height:400px;overflow-y:auto;">
                        ${milestonesHtml}
                    </div>
                    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200);">
                        <button class="btn btn-sm btn-primary add-milestone-btn" data-project-id="${project.id}">Add Milestone</button>
                        <button class="btn btn-sm btn-outline add-task-btn" data-project-id="${project.id}">Add Task</button>
                    </div>
                `,
                size: 'lg',
                buttons: [
                    {
                        label: 'Close',
                        action: 'close',
                        class: 'btn-outline',
                        onClick: function(done) { done(); }
                    }
                ],
                onShow: function() {
                    document.querySelector('.add-milestone-btn').addEventListener('click', function() {
                        addMilestoneModal(this.dataset.projectId);
                    });
                    document.querySelector('.add-task-btn').addEventListener('click', function() {
                        addTaskModal(this.dataset.projectId);
                    });
                }
            });
        })
        .catch(function(error) {
            showError('Failed to load project details: ' + error.message);
        });
}

function manageMilestonesModal(project) {
    viewProjectDetail(project);
}

function completeProject(projectId) {
    showConfirm({
        title: 'Complete Project',
        message: 'Mark this project as completed?',
        confirmLabel: 'Complete',
        confirmClass: 'btn-success',
        onConfirm: function(done) {
            fetch('/api/v1/projects/' + projectId + '/complete/', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                }
            })
            .then(function(response) {
                if (!response.ok) {
                    return response.json().then(function(err) {
                        throw new Error(err.detail || 'Failed to complete project');
                    });
                }
                return response.json();
            })
            .then(function() {
                showSuccess('Project completed!');
                done();
                loadProjects();
            })
            .catch(function(error) {
                showError(error.message || 'Failed to complete project');
            });
        }
    });
}

function completeTask(projectId, taskId) {
    showConfirm({
        title: 'Complete Task',
        message: 'Mark this task as completed?',
        confirmLabel: 'Complete',
        confirmClass: 'btn-success',
        onConfirm: function(done) {
            fetch('/api/v1/projects/tasks/' + taskId, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'completed' })
            })
            .then(function(response) {
                if (!response.ok) {
                    return response.json().then(function(err) {
                        throw new Error(err.detail || 'Failed to complete task');
                    });
                }
                return response.json();
            })
            .then(function() {
                showSuccess('Task completed!');
                done();
                loadProjects();
            })
            .catch(function(error) {
                showError(error.message || 'Failed to complete task');
            });
        }
    });
}

document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('complete-task-btn')) {
        const projectId = e.target.dataset.projectId;
        const taskId = e.target.dataset.taskId;
        completeTask(projectId, taskId);
    }
});

function addMilestoneModal(projectId) {
    showFormModal({
        title: 'Add Milestone',
        fields: [
            {
                id: 'title',
                label: 'Milestone Title',
                type: 'text',
                required: true,
                placeholder: 'Enter milestone title'
            },
            {
                id: 'description',
                label: 'Description',
                type: 'textarea',
                rows: 2,
                placeholder: 'Enter description'
            },
            {
                id: 'weight',
                label: 'Weight (0-100)',
                type: 'number',
                value: 0,
                placeholder: '0'
            }
        ],
        submitLabel: 'Add Milestone',
        onSubmit: function(data, done) {
            fetch('/api/v1/projects/' + projectId + '/milestones', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description || null,
                    weight: parseInt(data.weight) || 0
                })
            })
            .then(function(response) {
                if (!response.ok) {
                    return response.json().then(function(err) {
                        throw new Error(err.detail || 'Failed to add milestone');
                    });
                }
                return response.json();
            })
            .then(function() {
                showSuccess('Milestone added!');
                done();
                loadProjects();
            })
            .catch(function(error) {
                showError(error.message || 'Failed to add milestone');
            });
        }
    });
}

function addTaskModal(projectId) {
    getProject(projectId)
        .then(function(detail) {
            const milestones = detail.milestones || [];
            const milestoneOptions = milestones.map(function(m) {
                return { value: m.id, label: m.title };
            });
            
            if (milestoneOptions.length === 0) {
                showError('Please add a milestone first before adding tasks.');
                return;
            }
            
            showFormModal({
                title: 'Add Task',
                fields: [
                    {
                        id: 'title',
                        label: 'Task Title',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter task title'
                    },
                    {
                        id: 'description',
                        label: 'Description',
                        type: 'textarea',
                        rows: 2,
                        placeholder: 'Enter description'
                    },
                    {
                        id: 'milestone_id',
                        label: 'Milestone',
                        type: 'select',
                        options: milestoneOptions,
                        required: true
                    }
                ],
                submitLabel: 'Add Task',
                onSubmit: function(data, done) {
                    fetch('/api/v1/projects/' + projectId + '/tasks', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token'),
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            title: data.title,
                            description: data.description || null,
                            milestone_id: data.milestone_id,
                            status: 'pending'
                        })
                    })
                    .then(function(response) {
                        if (!response.ok) {
                            return response.json().then(function(err) {
                                throw new Error(err.detail || 'Failed to add task');
                            });
                        }
                        return response.json();
                    })
                    .then(function() {
                        showSuccess('Task added!');
                        done();
                        loadProjects();
                    })
                    .catch(function(error) {
                        showError(error.message || 'Failed to add task');
                    });
                }
            });
        })
        .catch(function(error) {
            showError('Failed to load project for adding task');
        });
}

function openProjectModal(project = null) {
    const isEdit = !!project;
    currentProjectId = project?.id || null;
    
    const memberOptions = membersData.map(function(m) {
        const name = m.full_name || m.first_name + ' ' + m.last_name;
        return { value: m.id, label: name };
    });
    
    const meetingOptions = meetingsData.map(function(m) {
        return { value: m.id, label: m.title };
    });
    
    const fields = [
        {
            id: 'title',
            label: 'Project Title',
            type: 'text',
            value: project?.title || '',
            required: true,
            placeholder: 'Enter project title'
        },
        {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            value: project?.description || '',
            rows: 3,
            placeholder: 'Describe the project'
        },
        {
            id: 'status',
            label: 'Status',
            type: 'select',
            value: project?.status || 'planning',
            options: [
                { value: 'planning', label: 'Planning' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'completed', label: 'Completed' },
                { value: 'on_hold', label: 'On Hold' },
                { value: 'cancelled', label: 'Cancelled' }
            ]
        },
        {
            id: 'priority',
            label: 'Priority',
            type: 'select',
            value: project?.priority || 'medium',
            options: [
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
            ]
        },
        {
            id: 'budget',
            label: 'Budget (KES)',
            type: 'number',
            value: project?.budget || 0,
            placeholder: '0'
        },
        {
            id: 'project_lead',
            label: 'Project Lead',
            type: 'select',
            value: project?.project_lead || '',
            options: [{ value: '', label: 'Select lead...' }].concat(memberOptions)
        },
        {
            id: 'start_date',
            label: 'Start Date',
            type: 'date',
            value: project?.start_date || ''
        },
        {
            id: 'end_date',
            label: 'End Date',
            type: 'date',
            value: project?.end_date || ''
        }
    ];
    
    showFormModal({
        title: isEdit ? 'Edit Project' : 'Create Project',
        fields: fields,
        size: 'md',
        submitLabel: isEdit ? 'Update' : 'Create',
        onSubmit: function(data, done) {
            const formattedData = {
                title: data.title,
                description: data.description || null,
                status: data.status || 'planning',
                priority: data.priority || 'medium',
                budget: parseFloat(data.budget) || 0,
                project_lead: data.project_lead || null,
                start_date: data.start_date || null,
                end_date: data.end_date || null
            };
            
            saveProject(formattedData, isEdit, done);
        }
    });
}

async function saveProject(data, isEdit, done) {
    try {
        if (isEdit && currentProjectId) {
            await updateProject(currentProjectId, data);
            showSuccess('Project updated successfully');
        } else {
            await createProject(data);
            showSuccess('Project created successfully');
        }
        currentProjectId = null;
        done();
        await loadProjects();
    } catch (error) {
        showError(error.message || 'Failed to save project');
    }
}

window.renderProjects = renderProjects;

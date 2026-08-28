/* ============================================================
   Management System - Contribution Types Page
   ============================================================ */

import { getContributionTypes, createContributionType, updateContributionType, deleteContributionType } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showFormModal, showConfirm } from '../components/modal.js';
import { Skeletons } from '../components/skeleton.js';

let typesData = [];
let currentPage = 1;
let pageSize = 20;
let totalTypes = 0;

export async function renderContributionTypes() {
    const content = document.getElementById('pageContent');
    
    content.innerHTML = `
        <div class="page-header">
            <div>
                <h2>Contribution Types</h2>
                <p class="text-muted">Manage contribution categories used for tracking org contributions</p>
            </div>
            <button class="btn btn-primary" id="addTypeBtn">Add Type</button>
        </div>
        
        <div class="filter-bar">
            <div class="search-box">
                <input type="text" id="searchTypes" class="form-control" placeholder="Search types...">
            </div>
            <span class="member-count" id="typeCount">0 types</span>
        </div>
        
        <div id="typesContainer">
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading contribution types...</p>
            </div>
        </div>
        
        <div class="pagination" id="pagination"></div>
    `;
    
    document.getElementById('addTypeBtn').addEventListener('click', function() {
        openTypeModal();
    });
    
    document.getElementById('searchTypes').addEventListener('input', function(e) {
        const search = e.target.value.toLowerCase().trim();
        filterTypes(search);
    });
    
    await loadTypes();
}

async function loadTypes() {
    try {
        typesData = await getContributionTypes();
        totalTypes = typesData.length;
        renderTypesTable(typesData);
        document.getElementById('typeCount').textContent = totalTypes + ' types';
        renderPagination();
    } catch (error) {
        document.getElementById('typesContainer').innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load types: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadTypes()">Retry</button>
            </div></div>
        `;
    }
}

function filterTypes(search) {
    if (!search) {
        renderTypesTable(typesData);
        document.getElementById('typeCount').textContent = totalTypes + ' types';
        return;
    }
    
    const filtered = typesData.filter(function(t) {
        return t.name.toLowerCase().includes(search) ||
               (t.description && t.description.toLowerCase().includes(search));
    });
    
    renderTypesTable(filtered);
    document.getElementById('typeCount').textContent = filtered.length + ' types (filtered)';
}

function renderTypesTable(types) {
    const container = document.getElementById('typesContainer');
    
    if (!types || types.length === 0) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <div class="empty-state">
                    <p class="text-muted">No contribution types found</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addTypeBtn').click()">Add your first type</button>
                </div>
            </div></div>
        `;
        return;
    }
    
    let html = `<div class="card"><div class="table-responsive"><table class="table"><thead><tr>
        <th>Name</th>
        <th>Description</th>
        <th>Category</th>
        <th>Status</th>
        <th style="text-align:right;">Actions</th>
    </tr></thead><tbody>`;
    
    types.forEach(function(t) {
        const statusClass = t.is_active !== false ? 'badge-success' : 'badge-danger';
        const statusText = t.is_active !== false ? 'Active' : 'Inactive';
        const category = t.category || 'General';
        const icon = t.icon || '';
        
        html += `<tr>
            <td><strong>${icon} ${t.name}</strong></td>
            <td>${t.description || '-'}</td>
            <td><span class="badge badge-gray">${category}</span></td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td style="text-align:right;">
                <button class="btn btn-sm btn-outline edit-type" data-id="${t.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-type" data-id="${t.id}">Delete</button>
            </td>
        </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.edit-type').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const type = typesData.find(function(t) { return t.id === this.dataset.id; }.bind(this));
            if (type) openTypeModal(type);
        });
    });
    
    container.querySelectorAll('.delete-type').forEach(function(btn) {
        btn.addEventListener('click', function() {
            deleteTypeHandler(this.dataset.id);
        });
    });
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(totalTypes / pageSize);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    html += `<button class="btn btn-sm btn-outline page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>Previous</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'} page-btn" data-page="${i}">${i}</button>`;
    }
    html += `<button class="btn btn-sm btn-outline page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>`;
    
    pagination.innerHTML = html;
    pagination.querySelectorAll('.page-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const page = parseInt(this.dataset.page);
            if (page > 0 && page <= totalPages) {
                currentPage = page;
                loadTypes();
            }
        });
    });
}

function openTypeModal(type = null) {
    const isEdit = !!type;
    
    const fields = [
        {
            id: 'name',
            label: 'Type Name',
            type: 'text',
            value: type?.name || '',
            required: true,
            placeholder: 'e.g., Harambee, Development, Funeral'
        },
        {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            value: type?.description || '',
            required: false,
            rows: 2,
            placeholder: 'Brief description of this contribution type'
        },
        {
            id: 'icon',
            label: 'Icon',
            type: 'text',
            value: type?.icon || '',
            required: false,
            placeholder: 'Enter an icon name or emoji'
        },
        {
            id: 'category',
            label: 'Category',
            type: 'select',
            value: type?.category || 'general',
            required: false,
            options: [
                { value: 'general', label: 'General' },
                { value: 'development', label: 'Development' },
                { value: 'social', label: 'Social' },
                { value: 'emergency', label: 'Emergency' },
                { value: 'religious', label: 'Religious' },
                { value: 'education', label: 'Education' }
            ]
        },
        {
            id: 'is_active',
            label: 'Status',
            type: 'select',
            value: type?.is_active !== false ? 'true' : 'false',
            required: false,
            options: [
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' }
            ]
        }
    ];
    
    showFormModal({
        title: isEdit ? 'Edit Contribution Type' : 'Add Contribution Type',
        fields: fields,
        size: 'md',
        submitLabel: isEdit ? 'Update' : 'Add Type',
        onSubmit: function(data, done) {
            if (!data.name || data.name.trim().length < 2) {
                showError('Please enter a valid type name');
                return;
            }
            
            const formattedData = {
                name: data.name.trim(),
                description: data.description || null,
                icon: data.icon || null,
                category: data.category || 'general',
                is_active: data.is_active === 'true'
            };
            
            saveType(formattedData, isEdit, type?.id, done);
        }
    });
}

async function saveType(data, isEdit, typeId, done) {
    try {
        if (isEdit && typeId) {
            await updateContributionType(typeId, data);
            showSuccess('Contribution type updated successfully');
        } else {
            await createContributionType(data);
            showSuccess('Contribution type added successfully');
        }
        done();
        await loadTypes();
    } catch (error) {
        showError(error.message || 'Failed to save contribution type');
    }
}

async function deleteTypeHandler(typeId) {
    const type = typesData.find(function(t) { return t.id === typeId; });
    const name = type ? type.name : 'this type';
    
    showConfirm({
        title: 'Delete Contribution Type',
        message: 'Delete "' + name + '"? This cannot be undone.',
        confirmLabel: 'Delete',
        confirmClass: 'btn-danger',
        onConfirm: function(done) {
            deleteContributionType(typeId)
                .then(function() {
                    showSuccess('Type deleted successfully');
                    done();
                    loadTypes();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to delete type');
                });
        }
    });
}

window.renderContributionTypes = renderContributionTypes;

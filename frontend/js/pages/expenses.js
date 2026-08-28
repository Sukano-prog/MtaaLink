/* ============================================================
   MtaaLink - Expenses Page
   ============================================================ */

import { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseCategories, createExpenseCategory, getMembers, getProjects, getEvents } from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { Skeletons } from "../components/skeleton.js";
import { showFormModal, showConfirm, showModal } from '../components/modal.js';

let expensesData = [];
let categoriesData = [];
let membersData = [];
let projectsData = [];
let eventsData = [];
let currentExpenseId = null;
let searchQuery = "";

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'till', label: 'Buy Goods Till' },
    { value: 'other', label: 'Other' }
];

export async function renderExpenses() {
    const content = document.getElementById('pageContent');
    
    try {
        await Promise.all([
            getMembers().then(data => membersData = data).catch(() => []),
            getProjects().then(data => projectsData = data).catch(() => []),
            getEvents().then(data => eventsData = data).catch(() => [])
        ]);
        
        categoriesData = await getExpenseCategories().catch(() => []);
        
        content.innerHTML = `
            <div class="page-header">
                <h2>Expenses</h2>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-primary" id="addExpenseBtn">Record Expense</button>
                    <button class="btn btn-outline" id="addCategoryBtn">Manage Categories</button>
                </div>
            </div>
            
            <div class="stats-grid" id="expenseStats">
                <div class="stat-card">
                    <div class="stat-label">Total Expenses</div>
                    <div class="stat-value" id="totalExpenses">KES 0</div>
                    <div class="stat-change">All time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">This Month</div>
                    <div class="stat-value" id="monthlyExpenses">KES 0</div>
                    <div class="stat-change">${new Date().toLocaleString('default', { month: 'long' })}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Expenses</div>
                    <div class="stat-value" id="expenseCount">0</div>
                    <div class="stat-change">Records</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Categories</div>
                    <div class="stat-value" id="categoryCount">0</div>
                    <div class="stat-change">Active categories</div>
                </div>
            </div>
            
            <div class="filter-bar">
                <div class="search-box">
                    <input type="text" id="searchExpenses" class="form-control" placeholder="Search expenses by description...">
                </div>
                <div class="filter-box">
                    <select id="categoryFilter" class="form-control form-select">
                        <option value="">All Categories</option>
                        ${categoriesData.map(function(c) {
                            return `<option value="${c.name}">${c.name}</option>`;
                        }).join('')}
                    </select>
                </div>
                <div class="filter-box">
                    <input type="month" id="monthFilter" class="form-control">
                </div>
                <span class="expense-count" id="expenseCountLabel">0 expenses</span>
            </div>
            
            <div id="expensesContainer">
                ${Skeletons.table()}
            </div>
        `;
        
        document.getElementById('addExpenseBtn').addEventListener('click', function() {
            openExpenseModal();
        });
        
        document.getElementById('addCategoryBtn').addEventListener('click', function() {
            openCategoryModal();
        });
        
        document.getElementById('categoryFilter').addEventListener('change', function() {
            loadExpenses();
        });
        
        document.getElementById('monthFilter').addEventListener('change', function() {
            loadExpenses();
        });
        
        document.getElementById('searchExpenses').addEventListener('input', function() {
            searchQuery = this.value.trim();
            loadExpenses();
        });
        
        const monthFilter = document.getElementById('monthFilter');
        if (monthFilter) {
            const now = new Date();
            monthFilter.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        }
        
        await loadExpenses();
        
    } catch (error) {
        content.innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load expenses: ${error.message}</p>
                <button class="btn btn-primary" onclick="renderExpenses()">Retry</button>
            </div></div>
        `;
    }
}

async function loadExpenses() {
    const container = document.getElementById('expensesContainer');
    
    try {
        const category = document.getElementById('categoryFilter').value;
        const month = document.getElementById('monthFilter').value;
        
        let params = {};
        if (category) params.category = category;
        if (month) {
            const [year, monthNum] = month.split('-');
            params.start_date = year + '-' + monthNum + '-01';
            const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
            params.end_date = year + '-' + monthNum + '-' + String(lastDay).padStart(2, '0');
        }
        if (searchQuery) params.search = searchQuery;
        
        expensesData = await getExpenses(params);
        renderExpensesList();
        updateStats(expensesData);
        document.getElementById('expenseCountLabel').textContent = expensesData.length + ' expenses';
        
    } catch (error) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load expenses: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadExpenses()">Retry</button>
            </div></div>
        `;
    }
}

function renderExpensesList() {
    const container = document.getElementById('expensesContainer');
    
    if (expensesData.length === 0) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <div class="empty-state">
                    <p class="text-muted">No expenses recorded</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addExpenseBtn').click()">
                        Record your first expense
                    </button>
                </div>
            </div></div>
        `;
        return;
    }
    
    const categoryColors = {};
    categoriesData.forEach(function(c) {
        if (c.color) categoryColors[c.name] = c.color;
    });
    
    let html = `<div class="card"><div class="table-responsive"><table class="table"><thead><tr>
        <th>#</th>
        <th>Description</th>
        <th>Category</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Payment Method</th>
        <th>Recorded By</th>
        <th style="text-align:right;">Actions</th>
    </tr></thead><tbody>`;
    
    expensesData.forEach(function(e, i) {
        const color = categoryColors[e.category] || 'var(--gray)';
        const bgColor = color + '20';
        const borderColor = color;
        
        html += `<tr>
            <td>${i + 1}</td>
            <td><strong>${e.description}</strong>${e.notes ? '<br><span style="font-size:var(--font-size-xs);color:var(--gray-400);">' + e.notes + '</span>' : ''}</td>
            <td><span style="background:${bgColor};color:${borderColor};padding:2px 8px;border-radius:4px;font-size:12px;border:1px solid ${borderColor};">${e.category}</span></td>
            <td><strong>KES ${(e.amount || 0).toLocaleString()}</strong></td>
            <td>${e.expense_date}</td>
            <td>${e.payment_method || '-'}</td>
            <td>${e.recorded_by_name || 'Unknown'}</td>
            <td style="text-align:right;">
                <button class="btn btn-sm btn-outline edit-expense" data-id="${e.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-expense" data-id="${e.id}">Delete</button>
            </td>
        </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.edit-expense').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const expense = expensesData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (expense) openExpenseModal(expense);
        });
    });
    
    container.querySelectorAll('.delete-expense').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const expense = expensesData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (expense) deleteExpenseHandler(expense);
        });
    });
}

function updateStats(expenses) {
    let total = 0;
    let monthlyTotal = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    expenses.forEach(function(e) {
        total += e.amount || 0;
        const expenseDate = new Date(e.expense_date);
        if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
            monthlyTotal += e.amount || 0;
        }
    });
    
    document.getElementById('totalExpenses').textContent = 'KES ' + total.toLocaleString();
    document.getElementById('monthlyExpenses').textContent = 'KES ' + monthlyTotal.toLocaleString();
    document.getElementById('expenseCount').textContent = expenses.length;
    document.getElementById('categoryCount').textContent = categoriesData.length;
}

function openExpenseModal(expense = null) {
    const isEdit = !!expense;
    currentExpenseId = expense?.id || null;
    
    const memberOptions = membersData.map(function(m) {
        return { value: m.id, label: m.full_name || m.first_name + ' ' + m.last_name };
    });
    
    const projectOptions = projectsData.map(function(p) {
        return { value: p.id, label: p.title };
    });
    
    const eventOptions = eventsData.map(function(e) {
        return { value: e.id, label: e.title };
    });
    
    const categoryOptions = categoriesData.map(function(c) {
        return { value: c.name, label: c.name };
    });
    
    const fields = [
        {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            value: expense?.description || '',
            required: true,
            rows: 2,
            placeholder: 'What was the expense for?'
        },
        {
            id: 'category',
            label: 'Category',
            type: 'select',
            value: expense?.category || '',
            required: true,
            options: [{ value: '', label: 'Select category...' }].concat(categoryOptions)
        },
        {
            id: 'amount',
            label: 'Amount (KES)',
            type: 'number',
            value: expense?.amount || '',
            required: true,
            placeholder: '0.00'
        },
        {
            id: 'expense_date',
            label: 'Date',
            type: 'date',
            value: expense?.expense_date || new Date().toISOString().slice(0, 10),
            required: true
        },
        {
            id: 'payment_method',
            label: 'Payment Method',
            type: 'select',
            value: expense?.payment_method || '',
            required: false,
            options: [{ value: '', label: 'Select method...' }].concat(PAYMENT_METHODS)
        },
        {
            id: 'receipt_number',
            label: 'Receipt Number (optional)',
            type: 'text',
            value: expense?.receipt_number || '',
            required: false,
            placeholder: 'e.g., REC-001'
        },
        {
            id: 'notes',
            label: 'Notes (optional)',
            type: 'textarea',
            value: expense?.notes || '',
            required: false,
            rows: 2,
            placeholder: 'Additional details...'
        }
    ];
    
    if (projectOptions.length > 0) {
        fields.push({
            id: 'project_id',
            label: 'Related Project (optional)',
            type: 'select',
            value: expense?.project_id || '',
            required: false,
            options: [{ value: '', label: 'None' }].concat(projectOptions)
        });
    }
    
    if (eventOptions.length > 0) {
        fields.push({
            id: 'event_id',
            label: 'Related Event (optional)',
            type: 'select',
            value: expense?.event_id || '',
            required: false,
            options: [{ value: '', label: 'None' }].concat(eventOptions)
        });
    }
    
    showFormModal({
        title: isEdit ? 'Edit Expense' : 'Record Expense',
        fields: fields,
        size: 'md',
        submitLabel: isEdit ? 'Update' : 'Record',
        onSubmit: function(data, done) {
            const formattedData = {
                description: data.description,
                category: data.category,
                amount: parseFloat(data.amount) || 0,
                expense_date: data.expense_date,
                payment_method: data.payment_method || null,
                receipt_number: data.receipt_number || null,
                notes: data.notes || null,
                project_id: data.project_id || null,
                event_id: data.event_id || null
            };
            
            if (isEdit) {
                delete formattedData.project_id;
                delete formattedData.event_id;
            }
            
            saveExpense(formattedData, isEdit, done);
        }
    });
}

async function saveExpense(data, isEdit, done) {
    try {
        if (isEdit && currentExpenseId) {
            await updateExpense(currentExpenseId, data);
            showSuccess('Expense updated successfully');
        } else {
            await createExpense(data);
            showSuccess('Expense recorded successfully');
        }
        currentExpenseId = null;
        done();
        await loadExpenses();
    } catch (error) {
        showError(error.message || 'Failed to save expense');
    }
}

function openCategoryModal() {
    const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
    
    showFormModal({
        title: 'Add Expense Category',
        size: 'sm',
        submitLabel: 'Add Category',
        fields: [
            {
                id: 'name',
                label: 'Category Name',
                type: 'text',
                value: '',
                required: true,
                placeholder: 'e.g., Water, Infrastructure'
            },
            {
                id: 'description',
                label: 'Description',
                type: 'text',
                value: '',
                required: false,
                placeholder: 'Brief description'
            },
            {
                id: 'color',
                label: 'Color',
                type: 'select',
                value: '#3B82F6',
                required: false,
                options: colors.map(function(c) {
                    return { value: c, label: c };
                })
            }
        ],
        onSubmit: function(data, done) {
            createExpenseCategory({
                name: data.name,
                description: data.description || null,
                color: data.color || null
            })
            .then(function() {
                showSuccess('Category added');
                done();
                renderExpenses();
            })
            .catch(function(error) {
                showError(error.message || 'Failed to add category');
            });
        }
    });
}

async function deleteExpenseHandler(expense) {
    showConfirm({
        title: 'Delete Expense',
        message: 'Delete this expense record? This cannot be undone.',
        confirmLabel: 'Delete',
        confirmClass: 'btn-danger',
        onConfirm: function(done) {
            deleteExpense(expense.id)
                .then(function() {
                    showSuccess('Expense deleted');
                    done();
                    loadExpenses();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to delete expense');
                });
        }
    });
}

window.renderExpenses = renderExpenses;

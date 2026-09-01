/* ============================================================
   MtaaLink - Settings Page
   ============================================================ */

import { showToast, showError, showSuccess } from '../components/toast.js';

let settings = {};

const defaultSettings = {
    organization_name: '',
    member_label: 'Member',
    custom_field_enabled: false,
    custom_field_label: '',
    custom_field_options: [],
    age_enabled: false,
    age_required: false,
    group_label: 'Group',
    prefill_age_categories: true,
    age_categories: [],
    amount_format: 'whole',
    payment_autofill: true
};

const defaultAgeCategories = [
    { name: 'Children', min: 0, max: 5, amount: 500 },
    { name: 'Kids', min: 6, max: 12, amount: 1000 },
    { name: 'Teens', min: 13, max: 18, amount: 1500 },
    { name: 'Adults', min: 19, max: null, amount: 2000 }
];

export async function renderSettings() {
    const content = document.getElementById('pageContent');
    
    try {
        const response = await fetch('/api/v1/settings/', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        if (response.ok) {
            settings = await response.json();
        } else {
            settings = { ...defaultSettings };
        }
    } catch (error) {
        settings = { ...defaultSettings };
    }
    
    // Ensure all fields exist
    for (const key in defaultSettings) {
        if (!(key in settings)) {
            settings[key] = defaultSettings[key];
        }
    }
    
    // If age categories is empty and prefill is true, add defaults
    if (settings.prefill_age_categories && settings.age_categories.length === 0) {
        settings.age_categories = JSON.parse(JSON.stringify(defaultAgeCategories));
    }
    
    renderSettingsForm(content);
}

function renderSettingsForm(content) {
    // Build custom field options HTML
    let optionsHtml = '';
    if (settings.custom_field_options && settings.custom_field_options.length > 0) {
        settings.custom_field_options.forEach(function(opt, index) {
            optionsHtml += `
                <span class="option-tag" style="display:inline-block;background:#e9edf2;padding:4px 10px;border-radius:4px;margin:2px;font-size:13px;">
                    ${opt}
                    <span class="remove-option" data-index="${index}" style="cursor:pointer;color:#e74c3c;margin-left:4px;">x</span>
                </span>
            `;
        });
    }
    
    // Build age categories HTML
    let ageCategoriesHtml = '';
    if (settings.age_categories && settings.age_categories.length > 0) {
        settings.age_categories.forEach(function(cat, index) {
            const maxDisplay = cat.max !== null && cat.max !== undefined ? cat.max : '';
            ageCategoriesHtml += `
                <tr>
                    <td><input type="text" class="age-name" value="${cat.name || ''}" data-index="${index}" placeholder="Name" style="width:100%;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
                    <td><input type="number" class="age-min" value="${cat.min !== undefined ? cat.min : ''}" data-index="${index}" placeholder="0" style="width:60px;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
                    <td><input type="number" class="age-max" value="${maxDisplay}" data-index="${index}" placeholder="Max" style="width:60px;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
                    <td><input type="number" class="age-amount" value="${cat.amount !== undefined ? cat.amount : ''}" data-index="${index}" placeholder="0" style="width:80px;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
                    <td><button class="btn-remove-age" data-index="${index}" style="padding:4px 10px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Remove</button></td>
                </tr>
            `;
        });
    }
    
    content.innerHTML = `
        <div class="page-header" style="margin-bottom:24px;">
            <h2 style="margin:0;font-size:24px;font-weight:600;">Settings</h2>
            <p style="color:#6b7a8f;margin:4px 0 0 0;font-size:14px;">Customize how your organization works</p>
        </div>
        
        <form id="settingsForm" style="max-width:800px;">
            <!-- Organization Settings -->
            <div style="background:white;border-radius:12px;border:1px solid #e9edf2;margin-bottom:20px;overflow:hidden;">
                <div style="padding:16px 20px;border-bottom:1px solid #e9edf2;background:#f8f9fa;">
                    <h3 style="margin:0;font-size:16px;font-weight:600;">Organization</h3>
                </div>
                <div style="padding:20px;">
                    <div style="margin-bottom:0;">
                        <label style="display:block;font-weight:500;margin-bottom:4px;font-size:14px;">Organization Name</label>
                        <input type="text" id="org_name" class="form-control" value="${settings.organization_name || ''}" placeholder="Enter organization name" style="width:100%;padding:10px 14px;border:1px solid #d5dbe3;border-radius:8px;font-size:14px;">
                        <small style="color:#8a9aa8;font-size:12px;">This name appears on reports and header</small>
                    </div>
                </div>
            </div>
            
            <!-- Member Settings -->
            <div style="background:white;border-radius:12px;border:1px solid #e9edf2;margin-bottom:20px;overflow:hidden;">
                <div style="padding:16px 20px;border-bottom:1px solid #e9edf2;background:#f8f9fa;">
                    <h3 style="margin:0;font-size:16px;font-weight:600;">Members</h3>
                </div>
                <div style="padding:20px;">
                    <div style="margin-bottom:16px;">
                        <label style="display:block;font-weight:500;margin-bottom:4px;font-size:14px;">Member Label</label>
                        <input type="text" id="member_label" class="form-control" value="${settings.member_label || 'Member'}" placeholder="e.g., Member, Attendee, Student" style="width:100%;padding:10px 14px;border:1px solid #d5dbe3;border-radius:8px;font-size:14px;">
                        <small style="color:#8a9aa8;font-size:12px;">What do you call your members? This appears throughout the system</small>
                    </div>
                    
                    <div style="margin-bottom:16px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="custom_field_enabled" ${settings.custom_field_enabled ? 'checked' : ''} style="margin-right:8px;width:16px;height:16px;">
                            <span style="font-weight:500;font-size:14px;">Enable Custom Field</span>
                        </label>
                        <small style="color:#8a9aa8;font-size:12px;display:block;margin-top:2px;margin-left:24px;">Add an extra field to member profiles</small>
                    </div>
                    
                    <div id="customFieldSection" style="${settings.custom_field_enabled ? '' : 'display:none;'} margin-bottom:16px;padding-left:24px;border-left:2px solid #e9edf2;">
                        <div style="margin-bottom:12px;">
                            <label style="display:block;font-weight:500;margin-bottom:4px;font-size:14px;">Custom Field Label</label>
                            <input type="text" id="custom_field_label" class="form-control" value="${settings.custom_field_label || ''}" placeholder="e.g., Church, Class, Department" style="width:100%;padding:10px 14px;border:1px solid #d5dbe3;border-radius:8px;font-size:14px;">
                            <small style="color:#8a9aa8;font-size:12px;">What should this field be called?</small>
                        </div>
                        
                        <div>
                            <label style="display:block;font-weight:500;margin-bottom:4px;font-size:14px;">Custom Field Options</label>
                            <div id="optionsContainer" style="margin-bottom:8px;">
                                ${optionsHtml || '<span style="color:#8a9aa8;font-size:13px;">No options added yet</span>'}
                            </div>
                            <div style="display:flex;gap:8px;">
                                <input type="text" id="newOption" class="form-control" placeholder="Enter option..." style="flex:1;padding:8px 12px;border:1px solid #d5dbe3;border-radius:8px;font-size:14px;">
                                <button type="button" id="addOption" style="padding:8px 16px;background:#1a73e8;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Add</button>
                            </div>
                            <small style="color:#8a9aa8;font-size:12px;display:block;margin-top:4px;">These options will appear in the dropdown field</small>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:16px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="age_enabled" ${settings.age_enabled ? 'checked' : ''} style="margin-right:8px;width:16px;height:16px;">
                            <span style="font-weight:500;font-size:14px;">Enable Age Tracking</span>
                        </label>
                        <small style="color:#8a9aa8;font-size:12px;display:block;margin-top:2px;margin-left:24px;">Track age categories for members</small>
                    </div>
                    
                    <div id="ageRequiredSection" style="${settings.age_enabled ? '' : 'display:none;'} padding-left:24px;border-left:2px solid #e9edf2;margin-bottom:16px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="age_required" ${settings.age_required ? 'checked' : ''} style="margin-right:8px;width:16px;height:16px;">
                            <span style="font-size:14px;">Age Category Required</span>
                        </label>
                        <small style="color:#8a9aa8;font-size:12px;display:block;margin-top:2px;margin-left:24px;">Members must select an age category</small>
                    </div>
                    
                    <div style="margin-bottom:0;">
                        <label style="display:block;font-weight:500;margin-bottom:4px;font-size:14px;">Group Label</label>
                        <input type="text" id="group_label" class="form-control" value="${settings.group_label || 'Group'}" placeholder="e.g., Group, Church, Class" style="width:100%;padding:10px 14px;border:1px solid #d5dbe3;border-radius:8px;font-size:14px;">
                        <small style="color:#8a9aa8;font-size:12px;">What do you call your groups?</small>
                    </div>
                </div>
            </div>
            
            <!-- Age Categories & Payments -->
            <div id="ageSection" style="background:white;border-radius:12px;border:1px solid #e9edf2;margin-bottom:20px;overflow:hidden;${settings.age_enabled ? '' : 'display:none;'}">
                <div style="padding:16px 20px;border-bottom:1px solid #e9edf2;background:#f8f9fa;">
                    <h3 style="margin:0;font-size:16px;font-weight:600;">Age Categories & Payments</h3>
                </div>
                <div style="padding:20px;">
                    <div style="margin-bottom:16px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="prefill_age_categories" ${settings.prefill_age_categories ? 'checked' : ''} style="margin-right:8px;width:16px;height:16px;">
                            <span style="font-size:14px;">Pre-fill default age categories</span>
                        </label>
                        <small style="color:#8a9aa8;font-size:12px;display:block;margin-top:2px;margin-left:24px;">Add default categories: Children (0-5), Kids (6-12), Teens (13-18), Adults (19+)</small>
                    </div>
                    
                    <div style="margin-bottom:16px;">
                        <p style="color:#6b7a8f;font-size:14px;margin:0 0 12px 0;">Define age ranges and their payment amounts</p>
                        
                        <div style="overflow-x:auto;">
                            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                                <thead>
                                    <tr style="background:#f5f7fa;text-align:left;">
                                        <th style="padding:8px 10px;font-weight:500;">Category Name</th>
                                        <th style="padding:8px 10px;font-weight:500;">Min Age</th>
                                        <th style="padding:8px 10px;font-weight:500;">Max Age</th>
                                        <th style="padding:8px 10px;font-weight:500;">Amount (KES)</th>
                                        <th style="padding:8px 10px;font-weight:500;width:80px;"></th>
                                    </tr>
                                </thead>
                                <tbody id="ageTableBody">
                                    ${ageCategoriesHtml || `
                                    <tr>
                                        <td colspan="5" style="padding:20px;text-align:center;color:#8a9aa8;">No age categories defined. Add one below.</td>
                                    </tr>
                                    `}
                                </tbody>
                            </table>
                        </div>
                        
                        <button type="button" id="addAgeCategory" style="margin-top:12px;padding:8px 16px;background:#1a73e8;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">+ Add Category</button>
                    </div>
                    
                    <div style="margin-bottom:12px;">
                        <label style="display:block;font-weight:500;margin-bottom:4px;font-size:14px;">Amount Format</label>
                        <select id="amount_format" style="width:100%;padding:10px 14px;border:1px solid #d5dbe3;border-radius:8px;font-size:14px;background:white;">
                            <option value="whole" ${settings.amount_format === 'whole' ? 'selected' : ''}>Whole Numbers (e.g., 500)</option>
                            <option value="decimal" ${settings.amount_format === 'decimal' ? 'selected' : ''}>Decimals (e.g., 500.50)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="payment_autofill" ${settings.payment_autofill !== false ? 'checked' : ''} style="margin-right:8px;width:16px;height:16px;">
                            <span style="font-size:14px;">Payment Auto-fill</span>
                        </label>
                        <small style="color:#8a9aa8;font-size:12px;display:block;margin-top:2px;margin-left:24px;">Auto-fill payment amount when age category is selected</small>
                    </div>
                </div>
            </div>
            
            <!-- Save Button -->
            <div style="display:flex;gap:12px;margin-top:20px;">
                <button type="submit" id="saveSettings" style="padding:10px 30px;background:#1a73e8;color:white;border:none;border-radius:8px;font-size:15px;cursor:pointer;">Save Settings</button>
                <button type="button" onclick="navigateTo('dashboard')" style="padding:10px 30px;background:transparent;color:#6b7a8f;border:1px solid #d5dbe3;border-radius:8px;font-size:15px;cursor:pointer;">Cancel</button>
            </div>
        </form>
    `;
    
    // Event listeners
    document.getElementById('custom_field_enabled').addEventListener('change', function() {
        document.getElementById('customFieldSection').style.display = this.checked ? 'block' : 'none';
    });
    
    document.getElementById('age_enabled').addEventListener('change', function() {
        const display = this.checked ? 'block' : 'none';
        document.getElementById('ageSection').style.display = display;
        document.getElementById('ageRequiredSection').style.display = display;
    });
    
    document.getElementById('prefill_age_categories').addEventListener('change', function() {
        if (this.checked) {
            const tbody = document.getElementById('ageTableBody');
            const categories = [
                { name: 'Children', min: 0, max: 5, amount: 500 },
                { name: 'Kids', min: 6, max: 12, amount: 1000 },
                { name: 'Teens', min: 13, max: 18, amount: 1500 },
                { name: 'Adults', min: 19, max: null, amount: 2000 }
            ];
            let html = '';
            categories.forEach(function(cat, index) {
                const maxDisplay = cat.max !== null ? cat.max : '';
                html += `
                    <tr>
                        <td><input type="text" class="age-name" value="${cat.name}" data-index="${index}" placeholder="Name" style="width:100%;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
                        <td><input type="number" class="age-min" value="${cat.min}" data-index="${index}" placeholder="0" style="width:60px;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
                        <td><input type="number" class="age-max" value="${maxDisplay}" data-index="${index}" placeholder="Max" style="width:60px;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
                        <td><input type="number" class="age-amount" value="${cat.amount}" data-index="${index}" placeholder="0" style="width:80px;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
                        <td><button class="btn-remove-age" data-index="${index}" style="padding:4px 10px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Remove</button></td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
            attachRemoveAgeEvents();
        }
    });
    
    document.getElementById('addOption').addEventListener('click', function() {
        const input = document.getElementById('newOption');
        const value = input.value.trim();
        if (value) {
            const container = document.getElementById('optionsContainer');
            const tag = document.createElement('span');
            tag.className = 'option-tag';
            tag.style.cssText = 'display:inline-block;background:#e9edf2;padding:4px 10px;border-radius:4px;margin:2px;font-size:13px;';
            const index = container.querySelectorAll('.option-tag').length;
            tag.innerHTML = `${value} <span class="remove-option" data-index="${index}" style="cursor:pointer;color:#e74c3c;margin-left:4px;">x</span>`;
            container.appendChild(tag);
            input.value = '';
            
            const placeholder = container.querySelector('span[style*="color:#8a9aa8"]');
            if (placeholder) placeholder.remove();
            
            // Reattach remove events
            document.querySelectorAll('.remove-option').forEach(function(el) {
                el.addEventListener('click', function() {
                    this.parentElement.remove();
                });
            });
        }
    });
    
    document.getElementById('addAgeCategory').addEventListener('click', function() {
        const tbody = document.getElementById('ageTableBody');
        const row = document.createElement('tr');
        const index = tbody.querySelectorAll('tr').length;
        row.innerHTML = `
            <td><input type="text" class="age-name" placeholder="Name" style="width:100%;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
            <td><input type="number" class="age-min" placeholder="0" style="width:60px;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
            <td><input type="number" class="age-max" placeholder="Max" style="width:60px;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
            <td><input type="number" class="age-amount" placeholder="0" style="width:80px;padding:6px 8px;border:1px solid #d5dbe3;border-radius:4px;font-size:13px;"></td>
            <td><button class="btn-remove-age" style="padding:4px 10px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Remove</button></td>
        `;
        
        const placeholderRow = tbody.querySelector('tr td[colspan="5"]');
        if (placeholderRow) {
            tbody.innerHTML = '';
        }
        
        tbody.appendChild(row);
        attachRemoveAgeEvents();
    });
    
    function attachRemoveAgeEvents() {
        document.querySelectorAll('.btn-remove-age').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                if (row) {
                    row.remove();
                    const tbody = document.getElementById('ageTableBody');
                    if (tbody && tbody.children.length === 0) {
                        tbody.innerHTML = `
                            <tr>
                                <td colspan="5" style="padding:20px;text-align:center;color:#8a9aa8;">No age categories defined. Add one below.</td>
                            </tr>
                        `;
                    }
                }
            });
        });
    }
    attachRemoveAgeEvents();
    
    // Remove option events
    document.querySelectorAll('.remove-option').forEach(function(el) {
        el.addEventListener('click', function() {
            this.parentElement.remove();
        });
    });
    
    // Form submit
    document.getElementById('settingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSettings();
    });
}

async function saveSettings() {
    const form = document.getElementById('settingsForm');
    const data = {
        organization_name: document.getElementById('org_name').value.trim(),
        member_label: document.getElementById('member_label').value.trim() || 'Member',
        custom_field_enabled: document.getElementById('custom_field_enabled').checked,
        custom_field_label: document.getElementById('custom_field_label').value.trim(),
        age_enabled: document.getElementById('age_enabled').checked,
        age_required: document.getElementById('age_required').checked,
        group_label: document.getElementById('group_label').value.trim() || 'Group',
        prefill_age_categories: document.getElementById('prefill_age_categories').checked,
        amount_format: document.getElementById('amount_format').value,
        payment_autofill: document.getElementById('payment_autofill').checked,
        custom_field_options: [],
        age_categories: []
    };
    
    // Gather custom field options
    document.querySelectorAll('.option-tag').forEach(function(tag) {
        const text = tag.textContent.replace('x', '').trim();
        if (text) {
            data.custom_field_options.push(text);
        }
    });
    
    // Gather age categories
    const rows = document.querySelectorAll('#ageTableBody tr');
    rows.forEach(function(row) {
        const nameInput = row.querySelector('.age-name');
        const minInput = row.querySelector('.age-min');
        const maxInput = row.querySelector('.age-max');
        const amountInput = row.querySelector('.age-amount');
        
        if (nameInput && nameInput.value.trim()) {
            data.age_categories.push({
                name: nameInput.value.trim(),
                min: parseInt(minInput.value) || 0,
                max: maxInput.value ? parseInt(maxInput.value) : null,
                amount: parseFloat(amountInput.value) || 0
            });
        }
    });
    
    try {
        const response = await fetch('/api/v1/settings/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showSuccess('Settings saved successfully');
            // Update localStorage with organization name
            if (data.organization_name) {
                localStorage.setItem('org_name', data.organization_name);
                localStorage.setItem('organization_name', data.organization_name);
            }
            settings = data;
        } else {
            const error = await response.json();
            showError(error.detail || 'Failed to save settings');
        }
    } catch (error) {
        showError('Failed to save settings');
    }
}

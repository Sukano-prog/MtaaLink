/* ============================================================
   MtaaLink - Modal Component
   ============================================================ */

import { showError, showSuccess, showToast, showWarning } from './toast.js';

let activeModal = null;
let modalResolve = null;

export function showModal(options) {
    return new Promise(function(resolve) {
        const {
            title,
            content,
            buttons = [],
            size = 'md',
            closeOnBackdrop = true,
            onClose = null,
            onShow = null
        } = options;
        
        if (activeModal) {
            closeModal();
        }
        
        modalResolve = resolve;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modalContainer';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        
        const sizeClasses = {
            'sm': 'modal-sm',
            'md': 'modal-md',
            'lg': 'modal-lg',
            'xl': 'modal-xl'
        };
        const sizeClass = sizeClasses[size] || 'modal-md';
        
        let buttonsHtml = '';
        buttons.forEach(function(btn, index) {
            const btnClass = btn.class || 'btn-outline';
            const btnLabel = btn.label || 'Close';
            buttonsHtml += `<button class="btn ${btnClass}" data-index="${index}">${btnLabel}</button>`;
        });
        
        modal.innerHTML = `
            <div class="modal ${sizeClass}">
                <div class="modal-header">
                    <h3>${title || 'Modal'}</h3>
                    <button class="modal-close" id="modalCloseBtn">&times;</button>
                </div>
                <div class="modal-body" id="modalBody">
                    ${content || ''}
                </div>
                ${buttonsHtml ? `<div class="modal-footer">${buttonsHtml}</div>` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        activeModal = modal;
        
        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                if (onClose) onClose();
                closeModal();
            });
        }
        
        if (closeOnBackdrop) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    if (onClose) onClose();
                    closeModal();
                }
            });
        }
        
        const footer = modal.querySelector('.modal-footer');
        if (footer) {
            footer.querySelectorAll('button').forEach(function(btn, index) {
                btn.addEventListener('click', function() {
                    const btnConfig = buttons[index];
                    if (btnConfig && btnConfig.onClick) {
                        btnConfig.onClick(function() {
                            closeModal();
                        });
                    } else {
                        if (onClose) onClose();
                        closeModal();
                    }
                });
            });
        }
        
        if (onShow) {
            try {
                onShow();
            } catch (error) {
                console.error('onShow error:', error);
            }
        }
        
        activeModal = modal;
    });
}

export function closeModal() {
    if (activeModal) {
        document.body.removeChild(activeModal);
        activeModal = null;
    }
    if (modalResolve) {
        modalResolve();
        modalResolve = null;
    }
}

export function showConfirm(options) {
    return showModal({
        title: options.title || 'Confirm',
        size: 'sm',
        content: `<p>${options.message || 'Are you sure?'}</p>`,
        buttons: [
            {
                label: options.cancelLabel || 'Cancel',
                class: 'btn-outline',
                onClick: function(done) {
                    if (options.onCancel) options.onCancel();
                    done();
                }
            },
            {
                label: options.confirmLabel || 'Confirm',
                class: options.confirmClass || 'btn-primary',
                onClick: function(done) {
                    if (options.onConfirm) {
                        options.onConfirm(done);
                    } else {
                        done();
                    }
                }
            }
        ]
    });
}

export function showFormModal(options) {
    let fieldsHtml = '';
    if (options.fields) {
        fieldsHtml = options.fields.map(function(field) {
            let html = `<div class="form-group">`;
            html += `<label for="${field.id}">${field.label}${field.required ? ' <span class="required">*</span>' : ''}</label>`;
            
            if (field.type === 'textarea') {
                html += `<textarea id="${field.id}" name="${field.id}" class="form-control" rows="${field.rows || 3}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>${field.value || ''}</textarea>`;
            } else if (field.type === 'combobox') {
                const optionsList = field.options ? field.options.map(function(opt) {
                    return `<option value="${opt.value}">${opt.label}</option>`;
                }).join('') : '';
                html += `<input type="text" id="${field.id}" name="${field.id}" class="form-control" value="${field.value || ''}" placeholder="${field.placeholder || 'Search...'}" ${field.required ? 'required' : ''} ${field.disabled ? 'disabled' : ''} list="${field.id}_datalist">`;
                html += `<datalist id="${field.id}_datalist">${optionsList}</datalist>`;
                if (field.helper) {
                    html += `<div class="form-helper">${field.helper}</div>`;
                }
            } else if (field.type === 'select') {
                html += `<select id="${field.id}" name="${field.id}" class="form-control form-select" ${field.disabled ? 'disabled' : ''}>`;
                if (field.options) {
                    field.options.forEach(function(opt) {
                        const selected = opt.value === field.value ? 'selected' : '';
                        html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
                    });
                }
                html += `</select>`;
            } else if (field.type === 'select_with_other') {
                const selectedValue = field.value || '';
                html += `<select id="${field.id}" name="${field.id}" class="form-control form-select" ${field.disabled ? 'disabled' : ''}>`;
                if (field.options) {
                    field.options.forEach(function(opt) {
                        const selected = opt.value === selectedValue ? 'selected' : '';
                        html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
                    });
                }
                html += `</select>`;
                html += `<div id="${field.id}_custom_container" style="margin-top:8px;display:${selectedValue === 'other' ? 'block' : 'none'};">`;
                html += `<input type="text" id="${field.id}_custom" class="form-control" placeholder="Type custom role..." value="">`;
                html += `</div>`;
                if (field.helper) {
                    html += `<div class="form-helper">${field.helper}</div>`;
                }
            } else if (field.type === 'range') {
                html += `<input type="range" id="${field.id}" name="${field.id}" class="form-control" min="${field.min || 0}" max="${field.max || 100}" value="${field.value || 0}" ${field.required ? 'required' : ''}>`;
            } else {
                html += `<input type="${field.type || 'text'}" id="${field.id}" name="${field.id}" class="form-control" value="${field.value || ''}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} ${field.disabled ? 'disabled' : ''}>`;
            }
            
            if (field.helper) {
                html += `<div class="form-helper">${field.helper}</div>`;
            }
            
            html += `</div>`;
            return html;
        }).join('');
    }
    
    return showModal({
        title: options.title || 'Form',
        size: options.size || 'md',
        content: `
            <form id="modalForm">
                ${fieldsHtml}
            </form>
        `,
        buttons: [
            {
                label: 'Cancel',
                class: 'btn-outline',
                onClick: function(done) {
                    if (options.onCancel) options.onCancel();
                    done();
                }
            },
            {
                label: options.submitLabel || 'Submit',
                class: 'btn-primary',
                onClick: function(done) {
                    const form = document.getElementById('modalForm');
                    if (!form) {
                        showError('Form not found');
                        return;
                    }
                    
                    const formData = new FormData(form);
                    const data = {};
                    formData.forEach(function(value, key) {
                        data[key] = value;
                    });
                    
                    const required = form.querySelectorAll('[required]');
                    let hasError = false;
                    required.forEach(function(f) {
                        if (!f.value || f.value.trim() === '') {
                            f.classList.add('error');
                            hasError = true;
                        } else {
                            f.classList.remove('error');
                        }
                    });
                    
                    if (hasError) {
                        showError('Please fill all required fields');
                        return;
                    }
                    
                    if (options.onSubmit) {
                        options.onSubmit(data, done);
                    } else {
                        done();
                    }
                }
            }
        ],
        onShow: function() {
            if (options.onShow) {
                options.onShow();
            }
        },
        onClose: options.onClose || null
    });
}

window.showModal = showModal;
window.closeModal = closeModal;
window.showConfirm = showConfirm;
window.showFormModal = showFormModal;

// Handle select_with_other show/hide after modal is shown
document.addEventListener('change', function(e) {
    if (e.target && e.target.id && e.target.id.endsWith('mfRole')) {
        const customContainer = document.getElementById('mfRole_custom_container');
        if (customContainer) {
            if (e.target.value === 'other') {
                customContainer.style.display = 'block';
            } else {
                customContainer.style.display = 'none';
            }
        }
    }
});

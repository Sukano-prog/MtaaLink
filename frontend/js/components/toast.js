/* ============================================================
   Management System - Toast Component (Fixed - Always Disappear)
   ============================================================ */

let activeToasts = [];

export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.error('Toast container not found');
        return;
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    
    activeToasts.push(toast);
    
    // Auto-remove after 3 seconds
    const timeoutId = setTimeout(function() {
        removeToast(toast);
    }, 3000);
    
    // Remove on click
    toast.addEventListener('click', function() {
        removeToast(toast);
        clearTimeout(timeoutId);
    });
    
    // Store timeout for cleanup
    toast._timeoutId = timeoutId;
}

function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    
    toast.classList.add('toast-exit');
    setTimeout(function() {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        const index = activeToasts.indexOf(toast);
        if (index !== -1) {
            activeToasts.splice(index, 1);
        }
        if (toast._timeoutId) {
            clearTimeout(toast._timeoutId);
        }
    }, 300);
}

export function showSuccess(message) {
    showToast(message, 'success');
}

export function showError(message) {
    showToast(message, 'error');
}

export function showInfo(message) {
    showToast(message, 'info');
}

export function showWarning(message) {
    showToast(message, 'warning');
}

export function clearToasts() {
    activeToasts.forEach(function(toast) {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        if (toast._timeoutId) {
            clearTimeout(toast._timeoutId);
        }
    });
    activeToasts = [];
}

window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showInfo = showInfo;
window.showWarning = showWarning;
window.clearToasts = clearToasts;

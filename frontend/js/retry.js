// Global retry function that works on any page
function retryAction(action) {
    if (!navigator.onLine) {
        showToast('You are still offline. Please connect to the internet.', 'warning');
        return;
    }
    
    // Execute the action based on current page
    if (typeof window[action] === 'function') {
        window[action]();
    } else {
        // Reload the page as fallback
        window.location.reload();
    }
}

// Add to window
window.retryAction = retryAction;

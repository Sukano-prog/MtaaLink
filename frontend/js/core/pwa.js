/* ============================================================
   Management System - PWA (Progressive Web App) Utilities
   ============================================================ */

let deferredPrompt = null;
let installButton = null;

// Check if the app is installed (standalone mode)
export function isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Show install prompt
export function showInstallPrompt() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choiceResult) {
            if (choiceResult.outcome === 'accepted') {
                console.log('[PWA] User accepted the install prompt');
                localStorage.setItem('pwa_installed', 'true');
                if (installButton) {
                    installButton.style.display = 'none';
                }
            } else {
                console.log('[PWA] User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    }
}

// Check if the app can be installed
export function canInstall() {
    return !!deferredPrompt && !isInstalled();
}

// Initialize PWA features
export function initPWA() {
    // Check if already installed
    if (isInstalled()) {
        console.log('[PWA] App is running in standalone mode');
        return;
    }
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        console.log('[PWA] App can be installed');
        
        // Show install button in UI
        showInstallButton();
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', function() {
        console.log('[PWA] App was installed successfully');
        localStorage.setItem('pwa_installed', 'true');
        if (installButton) {
            installButton.style.display = 'none';
        }
    });
    
    // Listen for online/offline status
    window.addEventListener('online', function() {
        document.body.classList.remove('offline');
        document.body.classList.add('online');
    });
    
    window.addEventListener('offline', function() {
        document.body.classList.remove('online');
        document.body.classList.add('offline');
    });
}

function showInstallButton() {
    // Create install button if it doesn't exist
    if (!installButton) {
        installButton = document.createElement('button');
        installButton.id = 'installAppBtn';
        installButton.className = 'btn btn-primary';
        installButton.style.position = 'fixed';
        installButton.style.bottom = '20px';
        installButton.style.left = '50%';
        installButton.style.transform = 'translateX(-50%)';
        installButton.style.zIndex = '9999';
        installButton.style.boxShadow = '0 4px 20px rgba(26, 115, 232, 0.4)';
        installButton.style.animation = 'pulse 2s infinite';
        installButton.textContent = '📱 Install App';
        installButton.addEventListener('click', showInstallPrompt);
        document.body.appendChild(installButton);
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(1.05); }
                100% { transform: translateX(-50%) scale(1); }
            }
            #installAppBtn {
                animation: pulse 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }
    installButton.style.display = 'block';
}

// Hide install button
export function hideInstallButton() {
    if (installButton) {
        installButton.style.display = 'none';
    }
}

export default {
    isInstalled,
    showInstallPrompt,
    canInstall,
    initPWA,
    hideInstallButton
};

// Add install button to header
export function addInstallButton() {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;
    
    // Check if already installed
    if (isInstalled()) {
        return;
    }
    
    // Check if button already exists
    if (document.getElementById('pwaInstallBtn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'pwaInstallBtn';
    btn.className = 'btn btn-sm btn-primary';
    btn.textContent = '📱 Install App';
    btn.style.marginRight = '8px';
    btn.addEventListener('click', showInstallPrompt);
    headerRight.appendChild(btn);
}

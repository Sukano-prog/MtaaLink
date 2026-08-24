/* ============================================================
   PWA Install Prompt - Custom in-app install button
   ============================================================ */

let deferredPrompt = null;
let isInstalled = false;

export function initPWAInstall() {
    // Check if app is already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
        isInstalled = true;
        return;
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        showInstallBanner();
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', function() {
        isInstalled = true;
        hideInstallBanner();
        showToast('App installed successfully! 🎉');
    });

    // Check if already installed (for iOS)
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        // iOS users need manual instructions
        showIOSInstructions();
    }
}

function showInstallBanner() {
    // Remove existing banner if any
    hideInstallBanner();

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #ffffff;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
        padding: 16px 20px;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-top: 3px solid #1A73E8;
        animation: slideUp 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        #pwa-install-banner .pwa-icon {
            font-size: 28px;
            flex-shrink: 0;
        }
        #pwa-install-banner .pwa-text {
            flex: 1;
            font-size: 14px;
            color: #1a1a2e;
        }
        #pwa-install-banner .pwa-text strong {
            display: block;
            font-size: 16px;
            margin-bottom: 2px;
        }
        #pwa-install-banner .pwa-btn {
            background: #1A73E8;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
        }
        #pwa-install-banner .pwa-btn:hover {
            background: #1557B0;
        }
        #pwa-install-banner .pwa-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #999;
            padding: 0 4px;
        }
        @media (max-width: 480px) {
            #pwa-install-banner {
                padding: 12px 16px;
                flex-wrap: wrap;
            }
            #pwa-install-banner .pwa-text {
                font-size: 13px;
                order: 2;
                flex: 1 1 100%;
                margin-top: 4px;
            }
            #pwa-install-banner .pwa-btn {
                padding: 8px 16px;
                font-size: 13px;
                order: 1;
            }
        }
    `;
    document.head.appendChild(style);

    banner.innerHTML = `
        <span class="pwa-icon">📱</span>
        <div class="pwa-text">
            <strong>Install App</strong>
            <span>Install the app for a better experience</span>
        </div>
        <button class="pwa-btn" id="pwa-install-btn">Install</button>
        <button class="pwa-close" id="pwa-close-btn">✕</button>
    `;

    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn').addEventListener('click', function() {
        installApp();
    });

    document.getElementById('pwa-close-btn').addEventListener('click', function() {
        hideInstallBanner();
        // Remember that user dismissed it
        localStorage.setItem('pwa-banner-dismissed', 'true');
    });
}

function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choiceResult) {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
            hideInstallBanner();
        });
    } else {
        // Fallback - show manual instructions
        showManualInstructions();
    }
}

function showManualInstructions() {
    const overlay = document.createElement('div');
    overlay.id = 'pwa-manual-install';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 400px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        text-align: center;
        position: relative;
    `;

    const isIOS = navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad');
    const instructions = isIOS ? `
        <p>Tap the <strong>Share</strong> button (box with arrow) at the bottom of the screen, then tap <strong>Add to Home Screen</strong>.</p>
    ` : `
        <p>Tap the <strong>three-dot menu</strong> (⋮) in the top right corner, then tap <strong>Add to Home Screen</strong> or <strong>Install</strong>.</p>
    `;

    modal.innerHTML = `
        <button style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#999;">✕</button>
        <span style="font-size:48px;display:block;margin-bottom:12px;">📱</span>
        <h3 style="margin:0 0 8px 0;color:#1a1a2e;">Install App</h3>
        <p style="color:#666;margin-bottom:16px;font-size:14px;">${instructions}</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:12px;margin:8px 0;text-align:left;font-size:13px;color:#555;">
            <strong>Benefits:</strong>
            <ul style="margin:8px 0 0 0;padding-left:18px;">
                <li>Faster loading</li>
                <li>Works offline</li>
                <li>Full screen experience</li>
                <li>Home screen shortcut</li>
            </ul>
        </div>
        <button style="margin-top:16px;background:#1A73E8;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Got it</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('button').addEventListener('click', function() {
        overlay.remove();
    });
    overlay.querySelector('.pwa-close').addEventListener('click', function() {
        overlay.remove();
    });
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

function showIOSInstructions() {
    // iOS users - show a subtle hint in the UI
    const hint = document.createElement('div');
    hint.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 13px;
        z-index: 9999;
        max-width: 80%;
        text-align: center;
        opacity: 0;
        transition: opacity 0.5s ease;
        pointer-events: none;
    `;
    hint.textContent = '📱 Tap Share then Add to Home Screen';
    document.body.appendChild(hint);

    // Show after 3 seconds
    setTimeout(function() {
        hint.style.opacity = '1';
        setTimeout(function() {
            hint.style.opacity = '0';
            setTimeout(function() {
                hint.remove();
            }, 500);
        }, 5000);
    }, 3000);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #1a1a2e;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 99999;
        animation: slideUp 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.remove();
    }, 3000);
}

// Auto-init when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if banner was dismissed before
    if (localStorage.getItem('pwa-banner-dismissed') === 'true') {
        // Don't show automatically, but keep the install button in the UI
        return;
    }
    initPWAInstall();
});

// Add a manual install button to the app (can be called from anywhere)
export function showInstallPrompt() {
    if (isInstalled) {
        showToast('App is already installed!');
        return;
    }
    if (deferredPrompt) {
        installApp();
    } else {
        showManualInstructions();
    }
}

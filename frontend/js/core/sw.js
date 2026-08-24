/* ============================================================
   MtaaLink - Service Worker Registration
   ============================================================ */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    console.log('[SW] Browser supports Service Worker');

    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(function(registration) {
          console.log('[SW] Registered successfully:', registration.scope);
        })
        .catch(function(error) {
          console.error('[SW] Registration failed:', error);
        });
    });
  } else {
    console.log('[SW] Browser does not support Service Worker');
  }
}

export function isOnline() {
  return navigator.onLine;
}

export function listenToNetworkStatus(callback) {
  window.addEventListener('online', function() {
    console.log('[SW] Online');
    if (callback) callback(true);
  });

  window.addEventListener('offline', function() {
    console.log('[SW] Offline');
    if (callback) callback(false);
  });
}

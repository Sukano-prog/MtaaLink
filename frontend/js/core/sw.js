/* ============================================================
   MtaaLink - Service Worker Registration
   ============================================================ */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {

    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(function(registration) {
        })
        .catch(function(error) {
        });
    });
  } else {
  }
}

export function isOnline() {
  return navigator.onLine;
}

export function listenToNetworkStatus(callback) {
  window.addEventListener('online', function() {
    if (callback) callback(true);
  });

  window.addEventListener('offline', function() {
    if (callback) callback(false);
  });
}

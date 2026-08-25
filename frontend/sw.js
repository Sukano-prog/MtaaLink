/* Service Worker */
const CACHE_NAME = 'mtaalink-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/pages.css',
  '/js/core/api.js',
  '/js/core/router.js',
  '/js/core/store.js',
  '/js/core/sw.js',
  '/js/core/pwa.js',
  '/js/components/modal.js',
  '/js/components/toast.js',
  '/js/components/searchable_select.js',
  '/js/pages/login.js',
  '/js/pages/register.js',
  '/js/pages/dashboard.js',
  '/js/pages/members.js',
  '/js/pages/groups.js',
  '/js/pages/meetings.js',
  '/js/pages/meeting_detail.js',
  '/js/pages/contributions.js',
  '/js/pages/contribution_types.js',
  '/js/pages/announcements.js',
  '/js/pages/reports.js',
  '/js/pages/projects.js',
  '/js/pages/events.js',
  '/js/pages/expenses.js',
  '/js/pages/settings.js'
];

self.addEventListener('install', function(event) {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching assets');
      return cache.addAll(STATIC_ASSETS).catch(function(err) {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    }).then(function() {
      console.log('[SW] Install complete');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key !== CACHE_NAME) {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(function() {
      console.log('[SW] Activate complete');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== location.origin) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    return;
  }

  if (url.pathname.startsWith('/icons/')) {
    return;
  }

  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request).then(function(response) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, response.clone());
          return response;
        });
      }).catch(function() {
        return caches.match(request).then(function(cached) {
          return cached || caches.match('/offline.html');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function(response) {
      if (response) {
        return response;
      }
      return fetch(request).then(function(networkResponse) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      });
    }).catch(function() {
      return new Response('Network error', { status: 503 });
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Add API caching
self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(request.url);

  // Cache API responses
  if (url.pathname.startsWith('/api/v1/') && request.method === 'GET') {
    event.respondWith(
      fetch(request).then(function(response) {
        // Cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open('api-cache').then(function(cache) {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Return cached response when offline
        return caches.match(request);
      })
    );
    return;
  }
});

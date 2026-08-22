const CACHE_NAME = 'babi-bakery-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/produits.html',
  '/cart.html',
  '/checkout.html',
  '/suivi.html',
  '/fidelite.html',
  '/contact.html',
  '/apropos.html',
  '/caissiere.html',
  '/css/global.css',
  '/css/index.css',
  '/css/produits.css',
  '/css/caissiere.css',
  '/js/cart.js',
  '/js/cart_actions.js',
  '/js/products.js',
  '/js/auth.js',
  '/js/caissiere.js',
  '/assets/logo.png',
  '/assets/scooter_livraison.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Caching assets warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Safe Fetch Handler
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NEVER intercept or cache dynamic API requests or third-party CDNs
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.startsWith('api.') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('tailwindcss') ||
    !url.protocol.startsWith('http')
  ) {
    return;
  }

  const isHtml = event.request.mode === 'navigate' || 
                 (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            try {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone).catch(() => {});
              });
            } catch (_) {}
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match('/index.html')))
    );
    return;
  }

  // Stale-While-Revalidate for local static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            try {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone).catch(() => {});
              });
            } catch (_) {}
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});


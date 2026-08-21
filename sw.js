const CACHE_NAME = 'babi-bakery-v6';
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
  '/css/global.css',
  '/css/index.css',
  '/css/produits.css',
  '/js/cart.js',
  '/js/cart_actions.js',
  '/js/products.js',
  '/js/auth.js',
  '/assets/logo.png',
  '/assets/scooter_livraison.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
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

// Network-First pour HTML, Stale-While-Revalidate pour le reste
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const isHtml = event.request.mode === 'navigate' || 
                 (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

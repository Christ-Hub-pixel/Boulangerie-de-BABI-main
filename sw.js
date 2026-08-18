const CACHE_NAME = 'babi-bakery-v1';
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

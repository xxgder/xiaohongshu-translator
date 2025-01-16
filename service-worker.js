const CACHE_NAME = 'translator-v1';
const urlsToCache = [
  '/',
  '/test.html',
  '/css/style.css',
  '/js/translator.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
}); 
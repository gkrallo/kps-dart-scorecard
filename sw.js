/* ==========================================================================
   sw.js - service worker: gör att appen startar direkt och fungerar utan nät.

   VIKTIGT: höj CACHE_VERSION varje gång du publicerar en ändring, annars
   kan telefonerna fortsätta använda den gamla versionen.
   ========================================================================== */
var CACHE_VERSION = 'dartkoll-v1.0.0';

var FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/config.js',
  './js/storage.js',
  './js/sound.js',
  './js/engine/segments.js',
  './js/engine/x01.js',
  './js/engine/farfar.js',
  './js/engine/match.js',
  './js/stats.js',
  './js/ui/dom.js',
  './js/ui/setup.js',
  './js/ui/game.js',
  './js/ui/result.js',
  './js/ui/history.js',
  './js/ui/modals.js',
  './js/app.js',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(function (cache) {
        return cache.addAll(FILES);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key !== CACHE_VERSION) return caches.delete(key);
            return null;
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

/* Cache first: appen ska starta lika snabbt utan nät som med. Nya versioner
   hämtas i bakgrunden och används nästa gång appen startas om. */
self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(function (cached) {
      var network = fetch(request)
        .then(function (response) {
          if (response && response.status === 200 && response.type === 'basic') {
            var copy = response.clone();
            caches.open(CACHE_VERSION).then(function (cache) {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          return cached || caches.match('./index.html');
        });
      return cached || network;
    })
  );
});

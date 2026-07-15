// EP Medical Pre-Plan — Service Worker v1.0
const CACHE = 'ep-medical-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Never cache the main HTML — always fetch fresh
  if (url.includes('index.html') || url.endsWith('/') || url.endsWith('/ep/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // External APIs — network only, no cache
  if (url.includes('nominatim.openstreetmap.org') ||
      url.includes('api.open-meteo.com') ||
      url.includes('router.project-osrm.org') ||
      url.includes('api.weather.gov')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response('{}', { headers: { 'Content-Type': 'application/json' }});
      })
    );
    return;
  }

  // Everything else — network first, cache fallback (icons, manifest)
  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).then(function(response) {
      return caches.open(CACHE).then(function(cache) {
        cache.put(e.request, response.clone());
        return response;
      });
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});

// GHS Peer Review Assessment Platform — Service Worker
// Caches the app shell for offline use
const CACHE_NAME = 'ghs-peer-review-v1';
const FIREBASE_CDN = 'https://www.gstatic.com/firebasejs/';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['./index.html'])
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Always network-first for Firebase API calls
  if (url.includes('firebaseio.com') || url.includes('googleapis.com') || url.includes('identitytoolkit')) {
    return;
  }
  // Cache-first for Firebase CDN (SDK files)
  if (url.includes(FIREBASE_CDN)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }
  // Cache-first for the app shell (index.html)
  if (url.includes('index.html') || e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(cached => cached || fetch(e.request))
    );
    return;
  }
});

const CACHE = 'huastecos-v3';
self.addEventListener('install', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('script.google.com')) return;
  if (e.request.method !== 'GET') return;
  // La página siempre de la red para que no se quede vieja
  if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('Huastecos.FC')) {
    e.respondWith(fetch(e.request).then(res => {
      if (res.ok) { const c = res.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)); }
      return res;
    }).catch(() => caches.match(e.request)));
    return;
  }
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    }));
  }
});

/* Service worker: la app funciona sin internet tras la primera visita.
   Sube el número de CACHE al publicar cambios. */
const CACHE = 'helena-v1';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/data.js', 'js/game.js', 'js/main.js',
  'assets/helena.png', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === location.origin;
  const net = () => fetch(e.request).then(res => {
    if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return res;
  });
  e.respondWith(same
    ? net().catch(() => caches.match(e.request).then(h => h || caches.match('index.html')))   // local: red primero
    : caches.match(e.request).then(h => h || net()));                                          // Phaser (CDN): caché primero
});

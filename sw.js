// Service worker de Mis Finanzas v2.
// Primero internet (siempre la versión más nueva); sin conexión o si tarda más de 4 s, la copia guardada.
// Nunca toca tus datos (localStorage): solo los archivos de la app.
const VERSION = '2.0';
const CACHE = 'finanzas-' + VERSION;
const FILES = ['./', './index.html', './styles.css', './app.js', './manifest.json', './version.json',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('finanzas-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const withTimeout = (p, ms) => new Promise((ok, fail) => { const t = setTimeout(() => fail(new Error('timeout')), ms); p.then(v => { clearTimeout(t); ok(v); }, err => { clearTimeout(t); fail(err); }); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const url = new URL(req.url); url.search = '';
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await withTimeout(fetch(new Request(url.href, { cache: 'no-cache' })), 4000);
      if (res && res.ok) cache.put(url.href, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(url.href) || (req.mode === 'navigate' ? await cache.match('./index.html') || await cache.match('./') : null);
      return hit || Response.error();
    }
  })());
});

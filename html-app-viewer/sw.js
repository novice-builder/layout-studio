// Offline shell for the HTML Home Screen app viewer.
const CACHE_NAME = 'html-home-app-viewer-shell-v2';
const SHELL_URL = new URL('./index.html', self.location.href).href;
const SHELL_PATH = new URL(SHELL_URL).pathname;
const ROOT_PATH = new URL('./', self.location.href).pathname;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Bypass an older HTTP cache when installing a new service worker.
    await cache.add(new Request(SHELL_URL, {cache: 'reload'}));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('html-home-app-viewer-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.mode !== 'navigate' || url.origin !== self.location.origin ||
      (url.pathname !== SHELL_PATH && url.pathname !== ROOT_PATH)) return;

  event.respondWith((async () => {
    try {
      // Load the latest viewer code online, but retain the last good shell offline.
      const response = await fetch(request, {cache: 'no-store'});
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(SHELL_URL, copy)).catch(() => {}));
      }
      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(SHELL_URL)) || Response.error();
    }
  })());
});

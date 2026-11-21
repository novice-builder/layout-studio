// Optional offline shell for the single-file HTML Home Screen viewer.
const CACHE_NAME = 'html-home-app-viewer-shell-v1';
const SHELL_URL = new URL('./index.html', self.location.href).href;
const ROOT_URL = new URL('./', self.location.href).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.add(SHELL_URL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Do not intercept other HTML applications or unrelated pages in the same repo.
  if (request.mode !== 'navigate' || url.origin !== self.location.origin || (url.pathname !== new URL(SHELL_URL).pathname && url.pathname !== new URL(ROOT_URL).pathname)) return;
  event.respondWith(fetch(request).catch(async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(SHELL_URL)) || Response.error();
  }));
});

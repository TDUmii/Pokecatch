/* Relative URLs keep this worker scoped correctly on GitHub project Pages. */
const CACHE_PREFIX = 'pokecatch-personal-';
const CACHE = CACHE_PREFIX + '__BUILD_VERSION__';
const base = self.registration.scope;
const urlFor = path => new URL(path, base).href;
const entries = data => (Array.isArray(data) ? data : data.files || data.assets || []).map(item => typeof item === 'string' ? item : item.path || item.url);
async function manifest(path) {
  const response = await fetch(urlFor(path), { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Cannot load ${path}: ${response.status}`);
  return entries(await response.json());
}
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll((await manifest('shell-manifest.json')).map(urlFor));
  await cache.add(urlFor('shell-manifest.json'));
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) {
    if (name.startsWith(CACHE_PREFIX) && name !== CACHE) await caches.delete(name);
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(base)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(event.request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type !== 'opaque') await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') {
        const page = await cache.match(urlFor('index.html'));
        if (page) return page;
      }
      throw error;
    }
  })());
});
let download;
self.addEventListener('message', event => {
  if (event.data?.type === 'CHECK_OFFLINE') {
    event.waitUntil(checkOffline());
    return;
  }
  if (event.data?.type !== 'DOWNLOAD_OFFLINE') return;
  event.waitUntil(download || (download = downloadAll().finally(() => { download = null; })));
});
async function checkOffline() {
  let done = 0, total = 0, failed = 0;
  try {
    const cache = await caches.open(CACHE);
    const shell = await cache.match(urlFor('shell-manifest.json'));
    const assets = await cache.match(urlFor('assets-manifest.json'));
    if (!shell || !assets) throw new Error('Missing cached manifests');
    const paths = [...new Set([...entries(await shell.json()), ...entries(await assets.json())])];
    total = paths.length;
    let next = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (next < paths.length) {
        if (await cache.match(urlFor(paths[next++]), { ignoreSearch: true })) done++;
        else failed++;
      }
    }));
    if (!total) failed++;
  } catch { failed++; }
  await broadcast({ type: 'OFFLINE_CHECK', done, total, failed });
}
async function broadcast(message) {
  for (const client of await self.clients.matchAll({ includeUncontrolled: true })) client.postMessage(message);
}
async function downloadAll() {
  let done = 0, total = 0, failed = 0;
  try {
    const paths = [...new Set([...(await manifest('shell-manifest.json')), ...(await manifest('assets-manifest.json'))])];
    total = paths.length;
    const cache = await caches.open(CACHE);
    let next = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (next < paths.length) {
        const url = urlFor(paths[next++]);
        try {
          if (!await cache.match(url, { ignoreSearch: true })) {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            await cache.put(url, response);
          }
          done++;
        } catch { failed++; }
        await broadcast({ type: 'OFFLINE_PROGRESS', done, total, failed });
      }
    }));
  } catch { failed++; }
  await broadcast({ type: failed ? 'OFFLINE_FAILED' : 'OFFLINE_READY', done, total, failed });
}

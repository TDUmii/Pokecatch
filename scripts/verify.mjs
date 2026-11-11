import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..', 'dist');
const parseEntries = data => (Array.isArray(data) ? data : data.files || data.assets || []).map(item => typeof item === 'string' ? item : item.path || item.url);
const shell = parseEntries(JSON.parse(await readFile(join(root, 'shell-manifest.json'), 'utf8')));
const assets = parseEntries(JSON.parse(await readFile(join(root, 'assets-manifest.json'), 'utf8')));
assert(shell.includes('index.html') && shell.includes('offline.js'), 'Missing application shell');
async function walk(dir) {
  const all = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    all.push(...(entry.isDirectory() ? await walk(path) : [path]));
  }
  return all;
}
for (const path of [...shell, ...assets]) {
  assert(typeof path === 'string' && !path.startsWith('/') && !path.includes('..') && !path.includes('://'), `Unsafe manifest path: ${path}`);
  assert((await stat(join(root, path.split('?')[0]))).isFile(), `Missing manifest file: ${path}`);
}
const files = await walk(root);
for (const path of files) {
  assert((await stat(path)).size < 100 * 1024 * 1024, `File exceeds GitHub limit: ${path}`);
  if (extname(path) === '.js') execFileSync(process.execPath, ['--check', path], { stdio: 'pipe' });
  if (!/\.(png|gif|webp|jpe?g|mp3|ogg|wav|woff2?|mp4|webm)$/i.test(path)) continue;
  const bytes = await readFile(path);
  const prefix = bytes.subarray(0, 32).toString('latin1');
  assert(!/^\s*(<!doctype|<html)/i.test(prefix), `HTML returned as asset: ${path}`);
  const ext = extname(path).toLowerCase();
  if (ext === '.png') assert(bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), `Invalid PNG: ${path}`);
  if (ext === '.gif') assert(/^GIF8[79]a/.test(prefix), `Invalid GIF: ${path}`);
  if (ext === '.webp') assert(prefix.startsWith('RIFF') && prefix.slice(8,12) === 'WEBP', `Invalid WebP: ${path}`);
  if (/^\.jpe?g$/.test(ext)) assert(bytes[0] === 255 && bytes[1] === 216, `Invalid JPEG: ${path}`);
  if (ext === '.ogg') assert(prefix.startsWith('OggS'), `Invalid Ogg: ${path}`);
  if (ext === '.wav') assert(prefix.startsWith('RIFF') && prefix.slice(8,12) === 'WAVE', `Invalid WAV: ${path}`);
  if (ext === '.woff') assert(prefix.startsWith('wOFF'), `Invalid WOFF: ${path}`);
  if (ext === '.woff2') assert(prefix.startsWith('wOF2'), `Invalid WOFF2: ${path}`);
  if (ext === '.mp4') assert(prefix.slice(4,8) === 'ftyp', `Invalid MP4: ${path}`);
  if (ext === '.webm') assert(bytes.subarray(0,4).equals(Buffer.from([26,69,223,163])), `Invalid WebM: ${path}`);
  if (ext === '.mp3') assert(prefix.startsWith('ID3') || (bytes[0] === 255 && (bytes[1] & 224) === 224), `Invalid MP3: ${path}`);
}

// Exercise the shipped worker with native Response objects and an in-memory Cache API.
const handlers = {}, messages = [], stored = new Map();
let active = 0, maximum = 0, fail = true, requested = [];
const scope = 'https://example.test/Pokecatch/';
const key = value => new URL(typeof value === 'string' ? value : value.url, scope).href.split('?')[0];
const cache = {
  match: async value => stored.get(key(value))?.clone(),
  put: async (value, response) => { stored.set(key(value), response.clone()); },
  add: async value => cache.put(value, await fetchMock(value)),
  addAll: async values => { for (const value of values) await cache.add(value); }
};
async function fetchMock(value) {
  const url = key(value); requested.push(url);
  if (url.endsWith('shell-manifest.json')) return Response.json({ files: ['index.html', 'offline.js', 'assets-manifest.json'] });
  if (url.endsWith('assets-manifest.json')) return Response.json({ files: ['assets/a.png', 'assets/b.png', 'assets/c.png', 'assets/d.png', 'assets/e.png'] });
  active++; maximum = Math.max(maximum, active);
  await new Promise(resolve => setTimeout(resolve, 1)); active--;
  return new Response('test', { status: fail && url.endsWith('e.png') ? 503 : 200 });
}
const self = { registration:{ scope }, location:{ origin:'https://example.test' }, addEventListener:(name, fn) => { handlers[name] = fn; }, skipWaiting:async()=>{}, clients:{ claim:async()=>{}, matchAll:async()=>[{postMessage: message => messages.push(message)}] } };
const removedCaches = [];
vm.runInNewContext(await readFile(join(root, 'sw.js'), 'utf8'), { self, URL, fetch:fetchMock, caches:{open:async()=>cache, keys:async()=>['pokecatch-personal-old', 'unrelated-cache'], delete:async name => { removedCaches.push(name); return true; }}, Response, Set, Promise });
async function trigger(name, extra = {}) {
  let pending;
  handlers[name]({ ...extra, waitUntil: promise => { pending = promise; }, respondWith:promise => { pending = promise; } });
  return await pending;
}
await trigger('install');
await trigger('activate');
assert.deepEqual(removedCaches, ['pokecatch-personal-old'], 'Activation removed unrelated cache');
requested = [];
await trigger('message', { data:{type:'CHECK_OFFLINE'} });
assert.equal(messages.at(-1).type, 'OFFLINE_CHECK');
assert.equal(messages.at(-1).done, 3);
assert.equal(messages.at(-1).failed, 5);
assert.equal(requested.length, 0, 'Readiness check used the network');
await trigger('message', { data:{type:'DOWNLOAD_OFFLINE'} });
assert.equal(messages.at(-1).type, 'OFFLINE_FAILED');
assert.equal(messages.at(-1).failed, 1);
assert(maximum <= 4, 'Download concurrency exceeded four');
assert(requested.every(url => url.startsWith(scope)), 'Worker escaped project path');
requested = []; fail = false;
await trigger('message', { data:{type:'DOWNLOAD_OFFLINE'} });
assert.equal(messages.at(-1).type, 'OFFLINE_READY');
assert.equal(messages.at(-1).done, 8);
assert.equal(requested.filter(url => url.includes('/assets/')).length, 1, 'Retry fetched already cached assets');
requested = [];
await trigger('message', { data:{type:'CHECK_OFFLINE'} });
assert.equal(messages.at(-1).failed, 0);
assert.equal(messages.at(-1).done, messages.at(-1).total);
assert.equal(messages.at(-1).total, 8);
assert.equal(requested.length, 0, 'Completed readiness check used the network');
const cached = await trigger('fetch', {request:new Request(scope + 'assets/a.png?v=1')});
assert.equal(await cached.text(), 'test');
console.log(`Verified ${files.length} packaged files, ${assets.length} assets; offline failure/retry, concurrency, project scope and cache checks passed.`);
await import('./verify-localization.mjs');

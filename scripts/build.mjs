import { mkdir, readdir, copyFile, stat, writeFile, rm } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const files = [];
async function copy(path) {
  const source = join(root, path);
  const info = await stat(source).catch(() => null);
  if (!info) return;
  if (info.isDirectory()) {
    for (const name of await readdir(source)) await copy(join(path, name));
  } else {
    await mkdir(resolve(out, path, '..'), { recursive: true });
    await copyFile(source, join(out, path));
    files.push(path.replaceAll('\\', '/'));
  }
}
for (const path of ['index.html', 'boot.js', 'offline.js', 'offline.css', 'bundle', 'assets', 'intros', 'icons', 'manifest.webmanifest', 'sw.js', 'assets-manifest.json', '.nojekyll']) await copy(path);
for (const required of ['index.html', 'boot.js', 'offline.js', 'offline.css', 'assets-manifest.json']) {
  if (!files.includes(required)) throw new Error(`Missing required game file: ${required}`);
}
const shell = files.filter(path => (!path.startsWith('assets/') && !path.startsWith('intros/')) || /^assets\/fonts\/BeVietnamPro-.*\.ttf$/.test(path));
const hash = createHash('sha256');
for (const path of shell.filter(path => path !== 'sw.js').sort()) {
  hash.update(path);
  hash.update(await readFile(join(out, path)));
}
const version = hash.digest('hex').slice(0, 16);
const workerPath = join(out, 'sw.js');
await writeFile(workerPath, (await readFile(workerPath, 'utf8')).replace('__BUILD_VERSION__', version));
await writeFile(join(out, 'shell-manifest.json'), JSON.stringify({ files: shell }, null, 2));
console.log(`Built ${files.length} files into ${relative(root, out)}; shell has ${shell.length} files.`);

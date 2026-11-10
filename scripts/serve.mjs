import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(process.argv[2] || 'dist');
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.svg':'image/svg+xml', '.webp':'image/webp', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.wav':'audio/wav', '.mp4':'video/mp4', '.webm':'video/webm', '.woff':'font/woff', '.woff2':'font/woff2' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let path = resolve(root, '.' + pathname);
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
    res.end(data);
  } catch { res.writeHead(404, { 'Content-Type':'text/plain' }).end('Not found'); }
}).listen(port, '0.0.0.0', () => console.log(`Pokecatch: http://localhost:${port} (root ${root})`));

// Local preview: serves public/ and runs the form function without sending anything.
//   node dev/server.mjs        → http://localhost:4180
// tools/shot.mjs imports startServer() to get a private copy on a free port.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8',
};

// The form function is optional until it exists; preview messages never leave this Mac.
async function formFunction() {
  try {
    process.env.CONTACT_TO = 'dev@example.test';
    const realFetch = globalThis.fetch;
    globalThis.fetch = (url, init) => String(url).startsWith('https://formsubmit.co/')
      ? (console.log('preview only, not sent:', init?.body), Promise.resolve(Response.json({ success: 'true' })))
      : realFetch(url, init);
    return (await import('../api/contact.js')).POST;
  } catch { return null; }
}

export async function startServer(port = 4180) {
  const functions = { '/api/contact': { POST: await formFunction() } };
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://local');
    const run = Object.hasOwn(functions, pathname) && ['GET', 'POST'].includes(req.method) ? functions[pathname][req.method] : null;
    if (pathname === '/api/contact' && req.method === 'POST' && !run) return res.writeHead(404).end('No form function yet');
    if (run) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const out = await run(new Request(new URL(req.url, 'http://local'), { method: req.method, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined }));
      return res.writeHead(out.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(await out.text());
    }
    const path = normalize(decodeURIComponent(pathname));
    if (path.includes('..')) return res.writeHead(400).end('Bad path');
    for (const file of [path, join(path, 'index.html')]) {
      try {
        const full = join(root, file);
        const info = await stat(full);
        if (!info.isFile()) continue;
        const type = types[extname(file).toLowerCase()] ?? 'application/octet-stream';
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
        if (range) { // video needs byte ranges to seek
          const start = range[1] ? Number(range[1]) : 0;
          const end = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
          const body = (await readFile(full)).subarray(start, end + 1);
          return res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': body.length }).end(body);
        }
        return res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' }).end(await readFile(full));
      } catch {}
    }
    // A page that does not exist gets public/404.html, as it will on the host; any other missing file a plain line.
    const notBuilt = ['', '.html'].includes(extname(path).toLowerCase()) ? await readFile(join(root, '404.html')).catch(() => null) : null;
    if (notBuilt) return res.writeHead(404, { 'Content-Type': types['.html'], 'Cache-Control': 'no-store' }).end(notBuilt);
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await startServer(Number(process.env.PORT) || 4180);
  console.log(`http://localhost:${server.address().port}`);
}

// Local render server (same origin for the stage and the app, so the stage can call the app's
// window.__seek(t) directly):
//   /__stage/*  -> video/stage/
//   anything else -> web/out/ (static export), or, with --proxy <url>, forwarded to a running `next dev`.
//   node scripts/server.mjs [--port 4100] [--proxy http://localhost:3100]
import http from "node:http";
import net from "node:net";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VIDEO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STAGE = path.join(VIDEO, "stage");
const WEB_OUT = path.resolve(VIDEO, "..", "web", "out");
const ASSETS = path.resolve(VIDEO, "..", "assets");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
};

function resolveStatic(base, urlPath) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const p = path.normalize(path.join(base, rel));
  if (!p.startsWith(base)) return null;
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(path.join(p, "index.html"))) return path.join(p, "index.html");
  if (existsSync(p + ".html")) return p + ".html";
  return null;
}

function send(res, file) {
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream", "Cache-Control": "no-store" });
  createReadStream(file).pipe(res);
}

export function startServer({ port = 0, host = "127.0.0.1", proxy = null, webOut = WEB_OUT } = {}) {
  const target = proxy ? new URL(proxy) : null;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://local");
    if (url.pathname === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    // official logos are read in place from assets/logos/ (local only, never copied or modified)
    if (url.pathname.startsWith("/__assets/")) return send(res, resolveStatic(ASSETS, url.pathname.slice("/__assets".length)));
    if (url.pathname.startsWith("/__stage/")) return send(res, resolveStatic(STAGE, url.pathname.slice("/__stage".length)));
    if (target) {
      const preq = http.request({ hostname: target.hostname, port: target.port, path: req.url, method: req.method, headers: { ...req.headers, host: target.host, ...(req.headers.origin ? { origin: target.origin } : {}) } }, (pres) => {
        res.writeHead(pres.statusCode ?? 502, pres.headers);
        pres.pipe(res);
      });
      preq.on("error", (e) => {
        res.writeHead(502, { "Content-Type": "text/plain" });
        res.end(String(e));
      });
      req.pipe(preq);
      return;
    }
    send(res, resolveStatic(webOut, url.pathname));
  });
  // `next dev` needs its HMR websocket before it hydrates: tunnel upgrades to the proxied server
  // (Host and Origin rewritten to the target: next dev rejects cross-origin dev requests)
  server.on("upgrade", (req, socket, head) => {
    if (!target) return socket.destroy();
    const up = net.connect(Number(target.port) || 80, target.hostname, () => {
      const h = [];
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const k = req.rawHeaders[i];
        h.push(`${k}: ${/^host$/i.test(k) ? target.host : /^origin$/i.test(k) ? target.origin : req.rawHeaders[i + 1]}`);
      }
      up.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${h.join("\r\n")}\r\n\r\n`);
      if (head?.length) up.write(head);
      up.pipe(socket);
      socket.pipe(up);
    });
    up.on("error", () => socket.destroy());
    socket.on("error", () => up.destroy());
  });
  return new Promise((resolve) =>
    server.listen(port, host, () => resolve({ port: server.address().port, close: () => new Promise((r) => server.close(r)) })),
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (k, d) => {
    const i = process.argv.indexOf(k);
    return i > 0 ? process.argv[i + 1] : d;
  };
  const s = await startServer({ port: Number(arg("--port", 4100)), proxy: arg("--proxy", null) });
  console.log(`stage: http://127.0.0.1:${s.port}/__stage/index.html   (add ?app=live for the real app scenes)`);
}

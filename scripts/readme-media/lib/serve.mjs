// A tiny static server for the exported client (client/out). Same idea as
// blog/scripts/serve.mjs, but it listens on a random free port so a capture
// never fights a dev server for :3000, and it knows the extra file types the
// desktop actually loads: fonts, music, the pdf.js worker, the PDFs in the
// library.
//
// `resolveFile` is exported on its own because the stage also answers the
// blog's address straight from blog/out through Playwright's router, and both
// should map a URL to a file the same way.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

export const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
  ".wasm": "application/wasm",
};

export function contentType(file) {
  return TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
}

async function isFile(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

/**
 * Maps a URL path onto a file under `root`, the way a static export expects:
 * the exact file, then `<path>.html` (Next writes `/foo` as `foo.html`), then
 * `<path>/index.html`. Returns null when nothing matches. Anything that would
 * climb out of `root` is treated as a miss rather than an error.
 */
export async function resolveFile(root, urlPath) {
  const base = resolve(root);
  let path;
  try {
    path = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const file = resolve(join(base, normalize(path)));
  if (file !== base && !file.startsWith(base + sep)) return null;

  const candidates = path.endsWith("/")
    ? [join(file, "index.html")]
    : [file, `${file}.html`, join(file, "index.html")];
  for (const c of candidates) {
    if (await isFile(c)) return c;
  }
  return null;
}

/** Starts the server and resolves once it's listening. */
export function serve(root) {
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://x");
    const file = await resolveFile(root, pathname);
    try {
      if (!file) throw new Error("miss");
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": contentType(file), "Cache-Control": "no-store" });
      res.end(body);
    } catch {
      const notFound = await resolveFile(root, "/404.html");
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      res.end(notFound ? await readFile(notFound) : "not found");
    }
  });

  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolvePromise({
        origin: `http://127.0.0.1:${port}`,
        root,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

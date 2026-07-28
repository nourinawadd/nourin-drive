// Copies the pdf.js worker out of node_modules into client/public/vendor/ so the
// Ereader can point GlobalWorkerOptions.workerSrc at a stable URL.
//
// pdf.js runs its parser in a Web Worker and refuses to load one from a
// different origin. Bundling it through Next is more trouble than it's worth
// (the worker is a self-contained script, not a module Next should trace), so
// we copy it to /vendor/ and load it from there — same trick as the Unity
// loader patch. Runs as part of `npm run gen`, so it stays in sync with
// whatever pdfjs-dist version is installed.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname, parse } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, "..", "public", "vendor");
const OUT_NAME = "pdf.worker.min.mjs";

// Newest naming first. v4/v5 ship .mjs; older builds only had .js.
const CANDIDATES = [
  join("build", "pdf.worker.min.mjs"),
  join("build", "pdf.worker.mjs"),
  join("build", "pdf.worker.min.js"),
  join("build", "pdf.worker.js"),
];

// This is an npm workspace, so pdfjs-dist hoists to the REPO ROOT's
// node_modules, not client/node_modules. Walk up until we find it rather than
// assuming either layout.
function findPackage(name) {
  let dir = here;
  for (;;) {
    const candidate = join(dir, "node_modules", name);
    if (existsSync(candidate)) return candidate;
    const parent = parse(dir).dir;
    if (!parent || parent === dir) return null;
    dir = parent;
  }
}

const PKG_DIR = findPackage("pdfjs-dist");
if (!PKG_DIR) {
  console.warn("[copy-pdf-worker] pdfjs-dist not installed — skipping");
  process.exit(0);
}

const hit = CANDIDATES.map((rel) => join(PKG_DIR, rel)).find((abs) => existsSync(abs));
if (!hit) {
  console.warn(`[copy-pdf-worker] no worker build found in ${PKG_DIR} — skipping`);
  process.exit(0);
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(hit, join(OUT_DIR, OUT_NAME));

let version = "unknown";
try {
  version = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8")).version;
} catch {
  // Version is only used for the log line; not worth failing the build over.
}
console.log(`[copy-pdf-worker] copied pdfjs-dist@${version} worker → public/vendor/${OUT_NAME}`);

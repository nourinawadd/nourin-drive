// Scans client/public/library/ for readable documents and (re)writes
// src/data/library.generated.ts with one entry per file. Runs automatically
// before `npm run dev` / `npm run build` (see the `gen` script), so you never
// edit the library list by hand — drop files in and they appear in the Ereader.
//
// Subfolders are shelves (the folder name is the shelf):
//     public/library/Poems/on leaving.md
//     public/library/Writings/notes on quiet.txt
//     public/library/Books/Franz Kafka - The Trial.pdf
// A file sitting at the top level lands on the "Library" shelf.
//
// Three formats, three ways of getting the metadata:
//   .md  — YAML-ish frontmatter (title, author, date, blurb, note); the rest of
//          the file is the document body.
//   .txt — the filename is the title. A leading number sets order and a
//          trailing (YYYY) / (YYYY-MM) sets the date, same as the gallery.
//   .pdf — "Author - Title.pdf". No " - " means the whole filename is the title.
//
// A PDF's filename can only carry so much, so anything richer goes in an
// optional sidecar named "<same base name>.meta.md" — frontmatter only:
//     ---
//     title: Meditations
//     author: Marcus Aurelius
//     blurb: Stoic notes, public domain.
//     note: Project Gutenberg edition
//     ---
// Sidecar values win over everything derived from the filename. `npm run
// add:doc` writes one for you whenever you give it more than the name can hold.
//
// Cover art is optional: put "<same base name>.cover.png" (or .jpg/.webp/…)
// next to the file. PDFs without one get their first page rendered as the
// thumbnail at runtime instead, so there's nothing to prepare.
//
// .md and .txt bodies are inlined into the generated file so text opens with no
// network round-trip. Anything over INLINE_LIMIT stays on disk and is fetched
// from `src` on open, so a novel-length .txt can't bloat the bundle.

import { readdirSync, writeFileSync, existsSync, mkdirSync, statSync, readFileSync, watch } from "node:fs";
import { join, dirname, parse } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const LIBRARY_DIR = join(here, "..", "public", "library");
const OUT_FILE = join(here, "..", "src", "data", "library.generated.ts");

const FORMAT_BY_EXT = { ".pdf": "pdf", ".md": "md", ".txt": "txt" };
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);
const DEFAULT_SHELF = "Library";
// Shelves are ordered by intent, not alphabetically — your own writing first.
const SHELF_ORDER = ["Poems", "Writings", "Books"];
const INLINE_LIMIT = 256 * 1024;

/** Shelves the wizard offers and the generator seeds on first run. */
export const SHELVES = SHELF_ORDER;

function ensureDirs() {
  if (!existsSync(LIBRARY_DIR)) mkdirSync(LIBRARY_DIR, { recursive: true });
  for (const shelf of SHELF_ORDER) {
    const dir = join(LIBRARY_DIR, shelf);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}

/** Every file under the library root, as path segments relative to it. */
function walk(dir, base = []) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...walk(abs, [...base, name]));
    else out.push([...base, name]);
  }
  return out;
}

// Frontmatter is `key: value` split on the first colon, so values keep theirs.
// Deliberately not a YAML parser — same constrained reader gen-projects uses.
function parseFrontmatter(raw) {
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1); // strip UTF-8 BOM
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf(":");
    if (idx === -1) continue;
    fm[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return { fm, body: m[2] ?? "" };
}

/** "01 - Jazz Night (2024)" → { title: "Jazz Night", order: 1, date: "2024" }. */
function refineTitle(raw) {
  let t = raw;
  let order = null;
  let date;
  const num = t.match(/^\s*(\d+)\s*[-.]?\s+(.*)$/);
  if (num && num[2]) {
    order = parseInt(num[1], 10);
    t = num[2];
  }
  const dm = t.match(/\((\d{4}(?:-\d{2})?)\)\s*$/);
  if (dm) {
    date = dm[1];
    t = t.slice(0, dm.index).trim();
  }
  t = t.replace(/_/g, " ").trim();
  return { title: t || raw, order, date };
}

function slug(s) {
  return s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "doc";
}

const encodePath = (parts) => "/library/" + parts.map(encodeURIComponent).join("/");

/**
 * First line of the body that reads like prose — used when no blurb was given.
 * Skips a repeat of the title, since text files usually open with their own
 * heading and "Title / Title" on the card tells you nothing.
 */
function firstLine(body, skipTitle) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const skip = skipTitle ? norm(skipTitle) : null;
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim().replace(/^#+\s*/, "");
    if (!t) continue;
    if (skip && norm(t) === skip) continue;
    return t.length > 140 ? `${t.slice(0, 137)}…` : t;
  }
  return undefined;
}

export function generate() {
  ensureDirs();

  const covers = new Map();   // "Books/Franz Kafka - The Trial" → path segments
  const sidecars = new Map(); // same key → parsed frontmatter
  const docFiles = [];

  for (const parts of walk(LIBRARY_DIR)) {
    const fileName = parts[parts.length - 1];
    const { name: nameNoExt, ext } = parse(fileName);
    const lower = ext.toLowerCase();
    const keyFor = (base) => [...parts.slice(0, -1), base].join("/");

    if (IMAGE_EXT.has(lower)) {
      // "<base>.cover.png" is art for "<base>.<anything>", keyed by folder+base.
      if (nameNoExt.toLowerCase().endsWith(".cover")) {
        covers.set(keyFor(nameNoExt.slice(0, -".cover".length)), parts);
      }
      continue;
    }
    // "<base>.meta.md" describes its neighbour — it is not itself a document.
    if (lower === ".md" && nameNoExt.toLowerCase().endsWith(".meta")) {
      const { fm } = parseFrontmatter(readFileSync(join(LIBRARY_DIR, ...parts), "utf8"));
      sidecars.set(keyFor(nameNoExt.slice(0, -".meta".length)), fm);
      continue;
    }
    if (!FORMAT_BY_EXT[lower]) continue;
    docFiles.push(parts);
  }

  const seen = new Set();
  const docs = [];

  for (const parts of docFiles) {
    const fileName = parts[parts.length - 1];
    const { name: nameNoExt, ext } = parse(fileName);
    const format = FORMAT_BY_EXT[ext.toLowerCase()];
    const shelf = parts.length > 1 ? parts[0] : DEFAULT_SHELF;
    const abs = join(LIBRARY_DIR, ...parts);

    let title;
    let author;
    let date;
    let blurb;
    let note;
    let order = null;
    let body;

    if (format === "md") {
      const raw = readFileSync(abs, "utf8");
      const { fm, body: md } = parseFrontmatter(raw);
      const fromName = refineTitle(nameNoExt);
      title = fm.title || fromName.title;
      author = fm.author || undefined;
      date = fm.date || fromName.date;
      blurb = fm.blurb || firstLine(md, title);
      note = fm.note || undefined;
      order = fm.order != null && fm.order !== "" && Number.isFinite(Number(fm.order))
        ? Number(fm.order)
        : fromName.order;
      body = md;
    } else if (format === "txt") {
      const raw = readFileSync(abs, "utf8");
      const fromName = refineTitle(nameNoExt);
      title = fromName.title;
      date = fromName.date;
      order = fromName.order;
      blurb = firstLine(raw, title);
      body = raw;
    } else {
      // PDF — "Author - Title.pdf", falling back to the whole filename.
      const dash = nameNoExt.indexOf(" - ");
      const authorRaw = dash !== -1 ? nameNoExt.slice(0, dash).trim() : "";
      const titleRaw = dash !== -1 ? nameNoExt.slice(dash + 3).trim() : nameNoExt;
      const fromName = refineTitle(titleRaw);
      title = fromName.title;
      author = authorRaw || undefined;
      date = fromName.date;
      order = fromName.order;
    }

    // A sidecar overrides whatever the filename or frontmatter implied — it's
    // the only place a PDF or .txt can say anything at all.
    const key = [...parts.slice(0, -1), nameNoExt].join("/");
    const meta = sidecars.get(key);
    if (meta) {
      if (meta.title) title = meta.title;
      if (meta.author) author = meta.author;
      if (meta.date) date = meta.date;
      if (meta.blurb) blurb = meta.blurb;
      if (meta.note) note = meta.note;
      if (meta.order != null && meta.order !== "" && Number.isFinite(Number(meta.order))) {
        order = Number(meta.order);
      }
    }

    let id = `${slug(shelf)}/${slug(title)}`;
    if (seen.has(id)) id = `${id}-${seen.size}`;
    seen.add(id);

    const coverParts = covers.get(key);
    const bytes = statSync(abs).size;

    docs.push({
      id,
      shelf,
      title,
      author,
      date,
      blurb,
      note,
      format,
      src: encodePath(parts),
      fileName,
      bytes,
      cover: coverParts ? encodePath(coverParts) : undefined,
      // Oversized text stays on disk; the reader fetches `src` instead.
      body: body != null && bytes <= INLINE_LIMIT ? body : undefined,
      _order: order,
      _file: parts.join("/"),
    });
  }

  // Shelves in SHELF_ORDER first (then any hand-made ones alphabetically), and
  // within a shelf: explicit order, then newest date, then filename.
  const shelfRank = (s) => {
    const i = SHELF_ORDER.indexOf(s);
    return i === -1 ? SHELF_ORDER.length : i;
  };
  docs.sort((a, b) => {
    const r = shelfRank(a.shelf) - shelfRank(b.shelf);
    if (r !== 0) return r;
    if (a.shelf !== b.shelf) return a.shelf.localeCompare(b.shelf);
    if (a._order != null && b._order != null && a._order !== b._order) return a._order - b._order;
    if (a._order != null) return -1;
    if (b._order != null) return 1;
    if (a.date && b.date && a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.date) return -1;
    if (b.date) return 1;
    return a._file.localeCompare(b._file, undefined, { numeric: true, sensitivity: "base" });
  });

  const rows = docs
    .map((d) => {
      const fields = [
        `id: ${JSON.stringify(d.id)}`,
        `shelf: ${JSON.stringify(d.shelf)}`,
        `title: ${JSON.stringify(d.title)}`,
      ];
      if (d.author) fields.push(`author: ${JSON.stringify(d.author)}`);
      if (d.date) fields.push(`date: ${JSON.stringify(d.date)}`);
      if (d.blurb) fields.push(`blurb: ${JSON.stringify(d.blurb)}`);
      if (d.note) fields.push(`note: ${JSON.stringify(d.note)}`);
      fields.push(`format: ${JSON.stringify(d.format)}`);
      fields.push(`src: ${JSON.stringify(d.src)}`);
      fields.push(`fileName: ${JSON.stringify(d.fileName)}`);
      fields.push(`bytes: ${d.bytes}`);
      if (d.cover) fields.push(`cover: ${JSON.stringify(d.cover)}`);
      if (d.body != null) fields.push(`body: ${JSON.stringify(d.body)}`);
      return `  { ${fields.join(", ")} },`;
    })
    .join("\n");

  const out = `// AUTO-GENERATED by scripts/gen-library.mjs — do not edit by hand.
// Drop documents into client/public/library/<Shelf>/ (or run \`npm run add:doc\`);
// this file is rewritten on the next \`npm run dev\` / \`npm run build\` (or
// \`npm run library\`).
import type { LibraryDoc } from "./library";

export const GENERATED_LIBRARY: LibraryDoc[] = [
${rows}
];
`;

  // Skip the write when nothing actually changed. writeFileSync always bumps
  // the mtime, which would make Next recompile on every dev start and on every
  // unrelated save while watching.
  const prev = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, "utf8") : null;
  if (prev === out) return docs.length;

  writeFileSync(OUT_FILE, out, "utf8");
  const inlined = docs.filter((d) => d.body != null).length;
  console.log(`[gen-library] wrote ${docs.length} document(s) to library.generated.ts (${inlined} inlined)`);
  return docs.length;
}

/**
 * Regenerate whenever anything under public/library/ changes, so editing a poem
 * updates the browser without a second command. The generated file lands in
 * src/, so Next's fast refresh takes it from there.
 */
function startWatching() {
  let timer = null;
  const rerun = () => {
    // Editors save in bursts (write a temp file, rename over the original), and
    // a rebuild per burst would thrash the dev server.
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        generate();
      } catch (err) {
        // A half-written file mid-save shouldn't take the watcher down.
        console.error(`[gen-library] regenerate failed: ${err.message}`);
      }
    }, 120);
  };

  watch(LIBRARY_DIR, { recursive: true }, rerun);
  console.log("[gen-library] watching public/library/ — edits regenerate automatically");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  generate();
  if (process.argv.includes("--watch")) startWatching();
}

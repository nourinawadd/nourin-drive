// Interactive "add something to read" wizard.  Run:  npm run add:doc
// (or pick "Poem / Writing / Book" from the `npm run add` menu - same code).
//
// Copies a .pdf / .md / .txt into client/public/library/<Shelf>/, writes the
// metadata the Ereader needs, and regenerates library.generated.ts. For poems
// you can also start from nothing: it writes an empty .md with the frontmatter
// filled in and tells you where to type.
//
// Metadata lands wherever the generator looks for it, so what you write here
// and what a hand-dropped file would need are the same thing:
//   .md  → frontmatter at the top of the file
//   .txt → the filename is the title
//   .pdf → the filename is "Author - Title.pdf"

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname, parse, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generate, SHELVES } from "./gen-library.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const LIBRARY_DIR = join(here, "..", "public", "library");

const ALLOWED_EXT = new Set([".pdf", ".md", ".txt"]);

const SHELF_CHOICES = [
  { shelf: "Poems", label: "Poem            → Poems shelf (.md or .txt)", mine: true },
  { shelf: "Writings", label: "Writing         → Writings shelf (essay, notes, prose)", mine: true },
  { shelf: "Books", label: "Book            → Books shelf (someone else's work)", mine: false },
  { shelf: null, label: "Other shelf     → name your own", mine: true },
];

/** Strip surrounding quotes - Windows "Copy as path" wraps them. */
function cleanPath(raw) {
  return raw.trim().replace(/^["']|["']$/g, "");
}

/** Filesystem-safe filename, keeping spaces and case (the title is the label). */
function safeName(s) {
  return s.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim() || "untitled";
}

/** Appends " 2", " 3"… until the name is free in `dir`. */
function uniqueName(dir, fileName) {
  if (!existsSync(dir)) return fileName;
  const taken = new Set(readdirSync(dir).map((f) => f.toLowerCase()));
  const { name, ext } = parse(fileName);
  let candidate = fileName;
  let i = 2;
  while (taken.has(candidate.toLowerCase())) candidate = `${name} ${i++}${ext}`;
  return candidate;
}

/**
 * Put the answers into the .md's frontmatter, replacing keys that are already
 * there rather than adding a second block.
 */
function withFrontmatter(raw, fields) {
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const existing = new Map();
  let body = raw;

  if (m) {
    body = m[2] ?? "";
    for (const line of m[1].split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const idx = t.indexOf(":");
      if (idx === -1) continue;
      existing.set(t.slice(0, idx).trim(), t.slice(idx + 1).trim());
    }
  }

  for (const [k, v] of Object.entries(fields)) {
    if (v) existing.set(k, v);
    else existing.delete(k);
  }

  const head = [...existing.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
  return `---\n${head}\n---\n\n${body.replace(/^\s*\n/, "")}`;
}

export async function addDoc(ask, askYesNo) {
  console.log("\n  Add to the library\n  ==================\n");
  SHELF_CHOICES.forEach((c, i) => console.log(`   ${i + 1}) ${c.label}`));
  console.log("");

  let choice = null;
  while (choice == null) {
    const k = parseInt(await ask("Choice number"), 10);
    if (k >= 1 && k <= SHELF_CHOICES.length) choice = SHELF_CHOICES[k - 1];
    else console.log("  Please enter a number from the list.");
  }

  let shelf = choice.shelf;
  if (!shelf) {
    shelf = safeName(await ask("Shelf name (becomes the folder and the filter chip)"));
    if (!shelf) { console.log("  A shelf name is required. Aborting."); return; }
  }
  const shelfDir = join(LIBRARY_DIR, shelf);

  // ── the file ────────────────────────────────────────────────────────
  const isBook = shelf === "Books";
  const prompt = isBook
    ? "Path to the PDF (drag it into the terminal)"
    : "Path to the file (.md/.txt/.pdf) - or blank to start a new empty .md";
  const sourceRaw = cleanPath(await ask(prompt));

  let ext;
  let source = null;
  if (sourceRaw) {
    source = resolve(sourceRaw);
    if (!existsSync(source) || !statSync(source).isFile()) {
      console.log(`  No file at ${source}. Aborting.`);
      return;
    }
    ext = parse(source).ext.toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      console.log(`  ${ext || "(no extension)"} isn't readable here - use .pdf, .md or .txt. Aborting.`);
      return;
    }
  } else {
    if (isBook) { console.log("  A book needs a PDF. Aborting."); return; }
    ext = ".md";
  }

  // ── metadata ────────────────────────────────────────────────────────
  const defaultTitle = source ? parse(source).name : "";
  const title = await ask("Title", defaultTitle);
  if (!title) { console.log("  A title is required. Aborting."); return; }

  let author = "";
  if (isBook) {
    author = await ask("Author (whose book this actually is)");
    if (!author) {
      console.log("  ! No author recorded. It's someone else's book - worth filling in.");
    }
  } else if (await askYesNo("Is this yours?", true)) {
    author = "";
  } else {
    author = await ask("Author");
  }

  const now = new Date();
  const defDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let date = await ask("Date (YYYY-MM, or blank)", defDate);
  if (date && !/^\d{4}(-\d{2})?$/.test(date)) {
    console.log(`  (using ${defDate}; '${date}' isn't YYYY-MM)`);
    date = defDate;
  }

  const blurb = await ask("One-line blurb for the card (optional)");
  const note = await ask("Note - edition, source, anything worth recording (optional)");

  // ── write it ────────────────────────────────────────────────────────
  mkdirSync(shelfDir, { recursive: true });

  // The filename carries the metadata for the formats that have nowhere else
  // to put it, so it follows the same convention a hand-dropped file would.
  const baseName =
    ext === ".pdf" && author ? `${safeName(author)} - ${safeName(title)}`
      : safeName(title);
  const fileName = uniqueName(shelfDir, `${baseName}${ext}`);
  const dest = join(shelfDir, fileName);

  let sidecar = null;
  if (ext === ".md") {
    // Markdown has its own frontmatter; no sidecar needed.
    const raw = source ? readFileSync(source, "utf8") : "";
    const seed = source ? raw : "Write here.\n";
    writeFileSync(dest, withFrontmatter(seed, { title, author, date, blurb, note }), "utf8");
  } else {
    copyFileSync(source, dest);
    // PDFs and .txt carry nothing but their filename, so anything else the
    // wizard collected goes in a "<base>.meta.md" sidecar beside the file.
    const extra = { title, author, date, blurb, note };
    const nameCarries = ext === ".pdf" && author ? ["title", "author"] : ["title"];
    for (const k of nameCarries) delete extra[k];
    if (Object.values(extra).some(Boolean)) {
      sidecar = `${parse(fileName).name}.meta.md`;
      writeFileSync(join(shelfDir, sidecar), withFrontmatter("", extra), "utf8");
    }
  }

  console.log(`\n  ✓ ${source ? "copied" : "created"} public/library/${shelf}/${fileName}`);
  if (sidecar) console.log(`  ✓ wrote public/library/${shelf}/${sidecar} (title/author live in the filename)`);
  generate();
  console.log(`  Shows in: Ereader → ${shelf} (and File Explorer → ${shelf}).`);
  if (!source) console.log(`  Open it and write: client/public/library/${shelf}/${fileName}`);
  console.log("  Run `npm run dev` (or refresh if it's already running) to see it.\n");
}

/** Shelf names the wizard offers, for the sibling wizard's help text. */
export const LIBRARY_SHELVES = SHELVES;

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { createPrompt } = await import("./prompt.mjs");
  const { ask, askYesNo, close } = createPrompt();
  try {
    await addDoc(ask, askYesNo);
  } finally {
    close();
  }
}

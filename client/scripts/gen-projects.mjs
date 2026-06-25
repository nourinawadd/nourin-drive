// Scans client/content/projects/*.md (one file per structured project) and
// (re)writes two data files:
//   src/data/projects.generated.ts  → website sections (Explorer volumes, Games)
//   src/data/cv.generated.ts        → About/CV window (Software + Game Projects)
//
// Runs automatically before `npm run dev` / `npm run build` (via the client
// `gen` script) and is called by the `npm run add` wizard, so you never edit the
// generated files by hand — add/edit a content file and it propagates.
//
// File format (frontmatter + body):
//   ---
//   type: website | api | game | software | blog
//   name: My Project
//   date: 2025-12          (YYYY-MM, optional but recommended — sorts newest first)
//   url:  https://...      (live / play link; CV link falls back to repo)
//   repo: https://...      (optional)
//   stack: Node · Mongo    (optional)
//   cv: true               (show on the About/CV window; default true)
//   ---
//   One-line blurb (shown in the section and as the CV subtitle).
//
//   - CV bullet one
//   - CV bullet two
//
// type → where it appears:
//   website  → Explorer "Websites"  + CV "Software Projects"
//   api      → Explorer "APIs"       + CV "Software Projects"
//   game     → Games app             + CV "Game Projects"
//   software → (no section, CV only) + CV "Software Projects"
//   blog     → Explorer "Blog"

import { readdirSync, writeFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname, parse } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(here, "..", "content", "projects");
const PROJECTS_OUT = join(here, "..", "src", "data", "projects.generated.ts");
const CV_OUT = join(here, "..", "src", "data", "cv.generated.ts");

const TYPE_TO_CATEGORY = { website: "websites", api: "apis", game: "games", blog: "blog" };
const CV_SOFTWARE_TYPES = new Set(["website", "api", "software"]);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dateLabel(date) {
  if (!date) return undefined;
  const m = /^(\d{4})-(\d{2})$/.exec(date);
  if (!m) return date;
  const i = parseInt(m[2], 10) - 1;
  return MONTHS[i] ? `${MONTHS[i]} ${m[1]}` : date;
}

// Constrained reader: frontmatter is `key: value` (split on the first colon, so
// URLs keep theirs); the body's first paragraph is the blurb and `- ` lines are
// the CV bullets.
function parseFile(raw) {
  const fm = {};
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1); // strip UTF-8 BOM
  let body = raw;
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (m) {
    body = m[2] || "";
    for (const line of m[1].split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const idx = t.indexOf(":");
      if (idx === -1) continue;
      const key = t.slice(0, idx).trim();
      let val = t.slice(idx + 1).trim();
      if (val === "true") val = true;
      else if (val === "false") val = false;
      fm[key] = val;
    }
  }
  const blurbLines = [];
  const bullets = [];
  let sawBullet = false;
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith("- ")) {
      bullets.push(t.slice(2).trim());
      sawBullet = true;
    } else if (t && !sawBullet) {
      blurbLines.push(t);
    }
  }
  return { fm, blurb: blurbLines.join(" ") || undefined, bullets };
}

export function generate() {
  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

  const files = readdirSync(CONTENT_DIR).filter(
    (f) => f.toLowerCase().endsWith(".md") && !f.startsWith("."),
  );

  const items = [];
  for (const file of files) {
    const { fm, blurb, bullets } = parseFile(readFileSync(join(CONTENT_DIR, file), "utf8"));
    if (!fm.type || !fm.name) {
      console.warn(`[gen-projects] skipping ${file} (missing type or name)`);
      continue;
    }
    items.push({
      id: parse(file).name,
      type: String(fm.type),
      name: String(fm.name),
      date: fm.date ? String(fm.date) : undefined,
      url: fm.url ? String(fm.url) : undefined,
      repo: fm.repo ? String(fm.repo) : undefined,
      stack: fm.stack ? String(fm.stack) : undefined,
      meta: fm.meta ? String(fm.meta) : undefined,
      cv: fm.cv !== false, // default true
      blurb,
      bullets,
    });
  }

  // Newest first; undated items sink to the bottom.
  items.sort((a, b) => {
    if (a.date && b.date) return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    if (a.date) return -1;
    if (b.date) return 1;
    return a.name.localeCompare(b.name);
  });

  // --- projects.generated.ts (website sections) ---
  const sectionItems = items.filter((it) => TYPE_TO_CATEGORY[it.type]);
  const projectRows = sectionItems
    .map((it) => {
      const fields = [
        `id: ${JSON.stringify(it.id)}`,
        `name: ${JSON.stringify(it.name)}`,
        `category: ${JSON.stringify(TYPE_TO_CATEGORY[it.type])}`,
      ];
      if (it.blurb) fields.push(`blurb: ${JSON.stringify(it.blurb)}`);
      const link = it.url || it.repo;
      if (link) fields.push(`url: ${JSON.stringify(link)}`);
      if (it.date) fields.push(`date: ${JSON.stringify(it.date)}`);
      return `  { ${fields.join(", ")} },`;
    })
    .join("\n");

  writeFileSync(
    PROJECTS_OUT,
    `// AUTO-GENERATED by scripts/gen-projects.mjs — do not edit by hand.
// Add projects with \`npm run add\` (or edit content/projects/*.md); this file is
// rewritten on the next \`npm run dev\` / \`npm run build\` (or \`npm run projects\`).
import type { Project } from "./projects";

export const GENERATED_PROJECTS: Project[] = [
${projectRows}
];
`,
    "utf8",
  );

  // --- cv.generated.ts (About window) ---
  const cvEntry = (it) => {
    const fields = [`title: ${JSON.stringify(it.name)}`];
    if (it.blurb) fields.push(`subtitle: ${JSON.stringify(it.blurb)}`);
    const meta = it.meta || dateLabel(it.date);
    if (meta) fields.push(`meta: ${JSON.stringify(meta)}`);
    if (it.stack) fields.push(`stack: ${JSON.stringify(it.stack)}`);
    const link = it.url || it.repo;
    if (link) fields.push(`url: ${JSON.stringify(link)}`);
    if (it.bullets && it.bullets.length) fields.push(`bullets: ${JSON.stringify(it.bullets)}`);
    return `  { ${fields.join(", ")} },`;
  };
  const cvProjects = items
    .filter((it) => it.cv && CV_SOFTWARE_TYPES.has(it.type))
    .map(cvEntry)
    .join("\n");
  const cvGames = items
    .filter((it) => it.cv && it.type === "game")
    .map(cvEntry)
    .join("\n");

  writeFileSync(
    CV_OUT,
    `// AUTO-GENERATED by scripts/gen-projects.mjs — do not edit by hand.
// Feeds the About/CV window (Software Projects + Game Projects). Edit the source
// in content/projects/*.md (or run \`npm run add\`) instead.
import type { Entry } from "./about";

export const CV_PROJECTS: Entry[] = [
${cvProjects}
];

export const CV_GAMES: Entry[] = [
${cvGames}
];
`,
    "utf8",
  );

  console.log(
    `[gen-projects] ${items.length} project(s) → ${sectionItems.length} section row(s), CV updated.`,
  );
  return items.length;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) generate();

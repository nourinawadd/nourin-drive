// Interactive "add a project" wizard.  Run from the repo root:  npm run add
//
// Asks a few questions, writes content/projects/<slug>.md, and regenerates the
// data files so the project shows up in the right website section and on the
// About/CV window. Graphic design / photography / songs stay drop-and-go — the
// wizard just points you at the right folder for those.

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "./gen-projects.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(here, "..", "content", "projects");

// Buffered line reader. Works whether stdin is an interactive TTY (lines arrive
// one Enter at a time) or a pipe/file (all lines arrive at once) — readline's
// own question() drops piped lines, so we queue them ourselves.
const rl = createInterface({ input, output });
const queue = [];
let waiting = null;
let closed = false;
rl.on("line", (line) => {
  if (waiting) { const r = waiting; waiting = null; r(line); }
  else queue.push(line);
});
rl.on("close", () => {
  closed = true;
  if (waiting) { const r = waiting; waiting = null; r(null); }
});
const nextLine = () => {
  if (queue.length) return Promise.resolve(queue.shift());
  if (closed) return Promise.resolve(null);
  return new Promise((res) => { waiting = res; });
};

const ask = async (q, def) => {
  output.write(def ? `${q} (${def}): ` : `${q}: `);
  const line = await nextLine();
  const a = (line ?? "").trim();
  return a || def || "";
};
const askYesNo = async (q, def = true) => {
  output.write(`${q} (${def ? "Y/n" : "y/N"}): `);
  const a = ((await nextLine()) ?? "").trim().toLowerCase();
  if (!a) return def;
  return a.startsWith("y");
};
const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "project";

const TYPES = [
  ["website", "Website   → Websites section + CV (Software Projects)"],
  ["game", "Game      → Games app + CV (Game Projects)"],
  ["api", "API       → APIs section + CV (Software Projects)"],
  ["software", "Software  → CV only (robotics, libraries, tools — no website section)"],
  ["blog", "Blog      → Blog section teaser"],
  ["__gallery", "Graphic design / Photography → drop-and-go (no wizard needed)"],
  ["__music", "Song      → drop-and-go (no wizard needed)"],
];

async function main() {
  console.log("\n  Add a project\n  =============\n");
  TYPES.forEach(([, label], i) => console.log(`  ${i + 1}) ${label}`));
  console.log("");

  let type = null;
  while (type == null) {
    const n = parseInt(await ask("Type number"), 10);
    if (n >= 1 && n <= TYPES.length) type = TYPES[n - 1][0];
    else console.log("  Please enter a number from the list.");
  }

  if (type === "__gallery") {
    console.log(
      "\n  Graphic design & photography are drop-and-go — no wizard needed.\n" +
        "  Drop image files into:\n" +
        "      client/public/gallery/<Category>/your image.jpg\n" +
        "  e.g. client/public/gallery/Posters/jazz night.png\n" +
        "  The folder name becomes the category. They appear on the next `npm run dev`.\n",
    );
    rl.close();
    return;
  }
  if (type === "__music") {
    console.log(
      "\n  Songs are drop-and-go — no wizard needed.\n" +
        "  Drop audio files into:\n" +
        "      client/public/music/Artist - Title.mp3\n" +
        "  An image with the same base name becomes the cover art.\n" +
        "  They appear on the next `npm run dev`.\n",
    );
    rl.close();
    return;
  }

  const name = await ask("Name");
  if (!name) {
    console.log("  A name is required. Aborting.");
    rl.close();
    return;
  }

  const now = new Date();
  const defDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let date = await ask("Date (YYYY-MM)", defDate);
  if (!/^\d{4}-\d{2}$/.test(date)) {
    console.log(`  (using ${defDate}; '${date}' isn't YYYY-MM)`);
    date = defDate;
  }

  let url = "";
  let repo = "";
  if (type === "website" || type === "api" || type === "game") {
    url = await ask(type === "game" ? "Play URL" : "Live URL");
    repo = await ask("Repo URL (optional)");
  } else if (type === "software") {
    url = await ask("Link / repo (optional)");
  }

  let stack = "";
  if (type !== "blog") stack = await ask("Tech stack (optional, e.g. Node · Mongo · React)");

  const blurb = await ask("Short blurb (one line — shown in the section and as the CV subtitle)");

  const bullets = [];
  if (type !== "blog") {
    console.log("CV bullet points — one per line, blank line to finish:");
    // eslint-disable-next-line no-constant-condition
    while (true) {
      output.write("  - ");
      const line = await nextLine();
      const b = (line ?? "").trim();
      if (!b) break; // blank line or EOF ends the list
      bullets.push(b);
    }
  }

  const cv = type === "blog" ? false : await askYesNo("Show on CV?", true);

  // Assemble the file.
  const fm = [`type: ${type}`, `name: ${name}`, `date: ${date}`];
  if (url) fm.push(`url: ${url}`);
  if (repo) fm.push(`repo: ${repo}`);
  if (stack) fm.push(`stack: ${stack}`);
  fm.push(`cv: ${cv}`);

  const bodyParts = [];
  if (blurb) bodyParts.push(blurb);
  if (bullets.length) bodyParts.push(bullets.map((b) => `- ${b}`).join("\n"));
  const content = `---\n${fm.join("\n")}\n---\n${bodyParts.length ? "\n" + bodyParts.join("\n\n") + "\n" : ""}`;

  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });
  const existing = new Set(readdirSync(CONTENT_DIR).map((f) => f.toLowerCase()));
  const slug = slugify(name);
  let file = `${slug}.md`;
  let i = 2;
  while (existing.has(file.toLowerCase())) file = `${slug}-${i++}.md`;
  writeFileSync(join(CONTENT_DIR, file), content, "utf8");
  rl.close();

  console.log(`\n  ✓ wrote content/projects/${file}`);
  generate();

  const onCv = cv ? " + About → Software Projects" : "";
  const where =
    type === "game"
      ? "Games app + About → Game Projects"
      : type === "software"
        ? "About → Software Projects (CV only)"
        : type === "blog"
          ? "File Explorer → Blog"
          : type === "api"
            ? "File Explorer → APIs" + onCv
            : "File Explorer → Websites" + onCv;
  console.log(`  Shows in: ${where}.`);
  console.log("  Run `npm run dev` (or refresh if it's already running) to see it.\n");
}

main().catch((e) => {
  console.error(e);
  rl.close();
  process.exit(1);
});

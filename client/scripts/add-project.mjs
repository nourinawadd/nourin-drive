// Interactive "add to your site" wizard.  Run from the repo root:  npm run add
//
// Asks a few questions, writes a small content file, and regenerates the data
// files so the entry shows up in the right place. Two kinds of entries:
//   • Projects → content/projects/<slug>.md → a website section and/or the CV.
//   • CV entries (experience, education, extracurriculars, certifications,
//     languages) → content/cv/<slug>.md → the matching About-window section.
// Graphic design / photography / songs stay drop-and-go — the wizard just points
// you at the right folder for those.

import { writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "./gen-projects.mjs";
import { addDoc } from "./add-doc.mjs";
import { createPrompt, slugify } from "./prompt.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(here, "..", "content", "projects");
const CV_CONTENT_DIR = join(here, "..", "content", "cv");

const { rl, ask, askYesNo, askBullets } = createPrompt();

// Write content to <dir>/<slug>.md, appending -2, -3… if the slug collides.
function writeContentFile(dir, name, content) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const existing = new Set(readdirSync(dir).map((f) => f.toLowerCase()));
  const slug = slugify(name);
  let file = `${slug}.md`;
  let i = 2;
  while (existing.has(file.toLowerCase())) file = `${slug}-${i++}.md`;
  writeFileSync(join(dir, file), content, "utf8");
  return file;
}

const done = (rel, section) => {
  console.log(`\n  ✓ wrote ${rel}`);
  generate();
  console.log(`  Shows in: ${section}`);
  console.log("  Run `npm run dev` (or refresh if it's already running) to see it.\n");
};

// Menu. `group` rows are headers; the rest are numbered choices in order.
const MENU = [
  { group: "Projects & content" },
  { type: "website", label: "Website         → Websites section + CV (Software Projects)" },
  { type: "game", label: "Game            → Games app + CV (Game Projects)" },
  { type: "api", label: "API             → APIs section + CV (Software Projects)" },
  { type: "software", label: "Software        → CV only (robotics, libraries, tools)" },
  { type: "blog", label: "Blog            → Blog section teaser" },
  { group: "Reading library" },
  { type: "__library", label: "Poem / Writing / Book → Ereader" },
  { group: "CV / About window" },
  { type: "experience", label: "Experience      → CV: Experience" },
  { type: "education", label: "Education       → CV: Education" },
  { type: "extracurricular", label: "Extracurricular → CV: Extracurriculars" },
  { type: "certification", label: "Certification   → CV: Certifications" },
  { type: "language", label: "Language        → CV: Languages" },
  { group: "Drop-and-go (no wizard needed)" },
  { type: "__gallery", label: "Graphic design / Photography → drop files in a folder" },
  { type: "__music", label: "Song            → drop files in a folder" },
];
const CHOICES = MENU.filter((m) => m.type);

// Per-type prompts for the CV "Entry" sections (title + role + dates + bullets).
const CV_ENTRY = {
  experience: { nameQ: "Company / organisation", roleQ: "Role / title", section: "About → Experience" },
  education: { nameQ: "School / institution", roleQ: "Degree / programme", section: "About → Education" },
  extracurricular: { nameQ: "Organisation / club", roleQ: "Role / position", section: "About → Extracurriculars" },
};

async function main() {
  console.log("\n  Add to your site\n  ================");
  let n = 0;
  for (const m of MENU) {
    if (m.group) { console.log(`\n  ${m.group}`); continue; }
    console.log(`   ${String(++n).padStart(2)}) ${m.label}`);
  }
  console.log("");

  let type = null;
  while (type == null) {
    const k = parseInt(await ask("Choice number"), 10);
    if (k >= 1 && k <= CHOICES.length) type = CHOICES[k - 1].type;
    else console.log("  Please enter a number from the list.");
  }

  // --- reading library: same wizard as `npm run add:doc` ---
  if (type === "__library") {
    await addDoc(ask, askYesNo);
    rl.close();
    return;
  }

  // --- drop-and-go reminders ---
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
        "\n  A FOLDER in there is a playlist:\n" +
        "      client/public/music/01 - Late Night/Artist - Title.mp3\n" +
        "  The '01 - ' is optional and only pins the playlist's position.\n" +
        "  Loose files land in 'Singles'. See public/music/README.md.\n" +
        "\n  They appear on the next `npm run dev` — or straight away, since\n" +
        "  dev watches the folder.\n",
    );
    rl.close();
    return;
  }

  // --- CV: certifications / languages (one-line "Name — detail" entries) ---
  if (type === "certification" || type === "language") {
    const isCert = type === "certification";
    const name = await ask(isCert ? "Certification name" : "Language");
    if (!name) { console.log("  A name is required. Aborting."); rl.close(); return; }
    const detail = isCert
      ? await ask("Issuer (optional, e.g. freeCodeCamp / LinkedIn)")
      : await ask("Proficiency (optional, e.g. Native, Full Professional Proficiency)");

    const fm = [`type: ${type}`, `name: ${name}`];
    if (detail) fm.push(`${isCert ? "issuer" : "level"}: ${detail}`);
    const file = writeContentFile(CV_CONTENT_DIR, name, `---\n${fm.join("\n")}\n---\n`);
    rl.close();
    done(`content/cv/${file}`, `${isCert ? "About → Certifications" : "About → Languages"} (added to the end of the list).`);
    return;
  }

  // --- CV: experience / education / extracurriculars (Entry blocks) ---
  if (CV_ENTRY[type]) {
    const cfg = CV_ENTRY[type];
    const name = await ask(cfg.nameQ);
    if (!name) { console.log("  A name is required. Aborting."); rl.close(); return; }
    const role = await ask(`${cfg.roleQ} (optional)`);
    const meta = await ask("Place · dates (e.g. Cairo, Egypt · Jun – Sep 2025)");
    const url = await ask("Link (optional)");
    const bullets = await askBullets("Bullet points — one per line, blank line to finish:");

    const fm = [`type: ${type}`, `name: ${name}`];
    if (meta) fm.push(`meta: ${meta}`);
    if (url) fm.push(`url: ${url}`);
    const body = [];
    if (role) body.push(role);
    if (bullets.length) body.push(bullets.map((b) => `- ${b}`).join("\n"));
    const content = `---\n${fm.join("\n")}\n---\n${body.length ? "\n" + body.join("\n\n") + "\n" : ""}`;
    const file = writeContentFile(CV_CONTENT_DIR, name, content);
    rl.close();
    console.log(`\n  ✓ wrote content/cv/${file}`);
    generate();
    console.log(`  Shows in: ${cfg.section} (added to the end of the section).`);
    console.log("  To move it, set `order:` in the file (lower = higher up).");
    console.log("  Run `npm run dev` (or refresh if it's already running) to see it.\n");
    return;
  }

  // --- Projects (website / api / game / software / blog) ---
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

  let bullets = [];
  if (type !== "blog") {
    bullets = await askBullets("CV bullet points — one per line, blank line to finish:");
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

  const file = writeContentFile(CONTENT_DIR, name, content);
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
  if (type === "game") {
    const slug = file.replace(/\.md$/, "");
    console.log("");
    console.log("  To make it playable INSIDE the site (not just an itch link),");
    console.log("  drop your HTML5 export into:");
    console.log(`      client/public/games/${slug}/        (so .../index.html exists)`);
    console.log("  Optional: a cover.png in that folder becomes the card art.");
    console.log("  Godot 4.3: export with \"Thread Support\" OFF (no special headers needed).");
    console.log("  Then run `npm run games` (or restart dev). Without a build it opens on itch.");
  }
  console.log("  Run `npm run dev` (or refresh if it's already running) to see it.\n");
}

main().catch((e) => {
  console.error(e);
  rl.close();
  process.exit(1);
});

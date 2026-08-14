# Adding a project (personal cheat-sheet)

> This is the “how do I add stuff to my site again?” note. Separate from the README
> on purpose. Read this, not the code.

## TL;DR

```bash
npm run add        # from the repo root — answer the prompts. Done.
```

The wizard adds **two kinds of things**:

- **Projects & content** → website sections and/or the CV (websites, APIs, games,
  software, blog).
- **CV / About window entries** → experience, education, extracurriculars,
  certifications, languages.

It writes one small file (in `client/content/projects/` for projects, or
`client/content/cv/` for CV entries), regenerates the data, and it shows up in the
right place(s) automatically. Then `npm run dev` (or refresh, if it’s already running).

---

## What each choice does

The wizard’s menu is grouped. The first group is **projects** (they can show up in a
website section *and/or* the CV):

| Type        | Website section                          | On the CV (About window) |
|-------------|------------------------------------------|--------------------------|
| **Website** | File Explorer → **Websites** (opens it in the in-site Browser) | **Software Projects** |
| **API**     | File Explorer → **APIs** (opens API Studio) | **Software Projects** |
| **Game**    | **Games** app (opens in a new tab)       | **Game Projects** |
| **Software**| *(nowhere — CV only)* — for robotics, libraries, tools | **Software Projects** |
| **Blog**    | File Explorer → **Blog**                 | *(not on the CV)* |

“Show on CV?” is a yes/no override on top of that:
- A **website you don’t want on the CV** (like this portfolio itself) → type `website`,
  answer **no** to “Show on CV?”.
- Something that should **only** be on the CV (e.g. a robotics build) → type `software`.

The second group is **CV / About window** entries — these only touch the About window:

| Type               | Where on the CV         | Looks like |
|--------------------|-------------------------|------------|
| **Experience**     | About → **Experience**  | title · role · place/dates · bullets |
| **Education**      | About → **Education**   | title · degree · place/dates · bullets |
| **Extracurricular**| About → **Extracurriculars** | title · role · dates · bullets |
| **Certification**  | About → **Certifications** | one line: `Name — Issuer` |
| **Language**       | About → **Languages**   | one chip: `Language — Proficiency` |

New CV entries are **added to the end** of their section. To reposition one, open its
file in `client/content/cv/` and set `order:` (lower = higher up; the existing entries
are numbered `1, 2, 3…`).

> The remaining CV bits — your name/title, links, bio, and the **Skills** chips — are
> still hand-edited in `client/src/data/about.ts`. Everything else there now comes from
> content files.

### Not handled by the wizard (drop-and-go)

These three never use `npm run add` — you just drop files in a folder and they appear:

- **Graphic design / Photography** → drop images in
  `client/public/gallery/<Category>/your image.jpg`
  (the folder name becomes the category, e.g. `…/gallery/Posters/jazz night.png`).
- **Songs** → drop audio in `client/public/music/Artist - Title.mp3`
  (an image with the same base name becomes the cover art).
  **A folder in there is a playlist**: `…/music/01 - Late Night/song.mp3` gives
  you a "Late Night" playlist, the `01 - ` just pins its position. Loose files
  land in "Singles". Full details in `client/public/music/README.md`.

If you pick one of those in the wizard, it just reminds you of the folder and exits.

---

## Playable games (run inside the site)

By default a **game** entry just opens its itch link in a new tab. To make it play
**inside a window** (no tab, no leaving the site), self-host the HTML5 export:

1. Add the game with `npm run add` → **Game** (this stores the name, blurb, itch URL).
   Note the slug it prints, e.g. `puppetry`.
2. Drop your **HTML5 export** into a folder with that **same slug**:
   ```
   client/public/games/puppetry/index.html   ← required (the export's entry file)
   client/public/games/puppetry/cover.png    ← optional (becomes the card art)
   ```
   (Also accepts `thumbnail/thumb/screenshot.(png|jpg|jpeg|webp|gif|avif)` for the cover.)
3. `npm run games` (or restart `npm run dev`).

That's it — the Games app and the Explorer “Games” volume now open it in a window. If
both a local build *and* an itch URL exist, the card plays locally and shows a small
“view on itch ↗” link.

### Exporting so it actually runs (important)

- **Godot 4.3:** export the Web preset with **“Thread Support” OFF**. Threaded exports
  need `SharedArrayBuffer`, which requires site-wide cross-origin isolation
  (`COOP`/`COEP`) — that would break the in-site Browser app and external images, so
  don’t. Single-threaded is fine for 2D.
- **Unity WebGL** — mind the **compression setting** (Player Settings → Publishing
  Settings). Unity ships the build compressed and its loader fetches the raw `.br`/`.gz`
  files, which only work if the browser decompresses them:
  - **Brotli** (`*.br`): the browser only decodes it over **HTTPS**. It works on
    Vercel (prod) because `next.config.ts` tags `/games/**.br` with `Content-Encoding: br`
    — but it **fails on `http://localhost`** no matter what (Chrome won't decode Brotli
    over plain HTTP). That’s the *“Unable to parse ….br”* error.
  - **Fix — pick one (in order of preference):**
    1. **Decompression Fallback = ON** (keeps compression; Unity decompresses in JS, so
       it works on localhost, HTTP, and any host — most robust).
    2. **Compression Format = Gzip** (the browser decodes gzip even over HTTP; the
       `next.config.ts` `Content-Encoding: gzip` rule then makes it work everywhere).
    3. **Compression Format = Disabled** (simplest, no headers needed, but biggest files).
  - Re-export, re-drop into `public/games/<slug>/`, `npm run games`, hard-refresh.
  - Don’t enable experimental threads/wasm-multithreading (needs `SharedArrayBuffer`).
- These are first-party files served from your own domain, so the player iframe is
  **not** sandboxed (engines need fullscreen / pointer-lock / IndexedDB).
- **Size:** WebGL builds are big (10–40 MB). They live in `public/games/`, so they’re
  committed and deployed. If the repo gets heavy, use Git LFS or host the build files
  elsewhere and fall back to the itch link.

> Can’t/won’t self-host one? Just don’t add a `public/games/<slug>/` folder — that game
> keeps opening on itch in a new tab.

---

## Naming picture assets (gallery drag-and-drop)

Images live in `client/public/gallery/`. The **filename and folder are the data** —
there's no wizard — so name them right and they show up correctly. They appear on the
next `npm run dev` (or run `npm run gallery` to refresh without restarting).

Supported file types: `.jpg .jpeg .png .webp .gif .avif .bmp .svg`.

### 1. Category = the subfolder (recommended)

Put the image in a folder; the **folder name becomes the category** (a section /
Explorer volume, e.g. “Photography”, “Posters”). Case and spaces are kept as-is.

```
client/public/gallery/Photography/sunset over water.jpg     → category "Photography"
client/public/gallery/Posters/jazz night.png               → category "Posters"
```

### 2. Category = a filename prefix (for loose, top-level files)

For a file dropped directly in `gallery/` (no subfolder), put `Category - Title`:

```
client/public/gallery/Posters - Jazz Night.jpg   → category "Posters", title "Jazz Night"
client/public/gallery/sunset.jpg                 → category "Gallery" (the default)
```

> The `Category - ` prefix trick is **only** for top-level files. Inside a subfolder
> the whole filename is the title, so don't repeat the category there.

### The title comes from the filename

Extension is stripped and `_` becomes a space. Two optional extras:

- **Leading number → sort order** within the category: `01 - `, `01. `, or `01 `.
- **Trailing `(YYYY)` or `(YYYY-MM)` → date** shown on the item.

```
client/public/gallery/Posters/01 - Jazz Night (2024).png
        → category "Posters", title "Jazz Night", sorts first, date 2024

client/public/gallery/Photography/02 - Old Cairo Rooftops (2023-08).jpg
        → category "Photography", title "Old Cairo Rooftops", date Aug 2023
```

### Quick reference

| You drop… | Category | Title | Order | Date |
|-----------|----------|-------|-------|------|
| `Posters/01 - Jazz Night (2024).png` | Posters | Jazz Night | 1 | 2024 |
| `Photography/sunset_over_water.jpg` | Photography | sunset over water | — | — |
| `Posters - Brand Mark.jpg` *(top level)* | Posters | Brand Mark | — | — |
| `random.png` *(top level)* | Gallery | random | — | — |

**Gotchas**
- A title that *really* starts with a number (e.g. `2024 Recap.jpg`) — the leading
  number is taken as sort order and dropped from the title. Rename to avoid it
  (`Recap (2024).jpg`).
- Filenames must be unique enough; identical category+title get a numeric suffix.
- Song cover art is the same idea: an image with the **same base name** as the audio
  file in `client/public/music/` (e.g. `Artist - Title.mp3` + `Artist - Title.jpg`).

---

## The prompts, one by one

| Prompt | What it’s for | Optional? |
|--------|---------------|-----------|
| **Type** | The table above. Enter the number. | required |
| **Name** | Title shown in the section and on the CV. | required |
| **Date** | `YYYY-MM`. Sorts everything newest-first. Defaults to this month. | optional |
| **Live / Play URL** | Where the project opens (website/game). | optional |
| **Repo URL** | Source link; used as the CV link if there’s no live URL. | optional |
| **Link / repo** (software only) | Single link for CV-only items. | optional |
| **Tech stack** | e.g. `Node · Mongo · React`. Shown in italics on the CV. | optional |
| **Short blurb** | One line. Shown in the section card **and** as the CV subtitle. | optional |
| **CV bullet points** | One per line, blank line to finish. The CV detail bullets. | optional |
| **Show on CV?** | Whether it appears on the About window. Default **yes**. | — |

### CV entries (experience / education / extracurricular)

| Prompt | What it’s for | Optional? |
|--------|---------------|-----------|
| **Company / School / Org** | The bold title line. | required |
| **Role / Degree / Position** | The line under it (the subtitle). | optional |
| **Place · dates** | Free text, e.g. `Cairo, Egypt · Jun – Sep 2025`. | optional |
| **Link** | Makes the title a link. | optional |
| **Bullet points** | One per line, blank line to finish. | optional |

### CV entries (certification / language)

| Prompt | What it’s for | Optional? |
|--------|---------------|-----------|
| **Name / Language** | The thing itself. | required |
| **Issuer / Proficiency** | Appended after a `—`. | optional |

---

## The file it writes

A **project** lands at `client/content/projects/<slug>.md`; a **CV entry** at
`client/content/cv/<slug>.md` (slug derived from the name; a number is appended if it
collides). You can also hand-edit or duplicate these files — same result as the wizard.

**Project** (`content/projects/`):

```markdown
---
type: website
name: Tether Note
date: 2025-11
url: https://tethernote.vercel.app/
repo: https://github.com/nourinawadd/tether-note
stack: Node.js · MongoDB · Express · React
cv: true
---
Time-delayed note delivery — send messages to your future self.

- Node cron jobs + MongoDB automate time-based delivery.
- JWT session management with server-side middleware.
- Deployed to Vercel with env-var API config separating dev/prod.
```

**CV entry** (`content/cv/`):

```markdown
---
type: extracurricular            # or experience | education
name: IEEE Mansoura Student Branch — Victoris 3.0
meta: Jun – Sep 2024             # the free-text place · dates line
order: 1                         # optional — lower sorts higher
---
Technical Director               # first body line = subtitle (role / degree)

- Led the technical track for a national event with 880+ participants.
- Coordinated online/offline phases with teams and mentors.
```

```markdown
---
type: certification              # or language
name: Backend Development and APIs
issuer: freeCodeCamp             # languages use `level:` instead
order: 1
---
```

The rule:
- Everything between the `---` lines is **frontmatter** (`key: value`).
- The **first paragraph** of the body = the section blurb / CV subtitle (role / degree).
- Lines starting with `- ` = the **bullets**.

Frontmatter keys: `type`, `name`, `date`, `url`, `repo`, `stack`, `cv` (`true`/`false`),
`meta` (free-text dates line, or overrides the auto date label like “Nov 2025”),
`order` (manual sort, lower first), and `issuer` / `level` (certifications / languages).

---

## How it reaches the site

`scripts/gen-projects.mjs` reads every `content/projects/*.md` **and** every
`content/cv/*.md`, then rewrites two files:

- `src/data/projects.generated.ts` → the website sections (Explorer, Games)
- `src/data/cv.generated.ts` → the About/CV window (every section but Skills/bio)

**Never edit those two generated files by hand.** They’re regenerated automatically on
`npm run add`, `npm run dev`, and `npm run build` (and you can force it with
`npm run projects`).

Separately, `scripts/gen-games.mjs` scans `public/games/<slug>/` and writes
`src/data/games.generated.ts` (which games are playable in-window). It runs in the same
`gen` step; force it with `npm run games`.

---

## Editing or removing an entry

- **Edit:** open the `.md` (in `content/projects/` or `content/cv/`), change it, save.
  Run `npm run dev` (or `npm run projects` if dev is already running) to refresh.
- **Remove:** delete the `.md` file and regenerate.
- **Reorder a CV section:** set `order:` on its files (lower = higher up).

---

## Troubleshooting

- **It’s not showing up.** Check the `type` — projects use
  `website/api/game/software/blog`; CV entries use
  `experience/education/extracurricular/certification/language`. Make sure the file is
  in the matching folder (`content/projects/` vs `content/cv/`), then run
  `npm run projects` and reload. (The wizard runs this for you.)
- **It’s on the site but not the CV.** `cv:` is `false`, or the type is `blog`
  (blog isn’t on the CV by design).
- **Wrong order.** An explicit `order:` wins (lower first); otherwise it’s by `date`
  (newest first, `YYYY-MM`), then name. New CV entries have no `order`, so they land at
  the end — give them an `order:` to move them.
- **Two entries with the same name.** The second file becomes `<slug>-2.md` — that’s
  expected, both still show.

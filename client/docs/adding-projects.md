# Adding a project (personal cheat-sheet)

> This is the “how do I add stuff to my site again?” note. Separate from the README
> on purpose. Read this, not the code.

## TL;DR

```bash
npm run add        # from the repo root — answer the prompts. Done.
```

It writes one small file in `client/content/projects/`, regenerates the data, and the
project shows up in the right place(s) automatically. Then `npm run dev` (or refresh,
if it’s already running).

---

## What each type does

When the wizard asks for a **type**, that single choice decides where the project
shows up:

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

### Not handled by the wizard (drop-and-go)

These three never use `npm run add` — you just drop files in a folder and they appear:

- **Graphic design / Photography** → drop images in
  `client/public/gallery/<Category>/your image.jpg`
  (the folder name becomes the category, e.g. `…/gallery/Posters/jazz night.png`).
- **Songs** → drop audio in `client/public/music/Artist - Title.mp3`
  (an image with the same base name becomes the cover art).

If you pick one of those in the wizard, it just reminds you of the folder and exits.

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

---

## The file it writes

Lands at `client/content/projects/<slug>.md` (slug derived from the name; a number is
appended if the name collides). You can also hand-edit or duplicate these files — same
result as the wizard.

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

The rule:
- Everything between the `---` lines is **frontmatter** (`key: value`).
- The **first paragraph** of the body = the section blurb / CV subtitle.
- Lines starting with `- ` = the **CV bullets**.

Frontmatter keys: `type`, `name`, `date`, `url`, `repo`, `stack`, `cv` (`true`/`false`),
and optional `meta` (overrides the auto date label like “Nov 2025”).

---

## How it reaches the site

`scripts/gen-projects.mjs` reads every `content/projects/*.md` and rewrites two files:

- `src/data/projects.generated.ts` → the website sections (Explorer, Games)
- `src/data/cv.generated.ts` → the About/CV window

**Never edit those two generated files by hand.** They’re regenerated automatically on
`npm run add`, `npm run dev`, and `npm run build` (and you can force it with
`npm run projects`).

---

## Editing or removing a project

- **Edit:** open the project’s `.md`, change it, save. Run `npm run dev` (or
  `npm run projects` if dev is already running) to refresh.
- **Remove:** delete the `.md` file and regenerate.

---

## Troubleshooting

- **It’s not showing up.** Check the `type` is one of `website/api/game/software/blog`,
  then run `npm run projects` and reload. (The wizard runs this for you.)
- **It’s on the site but not the CV.** `cv:` is `false`, or the type is `blog`
  (blog isn’t on the CV by design).
- **Wrong order.** Ordering is by `date` (newest first); items with no `date` go last.
  Date must be `YYYY-MM`.
- **Two projects with the same name.** The second file becomes `<slug>-2.md` — that’s
  expected, both still show.

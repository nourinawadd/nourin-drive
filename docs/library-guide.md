# Adding things to the reading library

How to get a poem, an essay or a book into the Ereader app.

Everything on the shelves is a real file in `client/public/library/`. There is no
database and no upload form — you put a file in a folder, run one command, and it
appears. That means adding something is a commit, and removing something is
deleting a file.

---

## The short version

```bash
npm run add:doc
```

Answer the questions. Done. Run `npm run dev` (or refresh, if it's already
running) and it's on the shelf.

Everything below is detail for when you want to do it by hand, fix something, or
understand why a file came out looking wrong.

---

## 1. The wizard

Run from anywhere in the repo:

```bash
npm run add:doc
```

It's also the "Poem / Writing / Book" option inside `npm run add`, if that's the
menu you already have open.

### Adding a poem you've already written

```
  Add to the library
  ==================

   1) Poem            → Poems shelf (.md or .txt)
   2) Writing         → Writings shelf (essay, notes, prose)
   3) Book            → Books shelf (someone else's work)
   4) Other shelf     → name your own

Choice number: 1
Path to the file (.md/.txt/.pdf) — or blank to start a new empty .md: C:\Users\e\Desktop\on leaving.md
Title (on leaving): On Leaving
Is this yours? (Y/n): y
Date (YYYY-MM, or blank) (2026-07):
One-line blurb for the card (optional): Written on a train, mostly.
Note — edition, source, anything worth recording (optional):

  ✓ copied public/library/Poems/On Leaving.md
[gen-library] wrote 6 document(s) to library.generated.ts (5 inlined)
  Shows in: Ereader → Poems (and File Explorer → Poems).
  Run `npm run dev` (or refresh if it's already running) to see it.
```

The file is **copied**, not moved — your original stays where it was.

### Starting a poem from nothing

Leave the path blank. It writes an empty `.md` with the frontmatter filled in
and tells you where to type:

```
Path to the file (.md/.txt/.pdf) — or blank to start a new empty .md:
Title: The Long Way Round
...
  ✓ created public/library/Poems/The Long Way Round.md
  Open it and write: client/public/library/Poems/The Long Way Round.md
```

### Adding a book

```
Choice number: 3
Path to the PDF (drag it into the terminal): "D:\Downloads\meditations.pdf"
Title (meditations): Meditations
Author (whose book this actually is): Marcus Aurelius
Date (YYYY-MM, or blank) (2026-07): 2024
One-line blurb for the card (optional): Stoic notes, public domain.
Note — edition, source, anything worth recording (optional): Project Gutenberg edition

  ✓ copied public/library/Books/Marcus Aurelius - Meditations.pdf
  ✓ wrote public/library/Books/Marcus Aurelius - Meditations.meta.md (title/author live in the filename)
```

You can drag a file into the terminal instead of typing the path. Quotes around
it are fine — Windows "Copy as path" adds them and the wizard strips them.

Books ask for the author outright, and warn you if you skip it. They're not your
work; the card should say whose they are.

---

## 2. By hand

Drop files into a shelf folder, then rebuild the index:

```bash
cd client
npm run library
```

`npm run dev` and `npm run build` both do this automatically, so a restart is
enough if you'd rather not remember the command.

### Editing something already on a shelf

**While `npm run dev` is running, just save the file.** A watcher on
`public/library/` regenerates the index, and the browser hot-reloads itself. No
command, no restart.

If the dev server *isn't* running, the edit won't be picked up until the
generator runs again:

```bash
cd client
npm run library
```

This matters because `.md` and `.txt` bodies are copied into
`src/data/library.generated.ts` — that copy is what the site reads, not your
file. It's why editing used to look like it did nothing.

You can't ship a stale version by accident: `npm run build` regenerates first, so
a deploy always matches what's on disk.

(Text files over 256 KB are the exception: too big to inline, so they're fetched
live and a plain refresh is enough. Metadata still needs a regenerate.)

```
client/public/library/
  Poems/
    on leaving.md
  Writings/
    notes on quiet.txt
  Books/
    Franz Kafka - The Trial.pdf
```

**The folder name is the shelf.** It becomes a filter chip in the Ereader and a
folder in the File Explorer. Make a new folder and you have a new shelf — no code
change. A file sitting loose at the top level of `library/` lands on a shelf
called "Library".

Shelves are ordered Poems → Writings → Books → anything else alphabetically.

---

## 3. Where the metadata comes from

Only three formats are read: **`.pdf`**, **`.md`**, **`.txt`**. Anything else is
ignored.

| | Title | Author | Everything else |
|---|---|---|---|
| `.md` | frontmatter, else filename | frontmatter | frontmatter |
| `.txt` | the filename | — | sidecar (§5) |
| `.pdf` | filename after `" - "` | filename before `" - "` | sidecar (§5) |

### `.md` — frontmatter

The richest option, and the right one for anything you wrote yourself.

```markdown
---
title: On Leaving
date: 2026-07
blurb: Written on a train, mostly.
---

The station clock has been wrong for a year
and nobody has agreed to fix it —
```

| Key | Notes |
|---|---|
| `title` | Falls back to the filename if absent |
| `author` | **Leave it out entirely if the piece is yours.** The card then credits you |
| `date` | `YYYY` or `YYYY-MM`. Sorts newest first |
| `blurb` | One line on the card. Falls back to the first line of the body |
| `note` | Edition, source, provenance. Shown in italics under the blurb |
| `order` | Pins position within the shelf (lower first), beating the date |

Frontmatter must be the very first thing in the file — `---`, keys, `---`.

### `.pdf` — the filename

There's nowhere inside a PDF for this to live, so the filename carries it:

```
Franz Kafka - The Trial.pdf     →  "The Trial" by Franz Kafka
The Trial.pdf                   →  "The Trial", no author
```

The split is on the **first `" - "`** (spaced hyphen). No `" - "` means the whole
filename is the title.

> This convention is **PDF-only**. A file called `Kafka - The Trial.txt` gets the
> title "Kafka - The Trial" — no author extracted. Use a sidecar for `.txt`.

### `.txt` — the filename

The filename is the title, and that's all a `.txt` can say on its own. Use `.md`
instead if you want a blurb or an author, or add a sidecar.

---

## 4. Filename tricks

These apply to `.txt` filenames and to the title half of a PDF filename.

| Filename | Title | Effect |
|---|---|---|
| `01 - First Poem.txt` | First Poem | Leading number pins the order |
| `Aubade (2025).txt` | Aubade | Trailing `(YYYY)` sets the date |
| `Aubade (2025-03).txt` | Aubade | `(YYYY-MM)` works too |
| `a_poem_with_gaps.txt` | a poem with gaps | Underscores become spaces |
| `02 - Late Frost (2023-04).txt` | Late Frost | All of it at once |

Ordering within a shelf: explicit `order` (or a leading number) first, then
newest date, then filename.

---

## 5. Sidecars — metadata for PDFs and text files

A file named `<same base name>.meta.md` describes its neighbour. Frontmatter
only, no body:

```
Books/Marcus Aurelius - Meditations.pdf
Books/Marcus Aurelius - Meditations.meta.md
```

```markdown
---
date: 2024
blurb: Stoic notes, public domain.
note: Project Gutenberg edition
---
```

Sidecar values **override** everything derived from the filename, so you can also
use one to correct a title without renaming the file. The wizard writes one
automatically whenever you give it more than the filename can hold.

Sidecars are not themselves documents — they won't appear on a shelf.

---

## 6. Cover art

Optional. Drop an image beside the file with `.cover` before its extension:

```
Books/Franz Kafka - The Trial.pdf
Books/Franz Kafka - The Trial.cover.png
```

`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` and `.avif` all work. Roughly 3:4
portrait looks best — cards render at 84×119.

Without one:

- **PDFs** render their own first page as the thumbnail, on demand, once the card
  scrolls into view. Usually good enough that you never need a cover.
- **Everything else** gets the title set on paper with a coloured spine.

The wizard doesn't ask about covers — add them by hand and re-run
`npm run library`.

---

## 7. How the reader treats it

Worth knowing, because it explains why a poem doesn't paginate:

| | Behaviour |
|---|---|
| Anything on **Poems** | One continuous column, scrolls. Always |
| Text under ~900 characters | Same — a "page" would be mostly empty |
| Longer prose | Paginated into columns; two-page spread once wide enough |
| PDFs | Page by page; two-page spread once wide enough |

"Wide enough" is 900px of *reading pane*, which is roughly a 1000px window — the
left rail takes its share. Below that it drops to a single page on its own, and
the Spread button greys out. Narrow the window and it follows.

`.txt` keeps your line breaks and indentation exactly as typed — a poem's shape
survives. Markdown gets reflowed and justified.

Text files under 256 KB are baked into the build so they open instantly. Larger
ones are fetched when opened. You don't have to do anything either way.

---

## 8. Share links

The Share button copies `yoursite.com/?doc=<shelf>/<title>`, e.g.
`?doc=books/the-trial`. Opening it loads the desktop with that document already
open in the reader.

The id comes from the **shelf and title**, so:

- **Renaming a title breaks existing share links.** Renaming the *file* is safe,
  as long as the title stays put (use a sidecar or frontmatter to keep it).
- Two documents with the same title on the same shelf will collide and get an
  ugly suffix. Keep titles unique per shelf.

The same title on *different* shelves is fine — `poems/echo` and `writings/echo`
coexist happily.

---

## 9. When it doesn't work

| Symptom | Cause |
|---|---|
| File doesn't appear | Not `.pdf`/`.md`/`.txt`, or you didn't run `npm run library` |
| Edits to a poem don't show | Dev server not running, so nothing is watching — run `npm run library`. The site reads the generated copy, not your file |
| Title is the whole filename | PDF with no `" - "`, or you used the `Author - Title` form on a `.txt` |
| Card says "Nourin Awad" but it isn't yours | No `author` set — add it to the frontmatter or a sidecar |
| Blurb repeats the title | Give it an explicit `blurb`; otherwise it uses the first body line |
| Frontmatter shows up as text | The `---` block isn't at the very top of the file |
| Sidecar ignored | Base name must match exactly, including spaces and case |
| Cover ignored | Needs `.cover` before the extension, matching base name |
| Poem won't paginate | Working as intended — see §7 |
| Everything vanished | `library.generated.ts` is rebuilt from the folder. If the folder is empty, the shelf is empty |

`npm run library` prints what it found. If the count is wrong, that's the fastest
place to look.

---

## Quick reference

```bash
npm run add:doc      # guided: copies the file and reindexes
npm run add          # same wizard, inside the general "add to site" menu
cd client && npm run library   # reindex by hand (only needed if dev isn't running)
```

`npm run dev` watches `public/library/` — while it's up, saving a file is all
you need to do.

```
client/public/library/<Shelf>/<file>          the document
client/public/library/<Shelf>/<base>.cover.png   optional cover
client/public/library/<Shelf>/<base>.meta.md     optional metadata
```

Formats: `.pdf` `.md` `.txt` · Shelf = folder name · `.md` frontmatter beats
filename · sidecar beats both.

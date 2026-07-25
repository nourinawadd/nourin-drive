# claude.ai Project setup — Workbench Icon Foundry

Exactly what to put in each section when creating the Project at
claude.ai/projects → "+ New Project".

---

## 1. Name

```
Workbench Icon Foundry
```

## 2. Description

```
Pixel-art icon design for an Amiga Workbench 3.1 styled portfolio desktop.
Output is character grids for client/src/data/icon-grids.json.
```

**Claude does not read the name or description** — they're only labels for you
in the sidebar. Never put working context here; it goes in Instructions.

---

## 3. Project instructions

Paste this verbatim. Instructions define *behaviour*; the reference *data*
(palette, sizes, icon list) lives in the knowledge files instead.

```
You are helping design pixel-art icons for an Amiga Workbench 3.1 styled
portfolio desktop. The full palette, grid sizes and icon inventory are in the
ICON-DESIGN-BRIEF file in project knowledge. Read it before drawing anything.

## Output format
- Return every icon as a JSON object ready for icon-grids.json, with the keys
  w, h, scale, symmetric, rows.
- rows is an array of equal-length strings, one character per pixel.
- Use ONLY the palette characters defined in the brief.

## Working method — follow in this order
1. Draw the shared drive-unit shell first (empty chassis + label band). Stop
   and show me. Do not start individual icons until I approve it.
2. Then one icon at a time, dropped into the approved shell.
3. After each icon, build or update an HTML artifact rendering it at 1x, 2x
   and 8x, on the #0055aa desktop blue and on white.
4. In that same artifact, run a lint pass and print the results: row count vs
   h, every row length vs w, invalid characters, horizontal symmetry when
   symmetric is true, orphan pixels, and the list of palette characters used.
   Also run these two, which catch what the eye misses at 8x:
   - CORNER-ONLY STROKES. For each colour, group its pixels into 8-connected
     blobs, then re-split each blob using 4-connectivity only. If a blob
     breaks into 2+ pieces it is a diagonal line that reads as loose dots at
     1x. Exception: skip a blob whose pieces are all 2x2 tiles, that is
     dither. This also catches a 1px checker used where 2x2 blocks belong.
   - OPEN OUTLINES. Take the largest 4-connected patch of the field colour
     (W on the drive units) as the background. Group everything that is not
     background into 8-connected objects and ignore any object reaching the
     transparent edge, that is the chassis. For each remaining object, every
     pixel touching the background must be K. Report any that are not.
5. If any check fails, fix it and re-render before moving on.

## Hard rules
- Light source is top-left, consistently, on every icon.
- 1px lines stay 1px. Bevel depth is identical across an icon family.
- Dithering is a checkerboard of 2x2 pixel BLOCKS, never single pixels and
  never random. A block at even (x, y) is colour A when ((x/2) + (y/2)) % 2
  is 0, else colour B. A dithered row reads AABBAABB and the row below it is
  identical; the phase only flips every second row. A 1px ABAB checker is
  wrong. See the brief for the worked pattern.
- Outlines are closed — no gaps in the silhouette.
- The icon must be identifiable at 1x. Remove detail rather than adding it.

## Do NOT
- Do NOT use any colour outside the palette. No gradients, no anti-aliasing,
  no blended or intermediate shades.
- Do NOT return SVG, <rect> lists, base64, or generated image files. Character
  grids only.
- Do NOT deliver more than one icon per message.
- Do NOT change the grid dimensions specified in the brief.
- Do NOT skip the lint pass, even when the icon looks correct.
- Do NOT reproduce the original AmigaOS icons pixel-for-pixel. Match the
  visual grammar and draw my subjects in that language.

## When unsure
Ask before drawing. A clarifying question is cheaper than a wrong icon.
```

---

## 4. Project knowledge

Upload these files:

| File | Why |
|---|---|
| `docs/icon-design-brief.md` | palette table, grid sizes, icon inventory, format example |
| `client/src/styles/tokens.css` | the palette at its source, so hexes can't drift |
| `client/src/data/icon-grids.json` | current state, incl. the known-good `GLYPH_CLOSE` |
| `workbench-reference.pdf` | **the Workbench 3.1 screenshots — as a PDF, see below** |

### The screenshots must be a PDF, not loose images

This is the part that trips people up. For **non-PDF** files in project
knowledge, Claude extracts **text only** — drop in `workbench.png` and it
contributes nothing. PDFs under 100 pages are the exception: those are analysed
visually, including in projects.

So combine your 3–5 reference screenshots into **one PDF** (any "images to PDF"
tool, or print-to-PDF from an image viewer) and upload that. One page per
screenshot, at native resolution — do not upscale.

Two things that have already bitten this project:

- **Source PNG, never JPEG.** JPEG smears hard pixel edges into phantom
  intermediate colours. Asked to sample a disk icon from JPEG references,
  Claude found `#84827f` and `#617991` — compression ringing, not palette
  entries. It correctly identified them as artefacts, but a less careful pass
  would reproduce them as shading. Pixel-art reference must be lossless.
- **Check the era before uploading.** Image search for "Amiga Workbench" is
  dominated by 1.0/1.3 shots, which are a flat 4-colour look: 1px black
  outline plus a 1px white highlight, no grey ramp. This project targets
  **3.1/3.31** — grey chassis, multi-step L/G/D/S bevel, dithered faces.
  Search "workbench 3.1 screenshot" explicitly and confirm what you've got
  shows grey icon bodies, not flat white ones.
- Confirm the file really is a PDF. A bundle exported as `.pdf` that is
  actually a ZIP of images may still be read, but don't rely on it.

Verify it worked before doing any design. First message in the project:

> Describe what you can see in the Workbench reference PDF — the disk icon
> construction, bevel treatment, and how dithering is used.

A concrete answer means vision is working. A vague or generic one means it
isn't, and you should attach the images directly to each conversation instead
(in-chat attachments are always processed visually).

---

## 5. After 3–5 conversations, revise the instructions

Whatever Claude keeps getting wrong, add as an explicit `Do NOT`. Whatever it
keeps asking you, add to the brief. The first version is never the final one.

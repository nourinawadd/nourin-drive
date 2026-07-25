# Workbench Icon Design Brief

Paste this whole file into a **fresh claude.ai conversation** as the first message,
along with 3–5 reference screenshots of real Amiga Workbench 3.1 icons.
Then request icons **one at a time**.

---

## Project context

A personal portfolio site styled as an Amiga Workbench 3.1 desktop. Icons are
inline SVG pixel art rendered in React. Everything must read as authentic
1992-era Workbench: hard-edge pixels, chunky 1px bevels, ordered dithering,
a locked 4-bit-feeling palette.

## The palette — LOCKED, no other colors allowed

| Key | Hex | Role |
|-----|-----|------|
| `.` | transparent | outside the icon silhouette |
| `K` | `#000000` | outlines, lo-light bevel |
| `W` | `#ffffff` | hi-light bevel, paper, text-on-dark |
| `L` | `#cfcfcf` | light grey — top/left lit face |
| `G` | `#aaaaaa` | mid grey — main body face |
| `D` | `#888888` | grey shadow face |
| `S` | `#555555` | core shadow, soft linework |
| `B` | `#0055aa` | Workbench blue |
| `N` | `#114488` | blue dither lo |
| `H` | `#2266bb` | blue dither hi |
| `E` | `#3b67a4` | steel / label bands |
| `O` | `#ff8800` | selection + focus accent |
| `o` | `#cc6611` | orange shadow |
| `R` | `#cc3333` | red |
| `r` | `#882222` | red shadow |
| `T` | `#22aa77` | teal |
| `t` | `#117755` | teal shadow |
| `A` | `#c9a06a` | tan — wood / paper / sand |
| `a` | `#8e6e45` | tan shadow |
| `P` | `#8866cc` | purple |
| `p` | `#553388` | purple shadow |
| `Y` | `#ffcc55` | lit edge on warm tones |

Every pixel must be one of these keys. No blends, no gradients, no new hexes.

## Output format — character grids, NOT SVG rects

Return each icon as a JSON object that drops straight into the `grids` block of
`client/src/data/icon-grids.json`. One character per pixel:

```json
"DRIVE_SYSTEM": {
  "w": 56,
  "h": 40,
  "scale": 2,
  "symmetric": false,
  "rows": [
    "..KKKKKKKKKKKKKK..",
    ".KWWWWWWWWWWWWWWK.",
    ".KWLLLLLLLLLLLLGK."
  ]
}
```

Set `"symmetric": true` only when the icon really is meant to mirror
left-to-right — the linter enforces it exactly when that flag is on.

Here is a known-good grid already in the file, as a format reference:

```json
"GLYPH_CLOSE": {
  "w": 14, "h": 14, "scale": 1, "symmetric": true,
  "rows": [
    "..............", "..............", "..............",
    "...KK....KK...", "....KK..KK....", ".....KKKK.....",
    "......KK......",
    ".....KKKK.....", "....KK..KK....", "...KK....KK...",
    "..............", "..............", "..............", ".............."
  ]
}
```

Rules for the grid:

- **Every row must have exactly the same length.** State the width and height
  above the grid and confirm the row count matches.
- Use `.` for transparent. Never leave a stray space.
- Draw the full silhouette outline in `K` before filling faces.
- Light source is **top-left**: `W` or `L` on top/left edges, `S` or `K` on
  bottom/right edges. Be consistent across the whole icon set.
- Dithering is a checkerboard of **2×2 pixel blocks**, never single pixels and
  never a random scatter. A block starting at an even `x` and even `y` takes
  colour A when `((x / 2) + (y / 2)) % 2 === 0`, otherwise colour B — so a
  dithered row reads `AABBAABBAABB`, and the row below it is the *same* phase
  (the pattern only flips every second row). Written out:

  ```
  AABBAABBAABB      <- y even
  AABBAABBAABB      <- y odd, same as above
  BBAABBAABBAA      <- y+2
  BBAABBAABBAA
  ```

  This is what `dither()` in `client/src/components/os/icons.tsx` emits, and it
  is what the existing icons use. A 1px `ABABAB` checker is **wrong** — it is a
  finer texture that reads as flat grey at 1× and shimmers when scaled.

## Target sizes — must be exact

| Icon family | Grid size | `scale` | Displayed at |
|-------------|-----------|---------|--------------|
| Drive / volume icons | **56 × 40** | 2 | 112 × 80 (in a 120px cell) |
| Dock icons | **28 × 28** | 2 | 56 × 56 (in a 72px tile) |
| Window control glyphs | **14 × 14** | 1 | 14 × 14 |
| File / list mini-icons | **16 × 16** | 1 | 16 × 16 |

Do not deviate. Every display size is an **integer multiple** of the grid, which
is what keeps the pixels crisp — fractional scaling was the original source of
seams and doubled outlines in this project, and it is now designed out.

## The icon set

**Drive / volume icons (56 × 40)** — each is a drive-unit shell with a coloured
label band across the top and a distinct illustration on the face:

1. `SYSTEM` — boot volume
2. `USER` — personal / profile volume
3. `DRAWER` — a folder / drawer
4. `JOYSTICK` — games
5. `PHOTO` — photography
6. `NOTEPAD` — blog / writing
7. `QUILL` — guestbook
8. `MUSIC` — music player
9. `TRASHCAN` — trash

**Dock icons (28 × 28)** — bolder, fewer details, must read at a glance:

1. Trash
2. Globe (browser)
3. Drawer with magnifier (file finder)
4. Note (notepad)
5. Terminal
6. Music

**Glyphs (14 × 14)** — minimize, maximize, restore, close.

## Hard constraints — these are where it usually goes wrong

1. **Symmetry must be exact.** If a shape is meant to be symmetric, the left and
   right halves must be mirror images character-for-character. Verify before
   returning.
2. **1px lines stay 1px.** No accidental 2px outlines on one side.
3. **No orphan pixels** — no single coloured pixel floating with transparent or
   mismatched neighbours on all four sides, unless it is deliberate specular
   highlight.
4. **Closed outlines.** No gaps in the `K` silhouette that let the fill leak.
5. **Consistent bevel depth** across every icon in a family — the same 1px
   `W` top-left / `S` bottom-right treatment everywhere.
6. **Readable at 1×.** Squint at the grid. If the subject is not identifiable
   without the label, simplify it — remove detail rather than adding it.

## Working method — please follow this order

1. First, **draw only the shared drive-unit shell** (the empty chassis + label
   band) and show it to me. We lock that before anything else.
2. Then do **one illustration at a time**, dropped into the locked shell.
3. After each icon, **render it in an HTML artifact** showing it at 1×, 2×, and
   8× side by side on both the `#0055aa` desktop blue and on white, so I can
   judge it the way it will actually appear.
4. In that same artifact, run an automatic **lint pass** and print the results:
   - row count matches `h`, every row is exactly `w` characters
   - every character is a valid palette key
   - horizontal symmetry check when `symmetric` is true (report the first
     mismatched row)
   - orphan-pixel count (a solid pixel with no solid neighbour on any side)
   - **corner-only strokes** — group each colour into 8-connected blobs, then
     re-split each blob using 4-connectivity. A blob that breaks into two or
     more pieces is a diagonal line: it looks like a stroke at 8× and like
     loose dots at 1×. Skip blobs whose pieces are all 2×2 tiles — that is
     dither, and it is meant to be separate.
   - **open outlines** — take the largest 4-connected patch of the field
     colour (`W` on the drive units) as background, group everything else
     into 8-connected objects, ignore any object that reaches the transparent
     edge (that is the chassis), and require every remaining object pixel
     touching the background to be `K`.
   - list of every distinct palette character used
5. If a check fails, fix it and re-render before moving on.

These are the same checks the repo runs — mirroring them in the artifact just
means I catch problems before pasting rather than after.

## Artifact renderer

Render the grids to a `<canvas>` at 1:1 (one grid pixel = one canvas pixel),
then scale up with CSS `image-rendering: pixelated` at integer factors only.
Do **not** render one `<rect>` per pixel and scale the SVG — that is exactly
what produces seams and doubled edges.

---

## How this lands in the repo (for reference — you don't do this part)

1. Paste the JSON into the `grids` block of `client/src/data/icon-grids.json`.
2. Run `npm run lint:icons` from `client/` — it re-checks every grid and prints
   each one in colour in the terminal.
3. Render it with `<PixelIcon name="DRIVE_SYSTEM" />` from
   `client/src/components/os/pixelGrid.tsx`.

The old rect-based icons in `client/src/components/os/icons.tsx` keep working
throughout — swap one icon at a time by changing what the component returns.
Consumers import by component name, so `Dock.tsx`, `DriveColumn.tsx`,
`Explorer.tsx` and `WindowFrame.tsx` never need to change.

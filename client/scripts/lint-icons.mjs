// Validates the character-grid icon art in src/data/icon-grids.json and
// prints each grid to the terminal in colour, so you can check a new icon
// without starting the app. Run: npm run lint:icons
//
// Pixel art fails in quiet, specific ways - a row one character short, a
// stray colour that isn't in the Workbench palette, a mirrored shape that
// isn't quite mirrored, a lone pixel floating in space. Every one of those
// reads as "the icon looks a bit off" and none of them are obvious in a diff.
// This catches them before they ship.
//
// ERRORS (exit 1) - malformed grid: bad dimensions, unknown palette char.
// WARNINGS (exit 0) - suspicious but sometimes deliberate: asymmetry on a
//                     grid marked "symmetric", orphan pixels, corner-only
//                     strokes, an object sitting on the field with no outline.
//
// Pass a path to lint a candidate file instead of the committed one:
//   node scripts/lint-icons.mjs /tmp/draft.json

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] ?? join(here, "..", "src", "data", "icon-grids.json");

const { palette, grids } = JSON.parse(readFileSync(file, "utf8"));

// ── terminal colour ────────────────────────────────────────────────────
const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const bg = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  return `\x1b[48;2;${r};${g};${b}m`;
};
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";

/** Two spaces per pixel keeps the preview roughly square in a terminal. */
function preview(rows) {
  return rows
    .map((row) => {
      let out = "";
      for (const ch of row) {
        const hex = palette[ch]?.hex;
        out += hex ? bg(hex) + "  " + RESET : DIM + " ." + RESET;
      }
      return "  " + out;
    })
    .join("\n");
}

// ── connected components ───────────────────────────────────────────────
// Both of the shape checks below are component problems, so they share one
// flood fill. Keys are "x,y" strings; N4 is edge adjacency (what the eye
// reads as a continuous stroke), N8 adds the diagonals.
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]];
const at = (x, y) => `${x},${y}`;
const xy = (k) => k.split(",").map(Number);

function components(keys, neighbourhood) {
  const left = new Set(keys);
  const out = [];
  for (const start of keys) {
    if (!left.has(start)) continue;
    left.delete(start);
    const comp = [start];
    const stack = [start];
    while (stack.length) {
      const [x, y] = xy(stack.pop());
      for (const [dx, dy] of neighbourhood) {
        const n = at(x + dx, y + dy);
        if (left.has(n)) { left.delete(n); comp.push(n); stack.push(n); }
      }
    }
    out.push(comp);
  }
  return out;
}

/** Topmost-then-leftmost pixel, so the reported coordinate is findable. */
function anchor(comp) {
  return comp
    .map(xy)
    .sort((p, q) => p[1] - q[1] || p[0] - q[0])[0];
}

/** A dither tile: exactly four pixels filling a 2×2 box. */
function isDitherTile(comp) {
  if (comp.length !== 4) return false;
  const pts = comp.map(xy);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return Math.max(...xs) - Math.min(...xs) === 1 && Math.max(...ys) - Math.min(...ys) === 1;
}

// ── checks ─────────────────────────────────────────────────────────────
function lint(name, grid) {
  const errors = [];
  const warnings = [];
  const { w, h, rows, scale, symmetric, field } = grid;

  if (!Number.isInteger(scale) || scale < 1) {
    errors.push(`scale must be a positive integer, got ${scale}`);
  }

  if (rows.length !== h) {
    errors.push(`declared h=${h} but has ${rows.length} rows`);
  }

  rows.forEach((row, y) => {
    if (row.length !== w) {
      errors.push(`row ${y} is ${row.length} chars, expected w=${w}`);
    }
    for (let x = 0; x < row.length; x++) {
      if (!(row[x] in palette)) {
        errors.push(`row ${y} col ${x}: '${row[x]}' is not a palette character`);
      }
    }
  });

  // Bail before the pixel-level checks if the shape itself is wrong.
  // Otherwise they produce noise derived from the same root cause.
  if (errors.length) return { errors, warnings, colors: [] };

  if (symmetric) {
    for (let y = 0; y < rows.length; y++) {
      const mirrored = [...rows[y]].reverse().join("");
      if (mirrored !== rows[y]) {
        warnings.push(`row ${y} is not horizontally symmetric (grid is marked symmetric)`);
        break; // first offending row is enough to go fix it
      }
    }
  }

  const solid = (x, y) =>
    y >= 0 && y < rows.length && x >= 0 && x < w && rows[y][x] !== ".";

  let orphans = 0;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < w; x++) {
      if (!solid(x, y)) continue;
      if (!solid(x - 1, y) && !solid(x + 1, y) && !solid(x, y - 1) && !solid(x, y + 1)) {
        orphans++;
      }
    }
  }
  if (orphans > 0) {
    warnings.push(
      `${orphans} orphan pixel${orphans > 1 ? "s" : ""} (no solid neighbour on any side) - deliberate highlight, or a mistake?`,
    );
  }

  // Corner-only strokes. A run of pixels that touches its own colour only
  // diagonally looks like a line at 8× and like scattered dots at 1×, which
  // is the size that actually ships. Split each colour into 8-connected
  // blobs, then see whether a blob falls apart under 4-connectivity.
  // Dither is the legitimate exception - its tiles are meant to be separate,
  // so a blob made entirely of 2×2 tiles is left alone.
  const byColor = new Map();
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === ".") continue;
      if (!byColor.has(ch)) byColor.set(ch, []);
      byColor.get(ch).push(at(x, y));
    }
  }
  for (const [ch, keys] of byColor) {
    for (const blob of components(keys, N8)) {
      if (blob.length < 2) continue;
      const pieces = components(blob, N4);
      if (pieces.length < 2) continue;
      if (pieces.every(isDitherTile)) continue;
      const [x, y] = anchor(blob);
      warnings.push(
        `'${ch}' stroke near x${x},y${y} joins only at corners - ${pieces.length} pieces that never share an edge. Reads as loose dots at 1×; thicken it or shift a pixel so the run connects.`,
      );
    }
  }

  // Open outlines against the illustration field. Only meaningful for grids
  // that declare one (`"field": "W"` on the drive units, whose art sits on a
  // white face) - everything else skips this.
  //
  // The field is its largest 4-connected patch, so a highlight drawn IN the
  // field colour inside an object doesn't count as background. Anything that
  // isn't field and isn't transparent is grouped into objects; an object
  // touching transparency is the chassis or the silhouette itself and is
  // exempt. What's left floats on the field, and every pixel of it that
  // borders the field has to be K, or the shape has no edge.
  if (field && byColor.has(field)) {
    const patches = components(byColor.get(field), N4)
      .sort((a, b) => b.length - a.length);
    const bg = new Set(patches[0]);

    const objectPixels = [];
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < w; x++) {
        if (rows[y][x] === "." || bg.has(at(x, y))) continue;
        objectPixels.push(at(x, y));
      }
    }
    const clear = (x, y) =>
      y < 0 || y >= rows.length || x < 0 || x >= w || rows[y][x] === ".";

    for (const obj of components(objectPixels, N8)) {
      if (obj.some((k) => { const [x, y] = xy(k); return N4.some(([dx, dy]) => clear(x + dx, y + dy)); })) {
        continue; // reaches the outside - it's the chassis, not a floating object
      }
      const open = obj.filter((k) => {
        const [x, y] = xy(k);
        if (rows[y][x] === "K") return false;
        return N4.some(([dx, dy]) => bg.has(at(x + dx, y + dy)));
      });
      if (!open.length) continue;
      const [x, y] = anchor(open);
      const shades = [...new Set(open.map((k) => { const [a, b] = xy(k); return rows[b][a]; }))].sort();
      warnings.push(
        `${open.length} pixel(s) meet the '${field}' field with no K outline (${shades.join(" ")}), first at x${x},y${y} - the silhouette is open there.`,
      );
    }
  }

  const colors = [...new Set(rows.join("").split(""))].filter((c) => c !== ".").sort();

  return { errors, warnings, colors };
}

// ── run ────────────────────────────────────────────────────────────────
const names = Object.keys(grids);
let totalErrors = 0;
let totalWarnings = 0;

console.log(`\n${BOLD}icon-grids.json${RESET} ${DIM} - ${names.length} grid(s)${RESET}\n`);

for (const name of names) {
  const grid = grids[name];
  const { errors, warnings, colors } = lint(name, grid);
  totalErrors += errors.length;
  totalWarnings += warnings.length;

  const badge = errors.length ? `${RED}FAIL${RESET}` : warnings.length ? `${YELLOW}WARN${RESET}` : `${GREEN}ok${RESET}`;
  console.log(`${BOLD}${name}${RESET}  ${grid.w}×${grid.h} @${grid.scale}× → ${grid.w * grid.scale}×${grid.h * grid.scale}px  [${badge}]`);
  if (grid.note) console.log(`  ${DIM}${grid.note}${RESET}`);
  console.log();
  console.log(preview(grid.rows));
  console.log();
  if (colors.length) console.log(`  ${DIM}palette used: ${colors.join(" ")}${RESET}`);
  for (const e of errors) console.log(`  ${RED}error${RESET}  ${e}`);
  for (const w of warnings) console.log(`  ${YELLOW}warn${RESET}   ${w}`);
  console.log();
}

const summary = `${totalErrors} error(s), ${totalWarnings} warning(s)`;
if (totalErrors) {
  console.log(`${RED}${BOLD}${summary}${RESET}\n`);
  process.exit(1);
}
console.log(`${totalWarnings ? YELLOW : GREEN}${summary}${RESET}\n`);

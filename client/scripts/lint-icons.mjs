// Validates the character-grid icon art in src/data/icon-grids.json and
// prints each grid to the terminal in colour, so you can check a new icon
// without starting the app. Run: npm run lint:icons
//
// Pixel art fails in quiet, specific ways — a row one character short, a
// stray colour that isn't in the Workbench palette, a mirrored shape that
// isn't quite mirrored, a lone pixel floating in space. Every one of those
// reads as "the icon looks a bit off" and none of them are obvious in a diff.
// This catches them before they ship.
//
// ERRORS (exit 1)  — malformed grid: bad dimensions, unknown palette char.
// WARNINGS (exit 0) — suspicious but sometimes deliberate: asymmetry on a
//                     grid marked "symmetric", orphan pixels.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, "..", "src", "data", "icon-grids.json");

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

// ── checks ─────────────────────────────────────────────────────────────
function lint(name, grid) {
  const errors = [];
  const warnings = [];
  const { w, h, rows, scale, symmetric } = grid;

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

  // Bail before the pixel-level checks if the shape itself is wrong —
  // otherwise they produce noise derived from the same root cause.
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
      `${orphans} orphan pixel${orphans > 1 ? "s" : ""} (no solid neighbour on any side) — deliberate highlight, or a mistake?`,
    );
  }

  const colors = [...new Set(rows.join("").split(""))].filter((c) => c !== ".").sort();

  return { errors, warnings, colors };
}

// ── run ────────────────────────────────────────────────────────────────
const names = Object.keys(grids);
let totalErrors = 0;
let totalWarnings = 0;

console.log(`\n${BOLD}icon-grids.json${RESET} ${DIM}— ${names.length} grid(s)${RESET}\n`);

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

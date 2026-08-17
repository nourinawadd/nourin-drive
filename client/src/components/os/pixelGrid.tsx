// Character-grid pixel art - the format new Workbench icon art lands in.
// One character per pixel, mapped through the palette in
// src/data/icon-grids.json to the --wb-* tokens.
//
// Why grids instead of the hand-placed rect coordinates in icons.tsx: the art
// is legible in the source, symmetry is a string compare, an off-by-one is
// visible rather than inferred, and `npm run lint:icons` can prove a grid is
// well-formed before it ships. See docs/icon-design-brief.md to author them.

import { createElement, type ReactElement } from "react";
import gridData from "@/data/icon-grids.json";

export type Grid = {
  w: number;
  h: number;
  /** Default integer render factor. */
  scale: number;
  rows: string[];
  symmetric?: boolean;
  note?: string;
};

type PaletteEntry = { var: string | null; hex: string | null; role: string };

const data = gridData as unknown as {
  palette: Record<string, PaletteEntry>;
  grids: Record<string, Grid>;
};

export const GRIDS = data.grids;
export type GridName = keyof typeof GRIDS;

/** Char → CSS colour. `null` is transparent and emits no rect. */
export const PALETTE: Record<string, string | null> = Object.fromEntries(
  Object.entries(data.palette).map(([ch, e]) => [ch, e.var ? `var(${e.var})` : null]),
);

/**
 * Row-wise run-length encode: consecutive same-colour pixels collapse into a
 * single <rect>, so a 48×36 icon costs a few dozen nodes instead of ~1700.
 * Unknown characters are skipped here; lint:icons is what rejects them.
 */
export function gridRects(rows: string[]): ReactElement[] {
  const out: ReactElement[] = [];
  let key = 0;
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      const fill = PALETTE[ch];
      if (fill) {
        out.push(
          createElement("rect", { key: key++, x, y, width: run, height: 1, fill }),
        );
      }
      x += run;
    }
  });
  return out;
}

/**
 * Renders a named grid at an INTEGER multiple of its source size. The svg
 * carries its own width/height on purpose - never size these from CSS, or the
 * rects round to device pixels independently and you get seams, doubled 1px
 * outlines and moiré through dithered areas.
 */
export function PixelIcon({ name, scale }: { name: GridName; scale?: number }) {
  const grid = GRIDS[name];
  const s = Math.max(1, Math.round(scale ?? grid.scale));
  return createElement(
    "svg",
    {
      width: grid.w * s,
      height: grid.h * s,
      viewBox: `0 0 ${grid.w} ${grid.h}`,
      shapeRendering: "crispEdges",
      "aria-hidden": true,
      style: { display: "block" },
    },
    gridRects(grid.rows),
  );
}

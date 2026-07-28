// Detailed dithered pixel-art icon library — inline SVG, hard-edge rects.
// Ported faithfully from the Claude Design "PixelBench" handoff bundle
// (icons.js). Built from concise helpers — r() rect, g() group, svg() root,
// dither() 2px ordered checker — so the art stays dense but editable.
// All colors resolve from the --wb-* CSS vars in tokens.css.

import { createElement, type ReactElement } from "react";
import type { ProjectCategory } from "@/data/projects";
import { PixelIcon } from "@/components/os/pixelGrid";

type El = ReactElement;

const css = (name: string) => `var(--wb-${name})`;
const C = {
  blue: css("blue"), blue2: css("blue-2"), blue3: css("blue-3"),
  steel: css("steel"),
  gray0: css("gray-0"), gray: css("gray"), gray2: css("gray-2"), gray3: css("gray-3"),
  white: css("white"), black: css("black"),
  orange: css("orange"), orangeD: css("orange-d"),
  red: css("red"), redD: css("red-d"),
  teal: css("teal"), tealD: css("teal-d"),
  tan: css("tan"), tanD: css("tan-d"),
  purple: css("purple"), purpleD: css("purple-d"),
  yellow: css("yellow"),
};

let _k = 0;
function r(x: number, y: number, w: number, h: number, fill: string): El {
  return createElement("rect", { key: _k++, x, y, width: w, height: h, fill });
}
function g(...kids: (El | El[])[]): El {
  return createElement("g", { key: _k++ }, kids.flat());
}
// Pixel art only stays crisp at INTEGER scale. The viewBox keeps the source
// grid, `scale` fixes the rendered size — never size these from CSS, or the
// rects round to device pixels independently and you get seams, doubled
// outlines and moiré across dither().
function svg(w: number, h: number, kids: (El | El[])[], scale = 1): El {
  return createElement(
    "svg",
    {
      width: w * scale,
      height: h * scale,
      viewBox: `0 0 ${w} ${h}`,
      shapeRendering: "crispEdges",
      "aria-hidden": true,
    },
    kids,
  );
}
// Drive units: 56×40 source at 2× → 112×80.
// Dock tiles:  28×28 source at 2× → 56×56, inside a 72px tile.
// 2× is the only integer step that reads at the intended size — 1× is too
// small, and anything between is fractional, which is what caused the seams.
// New grid art targets these same source sizes (docs/icon-design-brief.md).
const driveSvg = (kids: (El | El[])[]): El => svg(56, 40, kids, 2);
const dockSvg = (kids: (El | El[])[]): El => svg(28, 28, kids, 2);
function dither(x: number, y: number, w: number, h: number, a: string, b: string, off = 0): El {
  const cells: El[] = [];
  for (let yy = 0; yy < h; yy += 2) {
    for (let xx = 0; xx < w; xx += 2) {
      const cw = Math.min(2, w - xx);
      const ch = Math.min(2, h - yy);
      const isA = (((xx >> 1) + (yy >> 1) + off) & 1) === 0;
      cells.push(r(x + xx, y + yy, cw, ch, isA ? a : b));
    }
  }
  return g(cells);
}

// ── DRIVE-UNIT SHELL ───────────────────────────────────────────────────
function shell(band: string, illustration: El): El[] {
  return [
    r(4, 38, 50, 1, C.black),
    r(53, 3, 1, 36, C.black),
    r(3, 2, 50, 37, C.black),
    r(4, 3, 48, 35, C.gray0),
    r(4, 3, 48, 1, C.white),
    r(4, 3, 1, 35, C.white),
    r(51, 3, 1, 35, C.gray3),
    r(4, 37, 48, 1, C.gray3),
    r(5, 4, 46, 6, band),
    r(5, 4, 46, 1, C.white),
    r(5, 9, 46, 1, C.black),
    dither(5, 6, 46, 2, band, C.white),
    r(47, 6, 2, 2, C.teal),
    r(47, 6, 1, 1, C.white),
    r(5, 10, 46, 20, C.white),
    r(5, 10, 46, 1, C.gray0),
    r(5, 29, 46, 1, C.gray),
    dither(47, 11, 4, 18, C.white, C.gray0),
    r(5, 30, 46, 7, C.gray),
    r(5, 30, 46, 1, C.black),
    dither(5, 31, 46, 2, C.gray, C.gray0),
    r(9, 33, 38, 4, C.black),
    r(10, 34, 36, 2, C.gray3),
    r(14, 34, 28, 2, C.gray0),
    r(14, 34, 1, 2, C.black),
    r(41, 34, 1, 2, C.black),
    r(20, 35, 2, 1, C.black),
    illustration,
  ];
}

export function IconFloppySystem() {
  const emblem: El[] = [];
  const cols = [C.red, C.orange, C.yellow, C.teal, C.blue3, C.purple];
  for (let i = 0; i < cols.length; i++) {
    emblem.push(r(9 + i * 2, 13, 2, 6, cols[i]));
    emblem.push(r(9 + i * 2, 13, 2, 1, C.white));
  }
  const ill = g(
    ...emblem,
    r(8, 13, 1, 6, C.black), r(21, 13, 1, 6, C.black),
    r(8, 12, 14, 1, C.black), r(8, 19, 14, 1, C.black),
    r(24, 13, 22, 3, C.black),
    r(26, 14, 2, 1, C.orange), r(29, 14, 2, 1, C.orange),
    r(32, 14, 2, 1, C.orange), r(35, 14, 2, 1, C.orange),
    r(38, 14, 6, 1, C.orange),
    r(24, 18, 22, 1, C.gray3), r(24, 21, 22, 1, C.gray3),
    r(24, 24, 16, 1, C.gray3), r(24, 27, 20, 1, C.gray3),
    r(8, 24, 12, 1, C.gray3), r(8, 27, 10, 1, C.gray3),
  );
  return driveSvg(shell(C.steel, ill));
}

export function IconFloppyUser() {
  const ill = g(
    // ── head ──
    r(25, 12, 6, 6, C.blue),
    r(26, 11, 4, 1, C.blue),          // rounded crown
    r(26, 18, 4, 1, C.blue),          // rounded chin
    r(25, 12, 6, 1, C.blue3),         // highlight
    r(26, 10, 4, 1, C.black),         // top outline
    r(24, 11, 1, 8, C.black),         // left outline
    r(31, 11, 1, 8, C.black),         // right outline
    r(26, 19, 4, 1, C.black),         // chin outline
    // ── shoulders / bust ──
    r(20, 22, 16, 7, C.blue),
    r(22, 21, 12, 1, C.blue),         // rounded shoulder top
    r(20, 22, 16, 1, C.blue3),        // highlight
    r(22, 20, 12, 1, C.black),        // top outline
    r(20, 21, 2, 1, C.black),
    r(34, 21, 2, 1, C.black),
    r(19, 22, 1, 7, C.black),         // left outline
    r(36, 22, 1, 7, C.black),         // right outline
  );
  return driveSvg(shell(C.steel, ill));
}

export function IconFloppyBook() {
  // Same open book as the dock tile, scaled up to fill the drive unit's face.
  const ill = g(
    r(14, 12, 28, 17, C.black),      // outline
    r(15, 13, 12, 15, C.white),      // left page
    r(15, 13, 12, 1, C.gray0),
    r(29, 13, 12, 15, C.white),      // right page
    r(29, 13, 12, 1, C.gray0),
    r(27, 13, 2, 15, C.tan),         // spine
    r(27, 13, 1, 15, C.yellow),
    r(28, 13, 1, 15, C.tanD),
    r(17, 16, 8, 1, C.gray3),        // ── left page text ──
    r(17, 19, 8, 1, C.gray3),
    r(17, 22, 5, 1, C.gray3),
    r(17, 25, 8, 1, C.gray3),
    r(31, 16, 8, 1, C.gray3),        // ── right page text ──
    r(31, 19, 5, 1, C.gray3),
    r(31, 22, 8, 1, C.gray3),
    r(31, 25, 6, 1, C.gray3),
  );
  return driveSvg(shell(C.tan, ill));
}

export function IconDrawer() {
  return driveSvg([
    r(4, 38, 50, 1, C.black), r(53, 3, 1, 36, C.black),
    r(3, 2, 50, 37, C.black),
    r(4, 3, 48, 35, C.gray0),
    r(4, 3, 48, 1, C.white), r(4, 3, 1, 35, C.white),
    r(51, 3, 1, 35, C.gray3), r(4, 37, 48, 1, C.gray3),
    r(5, 4, 46, 5, C.tan),
    r(5, 4, 46, 1, C.white),
    dither(5, 6, 46, 2, C.tan, C.yellow),
    r(5, 8, 46, 1, C.tanD),
    r(6, 10, 44, 22, C.black),
    r(7, 28, 42, 4, C.gray3),
    dither(7, 26, 42, 2, C.gray3, C.gray),
    dither(9, 12, 38, 3, C.gray3, C.gray2),
    r(9, 13, 36, 13, C.tan),
    r(9, 13, 36, 1, C.yellow), r(9, 13, 1, 13, C.yellow),
    r(44, 13, 1, 13, C.tanD), r(9, 25, 36, 1, C.tanD),
    r(11, 11, 9, 2, C.tan), r(11, 11, 9, 1, C.yellow),
    r(11, 11, 1, 2, C.black), r(19, 11, 1, 2, C.black),
    r(10, 11, 11, 1, C.black),
    r(11, 16, 34, 11, C.gray0),
    r(11, 16, 34, 1, C.white), r(11, 16, 1, 11, C.white),
    r(44, 16, 1, 11, C.gray2), r(11, 26, 34, 1, C.gray2),
    r(22, 14, 9, 2, C.gray0), r(22, 14, 9, 1, C.white),
    r(22, 14, 1, 2, C.black), r(30, 14, 1, 2, C.black),
    r(21, 14, 11, 1, C.black),
    r(13, 19, 32, 9, C.orange),
    r(13, 19, 32, 1, C.yellow), r(13, 19, 1, 9, C.yellow),
    r(44, 19, 1, 9, C.orangeD), r(13, 27, 32, 1, C.orangeD),
    r(33, 17, 9, 2, C.orange), r(33, 17, 9, 1, C.yellow),
    r(33, 17, 1, 2, C.black), r(41, 17, 1, 2, C.black),
    r(32, 17, 11, 1, C.black),
    r(15, 22, 14, 1, C.black), r(15, 24, 10, 1, C.black),
    r(6, 10, 44, 1, C.black), r(6, 10, 1, 22, C.black),
    r(49, 10, 1, 22, C.black),
    r(5, 32, 46, 6, C.tan),
    r(5, 32, 46, 1, C.yellow),
    dither(5, 33, 46, 2, C.tan, C.yellow),
    r(5, 37, 46, 1, C.tanD),
    r(23, 34, 10, 3, C.gray3),
    r(23, 34, 10, 1, C.black),
    r(23, 34, 1, 3, C.black), r(32, 34, 1, 3, C.black),
    r(24, 35, 8, 1, C.gray0),
  ]);
}

export function IconFloppyJoystick() {
  const ill = g(
    r(14, 22, 22, 6, C.gray),
    r(14, 22, 22, 1, C.white), r(14, 22, 1, 6, C.white),
    r(35, 22, 1, 6, C.gray3), r(14, 27, 22, 1, C.gray3),
    dither(15, 23, 20, 2, C.gray, C.gray0),
    dither(15, 25, 20, 2, C.gray, C.gray2),
    r(13, 22, 1, 6, C.black), r(36, 22, 1, 6, C.black),
    r(13, 28, 24, 1, C.black), r(13, 21, 24, 1, C.black),
    r(28, 24, 3, 2, C.orange),
    r(28, 24, 3, 1, C.yellow),
    r(27, 24, 1, 2, C.black), r(31, 24, 1, 2, C.black),
    r(19, 14, 3, 8, C.gray3),
    r(19, 14, 1, 8, C.black), r(22, 14, 1, 8, C.black),
    r(20, 14, 1, 8, C.gray2),
    r(16, 11, 9, 5, C.red),
    r(16, 11, 9, 1, C.orange), r(16, 11, 1, 5, C.orange),
    r(24, 11, 1, 5, C.redD), r(16, 15, 9, 1, C.redD),
    dither(17, 12, 7, 2, C.red, C.orange),
    r(15, 11, 1, 5, C.black), r(25, 11, 1, 5, C.black),
    r(15, 10, 11, 1, C.black), r(15, 16, 11, 1, C.black),
    r(37, 24, 2, 1, C.black), r(38, 23, 1, 3, C.black),
    r(10, 24, 2, 1, C.black), r(10, 23, 1, 3, C.black),
  );
  return driveSvg(shell(C.red, ill));
}

export function IconFloppyPhoto() {
  const mtnBack: El[] = [];
  const mtnHeights = [2, 3, 4, 5, 4, 3, 2, 3, 4, 5, 4, 3, 2];
  for (let i = 0; i < mtnHeights.length; i++) {
    mtnBack.push(r(11 + i * 2, 22 - mtnHeights[i], 2, mtnHeights[i], C.blue));
  }
  const mtnFront = [
    r(10, 22, 1, 3, C.tealD),
    r(11, 21, 3, 4, C.tealD),
    r(14, 22, 3, 3, C.tealD),
    r(17, 21, 5, 4, C.tealD),
    r(22, 22, 4, 3, C.tealD),
    r(26, 21, 6, 4, C.tealD),
    r(32, 22, 5, 3, C.tealD),
    r(37, 21, 9, 4, C.tealD),
  ];
  const ill = g(
    r(9, 12, 38, 16, C.black),
    dither(10, 13, 36, 2, C.white, C.teal),
    dither(10, 15, 36, 2, C.teal, C.white, 1),
    r(10, 17, 36, 2, C.teal),
    dither(10, 19, 36, 2, C.teal, C.tealD),
    r(36, 14, 6, 6, C.yellow),
    r(36, 14, 6, 1, C.white),
    r(37, 13, 4, 1, C.yellow),
    r(37, 20, 4, 1, C.orange),
    ...mtnBack,
    r(17, 17, 2, 1, C.white), r(29, 17, 2, 1, C.white),
    ...mtnFront,
    r(10, 25, 36, 3, C.tan),
    dither(10, 25, 36, 2, C.tan, C.yellow),
    r(10, 27, 36, 1, C.tanD),
    r(13, 26, 2, 1, C.black), r(20, 26, 3, 1, C.black),
    r(28, 26, 2, 1, C.black), r(35, 26, 3, 1, C.black),
  );
  return driveSvg(shell(C.teal, ill));
}

export function IconFloppyNotepad() {
  const spiralHoles: El[] = [];
  for (const sx of [13, 18, 23, 28, 33, 38]) {
    spiralHoles.push(r(sx, 11, 2, 3, C.black));
    spiralHoles.push(r(sx, 11, 2, 1, C.gray3));
  }
  const ill = g(
    r(10, 12, 32, 17, C.white),
    r(10, 12, 32, 1, C.gray0), r(10, 12, 1, 17, C.gray0),
    r(41, 12, 1, 17, C.gray2), r(10, 28, 32, 1, C.gray2),
    dither(38, 13, 3, 15, C.white, C.gray0),
    r(9, 12, 1, 17, C.black), r(42, 12, 1, 17, C.black),
    r(9, 11, 34, 1, C.black), r(9, 29, 34, 1, C.black),
    ...spiralHoles,
    r(12, 17, 26, 1, C.steel), r(12, 20, 26, 1, C.steel),
    r(12, 23, 26, 1, C.steel), r(12, 26, 18, 1, C.steel),
    r(14, 16, 1, 12, C.red),
    r(32, 26, 2, 2, C.yellow),
    r(34, 25, 2, 2, C.tan),
    r(36, 25, 1, 2, C.tanD),
    r(36, 24, 2, 2, C.tan),
    r(38, 24, 2, 2, C.tanD),
    r(40, 24, 1, 1, C.gray3),
  );
  return driveSvg(shell(C.gray3, ill));
}

export function IconFloppyTerminal() {
  const ill = g(
    r(9, 12, 34, 17, C.black),          // bezel
    r(10, 13, 32, 15, C.blue2),         // screen
    r(10, 13, 32, 1, C.blue),           // scanline glow along the top
    r(12, 16, 2, 1, C.teal),            // "›" prompt, kept edge-connected so it
    r(13, 17, 2, 1, C.teal),            // reads as a stroke and not three dots
    r(12, 18, 2, 1, C.teal),
    r(16, 18, 9, 1, C.white),
    r(12, 21, 4, 1, C.orange),
    r(17, 21, 13, 1, C.gray0),
    r(12, 24, 6, 1, C.teal),
    r(19, 24, 10, 1, C.gray0),
    r(12, 26, 3, 2, C.white),           // cursor block
  );
  return driveSvg(shell(C.teal, ill));
}

export function IconFloppyGlobe() {
  const ill = g(
    r(20, 11, 12, 1, C.black),          // silhouette, rounded top to bottom
    r(18, 12, 16, 1, C.black),
    r(17, 13, 18, 1, C.black),
    r(16, 14, 20, 12, C.black),
    r(17, 26, 18, 1, C.black),
    r(18, 27, 16, 1, C.black),
    r(20, 28, 12, 1, C.black),
    r(20, 12, 12, 1, C.blue3),          // ── fill, inset one pixel ──
    r(18, 13, 16, 1, C.blue3),
    r(17, 14, 18, 12, C.blue3),
    r(18, 26, 16, 1, C.blue3),
    r(20, 27, 12, 1, C.blue3),
    r(17, 19, 18, 1, C.blue2),          // equator
    r(25, 12, 1, 16, C.blue2),          // prime meridian
    r(20, 15, 1, 10, C.blue2),
    r(31, 15, 1, 10, C.blue2),
    r(19, 14, 5, 1, C.white),           // gloss
    r(19, 15, 2, 1, C.white),
  );
  return driveSvg(shell(C.blue3, ill));
}

export function IconFloppyQuill() {
  const ill = g(
    r(9, 20, 34, 1, C.gray2),
    r(9, 14, 34, 7, C.white),
    r(25, 14, 2, 7, C.gray3),
    r(25, 14, 2, 1, C.gray2),
    r(9, 14, 1, 7, C.gray0), r(9, 14, 16, 1, C.gray0),
    r(9, 20, 16, 1, C.gray2),
    r(27, 14, 1, 7, C.gray0), r(27, 14, 16, 1, C.gray0),
    r(27, 20, 16, 1, C.gray2), r(42, 14, 1, 7, C.gray2),
    r(8, 14, 1, 7, C.black), r(43, 14, 1, 7, C.black),
    r(8, 13, 36, 1, C.black), r(8, 21, 36, 1, C.black),
    r(11, 16, 2, 1, C.black), r(13, 15, 4, 1, C.black),
    r(17, 16, 2, 1, C.black), r(19, 17, 2, 1, C.black),
    r(11, 19, 4, 1, C.gray3), r(16, 18, 6, 1, C.gray3),
    r(29, 15, 4, 1, C.black), r(33, 16, 4, 1, C.black),
    r(29, 18, 8, 1, C.gray3), r(29, 19, 5, 1, C.gray3),
    r(36, 22, 8, 6, C.gray3),
    r(36, 22, 8, 1, C.gray2), r(36, 22, 1, 6, C.gray2),
    r(43, 22, 1, 6, C.black), r(36, 27, 8, 1, C.black),
    r(35, 22, 1, 6, C.black), r(37, 22, 6, 1, C.black),
    r(38, 22, 4, 1, C.purpleD),
    r(38, 23, 4, 1, C.purple),
    r(37, 23, 2, 1, C.tan), r(35, 24, 2, 1, C.tan),
    r(33, 25, 2, 1, C.tan), r(31, 26, 2, 1, C.tan),
    r(29, 27, 2, 1, C.tan),
    r(34, 23, 1, 1, C.white), r(32, 24, 1, 1, C.white),
    r(30, 25, 1, 1, C.white), r(28, 26, 1, 1, C.white),
    r(36, 22, 1, 1, C.tanD), r(34, 24, 1, 1, C.tanD),
    r(32, 25, 1, 1, C.tanD),
    r(28, 28, 2, 1, C.black),
  );
  return driveSvg(shell(C.purple, ill));
}

export function IconFloppyMusic() {
  const bars: El[] = [];
  const heights = [6, 11, 8, 14, 9, 12];
  for (let i = 0; i < heights.length; i++) {
    const x = 10 + i * 4;
    const h = heights[i];
    const y = 27 - h;
    bars.push(r(x, y, 3, h, C.teal));
    bars.push(r(x, y, 3, 1, C.white));
    bars.push(r(x, y, 1, h, C.white));
    bars.push(r(x + 2, y, 1, h, C.tealD));
  }
  const ill = g(
    ...bars,
    r(9, 28, 38, 1, C.gray3),       // baseline
    r(40, 12, 2, 11, C.black),      // note stem
    r(40, 12, 4, 3, C.black),       // note flag
    r(40, 12, 3, 2, C.orange),
    r(34, 21, 6, 4, C.black),       // note head
    r(35, 22, 4, 2, C.orange),
    r(35, 22, 4, 1, C.yellow),
  );
  return driveSvg(shell(C.blue3, ill));
}

export function IconFloppyStickies() {
  const ill = g(
    r(17, 12, 22, 17, C.yellow),        // note paper
    r(17, 12, 22, 1, C.white),          // top highlight
    r(17, 12, 1, 17, C.white),          // left highlight
    r(38, 12, 1, 17, C.orangeD),        // right shade
    r(17, 28, 22, 1, C.orangeD),        // bottom shade
    dither(18, 13, 20, 2, C.yellow, C.white),
    // handwriting lines
    r(20, 17, 16, 1, C.gray3),
    r(20, 20, 16, 1, C.gray3),
    r(20, 23, 16, 1, C.gray3),
    r(20, 26, 10, 1, C.gray3),
    // pin at the top — "stuck on"
    r(26, 10, 4, 3, C.red),
    r(26, 10, 4, 1, C.orange),
    r(27, 10, 1, 3, C.redD),
  );
  return driveSvg(shell(C.orange, ill));
}

function wastebasket(): El[] {
  const ribs: El[] = [];
  for (const rx of [8, 12, 16, 20]) {
    ribs.push(r(rx, 14, 1, 12, C.white));
    ribs.push(r(rx + 1, 14, 1, 12, C.gray3));
  }
  return [
    r(11, 4, 6, 3, C.white),
    r(11, 4, 6, 1, C.gray0),
    r(12, 3, 4, 1, C.white),
    r(10, 5, 1, 2, C.gray),
    r(17, 5, 1, 2, C.gray2),
    r(12, 5, 1, 1, C.gray2),
    r(15, 5, 1, 1, C.gray),
    r(11, 3, 1, 1, C.black), r(16, 3, 1, 1, C.black),
    r(10, 4, 1, 1, C.black), r(17, 4, 1, 1, C.black),
    r(4, 7, 20, 2, C.gray2),
    r(4, 7, 20, 1, C.gray),
    r(4, 8, 20, 1, C.gray3),
    r(3, 7, 1, 2, C.black), r(24, 7, 1, 2, C.black),
    r(4, 6, 20, 1, C.black),
    r(5, 9, 18, 17, C.gray),
    dither(5, 9, 3, 17, C.gray, C.gray0),
    dither(20, 9, 3, 17, C.gray, C.gray2),
    dither(8, 9, 12, 2, C.gray, C.gray0),
    dither(8, 23, 12, 3, C.gray, C.gray3),
    r(5, 11, 18, 3, C.orange),
    r(5, 11, 18, 1, C.yellow),
    r(5, 13, 18, 1, C.orangeD),
    dither(6, 12, 16, 1, C.orange, C.yellow),
    ...ribs,
    r(4, 9, 1, 17, C.black), r(23, 9, 1, 17, C.black),
    r(4, 26, 20, 1, C.black),
    r(5, 26, 18, 1, C.gray3),
    r(4, 26, 1, 1, C.black),
  ];
}

export function IconTrashcan() {
  return driveSvg([
    createElement("g", { key: "t", transform: "translate(14, 6)" }, wastebasket()),
    r(16, 36, 24, 1, C.gray3),
    dither(16, 37, 24, 1, C.gray3, C.gray),
  ]);
}

export function DockTrash() {
  return dockSvg(wastebasket());
}

export function DockGlobe() {
  return dockSvg([
    r(4, 13, 1, 3, C.gray3), r(23, 13, 1, 3, C.gray3),
    r(5, 11, 2, 1, C.gray3), r(21, 11, 2, 1, C.gray3),
    r(6, 17, 3, 1, C.gray3), r(19, 17, 3, 1, C.gray3),
    r(9, 10, 10, 1, C.gray3), r(10, 18, 8, 1, C.gray3),
    r(9, 4, 10, 1, C.black), r(9, 23, 10, 1, C.black),
    r(6, 6, 3, 1, C.black), r(19, 6, 3, 1, C.black),
    r(6, 21, 3, 1, C.black), r(19, 21, 3, 1, C.black),
    r(5, 7, 1, 3, C.black), r(22, 7, 1, 3, C.black),
    r(5, 18, 1, 3, C.black), r(22, 18, 1, 3, C.black),
    r(4, 10, 1, 8, C.black), r(23, 10, 1, 8, C.black),
    r(5, 10, 18, 8, C.blue),
    r(6, 7, 16, 3, C.blue),
    r(9, 5, 10, 2, C.blue),
    r(6, 18, 16, 3, C.blue),
    r(9, 21, 10, 2, C.blue),
    dither(6, 7, 16, 2, C.blue3, C.blue),
    dither(6, 19, 16, 2, C.blue2, C.blue),
    dither(5, 10, 2, 8, C.blue3, C.blue),
    dither(21, 10, 2, 8, C.blue2, C.blue),
    r(8, 9, 3, 1, C.teal),
    r(7, 10, 5, 2, C.teal),
    r(9, 12, 4, 2, C.teal),
    r(10, 14, 2, 1, C.teal),
    r(14, 11, 6, 2, C.teal),
    r(15, 13, 4, 2, C.teal),
    r(17, 15, 2, 2, C.teal),
    r(11, 17, 5, 2, C.teal),
    r(12, 19, 3, 1, C.teal),
    r(8, 10, 4, 1, C.yellow), r(14, 11, 5, 1, C.yellow),
    r(11, 17, 4, 1, C.yellow),
    r(8, 13, 4, 1, C.tealD), r(15, 14, 4, 1, C.tealD),
    r(12, 19, 3, 1, C.tealD),
    r(13, 5, 1, 18, C.white), r(14, 5, 1, 18, C.gray3),
    r(5, 14, 18, 1, C.white), r(5, 15, 18, 1, C.gray3),
    r(22, 5, 2, 2, C.orange), r(22, 5, 2, 1, C.yellow),
  ]);
}

export function DockDrawerMag() {
  return dockSvg([
    r(3, 6, 22, 18, C.black),
    r(4, 7, 20, 16, C.gray0),
    r(4, 7, 20, 1, C.white), r(4, 7, 1, 16, C.white),
    r(23, 7, 1, 16, C.gray2), r(4, 22, 20, 1, C.gray2),
    dither(5, 8, 18, 2, C.gray0, C.white),
    dither(5, 20, 18, 2, C.gray0, C.gray),
    r(7, 4, 10, 3, C.tan),
    r(7, 4, 10, 1, C.yellow),
    r(7, 4, 1, 3, C.black), r(16, 4, 1, 3, C.black),
    r(6, 4, 12, 1, C.black),
    r(7, 10, 14, 2, C.orange),
    r(7, 10, 14, 1, C.yellow),
    r(6, 10, 1, 2, C.black), r(21, 10, 1, 2, C.black),
    r(6, 9, 16, 1, C.black),
    r(9, 13, 14, 2, C.tan),
    r(9, 13, 14, 1, C.yellow),
    r(8, 13, 1, 2, C.black), r(23, 13, 1, 2, C.black),
    r(8, 12, 16, 1, C.black),
    r(6, 16, 14, 2, C.teal),
    r(6, 16, 14, 1, C.yellow),
    r(5, 16, 1, 2, C.black), r(20, 16, 1, 2, C.black),
    r(5, 15, 16, 1, C.black),
    r(14, 14, 8, 8, C.black),
    r(15, 15, 6, 6, C.blue3),
    r(15, 15, 6, 1, C.white), r(15, 15, 1, 6, C.white),
    dither(16, 16, 5, 5, C.blue3, C.blue),
    r(16, 16, 2, 1, C.white), r(16, 17, 1, 1, C.white),
    r(21, 21, 2, 1, C.black), r(22, 22, 2, 1, C.black),
    r(23, 23, 2, 1, C.black), r(24, 24, 1, 1, C.black),
    r(21, 20, 1, 1, C.gray),
  ]);
}

export function DockNote() {
  return dockSvg([
    r(7, 23, 15, 1, C.black), r(21, 4, 1, 20, C.black),
    r(6, 3, 15, 20, C.white),
    r(6, 3, 15, 1, C.gray0), r(6, 3, 1, 20, C.gray0),
    r(20, 3, 1, 20, C.gray2), r(6, 22, 15, 1, C.gray2),
    dither(17, 4, 3, 18, C.white, C.gray0),
    r(17, 3, 4, 1, C.black), r(17, 3, 1, 4, C.black),
    r(20, 3, 1, 1, C.black),
    r(18, 4, 2, 1, C.gray0), r(18, 5, 2, 1, C.gray),
    r(17, 6, 4, 1, C.black),
    r(5, 2, 17, 1, C.black), r(5, 23, 17, 1, C.black),
    r(5, 2, 1, 22, C.black), r(21, 2, 1, 22, C.black),
    r(9, 5, 1, 17, C.red),
    r(7, 8, 12, 1, C.steel), r(7, 11, 12, 1, C.steel),
    r(7, 14, 12, 1, C.steel), r(7, 17, 12, 1, C.steel),
    r(7, 20, 8, 1, C.steel),
    r(11, 11, 6, 1, C.black), r(11, 14, 4, 1, C.black),
    r(11, 17, 5, 1, C.black),
    r(20, 20, 1, 1, C.black),
    r(19, 19, 2, 1, C.gray3),
    r(18, 18, 2, 2, C.gray3),
    r(17, 17, 2, 2, C.tan),
    r(17, 17, 2, 1, C.yellow),
    r(18, 18, 1, 1, C.tanD),
    r(13, 13, 5, 5, C.orange),
    r(13, 13, 5, 1, C.yellow),
    r(17, 13, 1, 5, C.orangeD),
    r(13, 17, 5, 1, C.orangeD),
    dither(14, 14, 3, 3, C.orange, C.yellow),
    r(12, 12, 1, 1, C.black), r(17, 12, 1, 1, C.black),
    r(12, 13, 1, 5, C.black), r(13, 12, 5, 1, C.black),
    r(13, 18, 5, 1, C.black), r(18, 13, 1, 5, C.black),
    r(11, 11, 2, 2, C.red),
    r(11, 11, 2, 1, C.orange),
    r(11, 12, 1, 1, C.orange),
    r(12, 12, 1, 1, C.redD),
    r(10, 11, 1, 2, C.black),
    r(11, 10, 2, 1, C.black), r(11, 13, 2, 1, C.black),
  ]);
}

export function DockTerminal() {
  return dockSvg([
    r(9, 22, 10, 3, C.gray),
    r(9, 22, 10, 1, C.white),
    r(9, 24, 10, 1, C.gray3),
    r(8, 22, 1, 3, C.black), r(19, 22, 1, 3, C.black),
    r(9, 25, 10, 1, C.black),
    r(12, 20, 4, 2, C.gray), r(12, 20, 4, 1, C.white),
    r(11, 20, 1, 2, C.black), r(16, 20, 1, 2, C.black),
    r(2, 3, 24, 18, C.gray0),
    r(2, 3, 24, 1, C.black), r(2, 20, 24, 1, C.black),
    r(2, 3, 1, 18, C.black), r(25, 3, 1, 18, C.black),
    r(3, 4, 22, 1, C.white), r(3, 4, 1, 16, C.white),
    r(24, 4, 1, 16, C.gray2), r(3, 19, 22, 1, C.gray2),
    dither(4, 5, 20, 1, C.gray0, C.white),
    dither(4, 18, 20, 1, C.gray0, C.gray),
    r(5, 6, 18, 12, C.black),
    dither(5, 6, 18, 1, C.black, C.gray3),
    dither(5, 17, 18, 1, C.black, C.gray3),
    dither(5, 7, 1, 10, C.black, C.gray3),
    dither(22, 7, 1, 10, C.black, C.gray3),
    r(7, 9, 1, 1, C.teal), r(8, 10, 1, 1, C.teal),
    r(7, 11, 1, 1, C.teal),
    r(10, 11, 4, 1, C.teal),
    r(15, 11, 3, 1, C.yellow),
    r(7, 13, 2, 1, C.tealD), r(10, 13, 6, 1, C.tealD),
    r(17, 13, 3, 1, C.tealD),
    r(7, 15, 2, 1, C.teal), r(10, 15, 2, 1, C.orange),
    r(22, 20, 1, 1, C.teal),
  ]);
}

export function DockBook() {
  // Open book, face on: two page blocks either side of a tan spine.
  return dockSvg([
    r(4, 23, 21, 1, C.gray3),        // ground shadow
    r(3, 6, 22, 17, C.black),        // outline; pages paint over the middle
    r(4, 7, 9, 15, C.white),         // left page
    r(4, 7, 9, 1, C.gray0),
    r(15, 7, 9, 15, C.white),        // right page
    r(15, 7, 9, 1, C.gray0),
    r(13, 7, 2, 15, C.tan),          // spine
    r(13, 7, 1, 15, C.yellow),
    r(14, 7, 1, 15, C.tanD),
    r(6, 10, 6, 1, C.gray3),         // ── left page text ──
    r(6, 12, 6, 1, C.gray3),
    r(6, 14, 4, 1, C.gray3),
    r(6, 16, 6, 1, C.gray3),
    r(6, 18, 3, 1, C.gray3),
    r(16, 10, 6, 1, C.gray3),        // ── right page text ──
    r(16, 12, 4, 1, C.gray3),
    r(16, 14, 6, 1, C.gray3),
    r(16, 16, 5, 1, C.gray3),
    r(16, 18, 3, 1, C.gray3),
  ]);
}

export function DockMusic() {
  return dockSvg([
    r(10, 5, 12, 3, C.black),       // beam
    r(10, 5, 12, 1, C.gray3),
    r(10, 7, 2, 11, C.black),       // left stem
    r(20, 7, 2, 11, C.black),       // right stem
    r(6, 16, 7, 5, C.black),        // left head
    r(7, 17, 5, 3, C.orange),
    r(7, 17, 5, 1, C.yellow),
    r(16, 16, 7, 5, C.black),       // right head
    r(17, 17, 5, 3, C.orange),
    r(17, 17, 5, 1, C.yellow),
  ]);
}

function fileTile(body: string, bodyShadow: string, emblem: El, scale = 1): El {
  return svg(16, 16, [
    r(3, 15, 11, 1, C.black), r(13, 2, 1, 13, C.black),
    r(2, 1, 11, 14, C.black),
    r(3, 2, 9, 13, body),
    r(3, 2, 9, 1, C.white), r(3, 2, 1, 13, C.white),
    dither(10, 3, 2, 11, body, bodyShadow),
    r(11, 2, 1, 12, bodyShadow), r(3, 14, 9, 1, bodyShadow),
    r(9, 1, 3, 1, C.black), r(9, 1, 1, 3, C.black),
    r(12, 2, 1, 1, C.black),
    r(9, 2, 3, 1, C.white), r(9, 2, 1, 2, C.white),
    r(10, 2, 1, 1, C.gray), r(11, 2, 1, 1, C.gray2),
    r(11, 3, 1, 1, bodyShadow),
    r(9, 4, 3, 1, C.black),
    emblem,
  ], scale);
}

function FileGlobe(scale = 1) {
  return fileTile(C.blue3, C.blue2, g(
    r(5, 7, 5, 5, C.teal),
    r(5, 7, 5, 1, C.white), r(5, 7, 1, 5, C.white),
    r(9, 7, 1, 5, C.black), r(5, 11, 5, 1, C.black),
    r(5, 9, 5, 1, C.white), r(7, 7, 1, 5, C.white),
    r(6, 8, 1, 1, C.tealD), r(8, 10, 1, 1, C.tealD),
  ), scale);
}
function FileBraces(scale = 1) {
  return fileTile(C.teal, C.tealD, g(
    r(5, 6, 1, 1, C.white), r(4, 7, 1, 3, C.white),
    r(5, 10, 1, 1, C.white), r(3, 8, 1, 1, C.white),
    r(9, 6, 1, 1, C.white), r(10, 7, 1, 3, C.white),
    r(9, 10, 1, 1, C.white), r(11, 8, 1, 1, C.white),
    r(6, 8, 1, 1, C.white), r(7, 8, 1, 1, C.white),
    r(8, 8, 1, 1, C.white),
  ), scale);
}
function FileJoystick(scale = 1) {
  return fileTile(C.red, C.redD, g(
    r(7, 5, 2, 2, C.yellow), r(7, 5, 2, 1, C.white),
    r(7, 7, 2, 2, C.gray3),
    r(4, 9, 8, 3, C.gray0),
    r(4, 9, 8, 1, C.white), r(4, 11, 8, 1, C.gray3),
    r(6, 10, 1, 1, C.red),
  ), scale);
}
function FileBrush(scale = 1) {
  return fileTile(C.purple, C.purpleD, g(
    r(5, 9, 1, 3, C.tan), r(6, 8, 1, 3, C.tan),
    r(7, 7, 1, 3, C.tan), r(5, 9, 3, 1, C.yellow),
    r(8, 6, 2, 3, C.gray), r(8, 6, 2, 1, C.white),
    r(8, 8, 2, 1, C.gray3),
    r(9, 4, 3, 3, C.orange), r(9, 4, 3, 1, C.yellow),
    r(9, 6, 3, 1, C.orangeD),
    r(4, 12, 6, 1, C.orange),
  ), scale);
}
function FilePicture(scale = 1) {
  return fileTile(C.orange, C.orangeD, g(
    r(5, 6, 6, 5, C.teal),
    r(5, 6, 6, 1, C.white), r(5, 6, 1, 5, C.white),
    r(10, 6, 1, 5, C.tealD), r(5, 10, 6, 1, C.tealD),
    r(9, 7, 1, 1, C.yellow),
    r(6, 9, 1, 1, C.gray3),
    r(7, 8, 1, 2, C.gray3),
    r(8, 9, 1, 1, C.gray3),
  ), scale);
}
function FileText(scale = 1) {
  return fileTile(C.gray0, C.gray2, g(
    r(5, 6, 6, 1, C.black),
    r(5, 8, 6, 1, C.black),
    r(5, 10, 4, 1, C.black),
    r(5, 12, 5, 1, C.gray3),
  ), scale);
}
// Library prose — paper stock rather than office grey, with a ragged right
// edge so it reads as verse next to the squared-off FileText.
function FileDoc(scale = 1) {
  return fileTile(C.tan, C.tanD, g(
    r(5, 6, 6, 1, C.black),
    r(5, 8, 4, 1, C.black),
    r(5, 10, 6, 1, C.black),
    r(5, 12, 3, 1, C.gray3),
  ), scale);
}
function FilePdf(scale = 1) {
  return fileTile(C.red, C.redD, g(
    r(5, 6, 6, 1, C.white),
    r(5, 8, 6, 1, C.white),
    r(5, 10, 4, 1, C.white),
    r(5, 12, 5, 1, C.yellow),
  ), scale);
}

// What FileIcon can draw. Library documents aren't project categories, so the
// two extra members sit alongside rather than inside ProjectCategory.
export type IconCategory = ProjectCategory | "document" | "pdf";

// Maps a project category to its dog-eared file icon (convenience wrapper
// for the Explorer list). `scale` must stay an integer — see svg() above.
export function FileIcon({ category, scale = 1 }: { category: IconCategory; scale?: number }) {
  switch (category) {
    case "websites": return FileGlobe(scale);
    case "apis":     return FileBraces(scale);
    case "games":    return FileJoystick(scale);
    case "designs":  return FileBrush(scale);
    case "photos":   return FilePicture(scale);
    case "blog":     return FileText(scale);
    case "document": return FileDoc(scale);
    case "pdf":      return FilePdf(scale);
    default:         return FileText(scale);
  }
}

// Folder for the Explorer tree and icon view. The open state tilts the front
// face forward so an expanded branch reads differently at a glance.
export function FolderIcon({ open = false, scale = 1 }: { open?: boolean; scale?: number }) {
  const back: El[] = [
    r(1, 2, 5, 1, C.black),
    r(1, 3, 4, 1, C.yellow),
    r(0, 4, 16, 1, C.black),
    r(0, 4, 1, 9, C.black),
    r(15, 4, 1, 9, C.black),
    r(0, 13, 16, 1, C.black),
  ];
  if (open) {
    return svg(16, 16, [
      ...back,
      r(1, 5, 14, 3, C.orangeD),
      r(1, 5, 14, 1, C.orange),
      // Front flap, offset right to suggest it is swung open.
      r(2, 8, 14, 5, C.orange),
      r(2, 8, 14, 1, C.yellow),
      r(2, 8, 1, 5, C.yellow),
      dither(3, 9, 12, 3, C.orange, C.yellow),
      r(2, 12, 14, 1, C.orangeD),
    ], scale);
  }
  return svg(16, 16, [
    ...back,
    r(1, 5, 14, 8, C.orange),
    r(1, 5, 14, 1, C.yellow),
    r(1, 5, 1, 8, C.yellow),
    dither(2, 6, 12, 6, C.orange, C.yellow),
    r(14, 5, 1, 8, C.orangeD),
    r(1, 12, 14, 1, C.orangeD),
  ], scale);
}

export function MiniFolder({ highlight }: { highlight?: boolean }) {
  const kids: El[] = [
    r(1, 10, 13, 1, C.black), r(13, 2, 1, 9, C.black),
    r(1, 0, 5, 1, C.black),
    r(1, 1, 5, 1, C.orange),
    r(1, 1, 1, 1, C.yellow), r(5, 1, 1, 1, C.orangeD),
    r(0, 2, 13, 8, C.orange),
    r(0, 2, 13, 1, C.black), r(0, 9, 13, 1, C.black),
    r(0, 2, 1, 8, C.black), r(12, 2, 1, 8, C.black),
    r(1, 3, 11, 1, C.yellow), r(1, 3, 1, 6, C.yellow),
    r(11, 3, 1, 6, C.orangeD), r(1, 8, 11, 1, C.orangeD),
    dither(2, 4, 9, 4, C.orange, C.yellow),
  ];
  if (highlight) kids.push(r(4, 6, 5, 1, C.black));
  return svg(14, 11, kids);
}

// ── WINDOW-CONTROL GLYPHS (Amiga Workbench gadget style) ────────────────
// Hard-edge pixel art in the same idiom as the rest of the icon set — black
// ink on the raised grey gadget face. Behaviour is Windows (minimise /
// maximise / close) but the look stays native Workbench.
export function WinMinGlyph() {
  // Minimise: a low bar.
  return svg(14, 14, [r(3, 9, 8, 2, C.black)]);
}
export function WinMaxGlyph() {
  // Maximise: the Amiga "zoom" gadget — a big window frame with a solid
  // corner block.
  return svg(14, 14, [
    r(2, 2, 10, 1, C.black), r(2, 11, 10, 1, C.black),
    r(2, 2, 1, 10, C.black), r(11, 2, 1, 10, C.black),
    r(3, 3, 4, 4, C.black),
  ]);
}
export function WinRestoreGlyph() {
  // Restore: two overlapping windows — the front pane (grey fill) sits over
  // the back frame so they read as stacked.
  return svg(14, 14, [
    // back frame (upper-right)
    r(5, 2, 6, 1, C.black), r(5, 7, 6, 1, C.black),
    r(5, 2, 1, 6, C.black), r(10, 2, 1, 6, C.black),
    // front pane (lower-left): grey fill hides the overlap, then its outline
    r(2, 5, 6, 6, C.gray),
    r(2, 5, 6, 1, C.black), r(2, 10, 6, 1, C.black),
    r(2, 5, 1, 6, C.black), r(7, 5, 1, 6, C.black),
  ]);
}
// ── EREADER RAIL GLYPHS ─────────────────────────────────────────────────
// The left nav rail in the Ereader. Black ink on whatever the rail tile is
// filled with, so the active (orange) state needs no second set of art.
// 16×16 source at 2× = 32×32, matching the rail tile in Ereader.tsx.
const railSvg = (kids: (El | El[])[]): El => svg(16, 16, kids, 2);

export function RailHome() {
  return railSvg([
    r(7, 2, 2, 1, C.black),          // roof, one row wider each step down
    r(6, 3, 4, 1, C.black),
    r(5, 4, 6, 1, C.black),
    r(4, 5, 8, 1, C.black),
    r(3, 6, 10, 1, C.black),
    r(4, 7, 8, 7, C.black),          // wall block, hollowed out below
    r(5, 7, 6, 6, C.white),
    r(7, 9, 2, 4, C.orange),         // door
    r(7, 9, 2, 1, C.yellow),
  ]);
}

export function RailBook() {
  return railSvg([
    r(2, 3, 12, 11, C.black),
    r(3, 4, 10, 9, C.white),
    r(3, 4, 10, 1, C.gray0),
    r(7, 4, 2, 9, C.tan),            // spine
    r(4, 6, 3, 1, C.gray3), r(9, 6, 3, 1, C.gray3),
    r(4, 8, 3, 1, C.gray3), r(9, 8, 3, 1, C.gray3),
    r(4, 10, 3, 1, C.gray3), r(9, 10, 3, 1, C.gray3),
  ]);
}

export function RailShelves() {
  // 2×2 tiles — the "categories" glyph from the reference layout.
  return railSvg([
    r(2, 2, 5, 5, C.black), r(3, 3, 3, 3, C.orange),
    r(9, 2, 5, 5, C.black), r(10, 3, 3, 3, C.white),
    r(2, 9, 5, 5, C.black), r(3, 10, 3, 3, C.white),
    r(9, 9, 5, 5, C.black), r(10, 10, 3, 3, C.white),
  ]);
}

export function RailInfo() {
  return railSvg([
    r(3, 2, 10, 12, C.black),
    r(4, 3, 8, 10, C.white),
    r(7, 5, 2, 2, C.black),          // tittle
    r(7, 8, 2, 4, C.black),          // stem
  ]);
}

export function WinCloseGlyph() {
  // Close: the classic Workbench close gadget — square with an inset hole.
  // First icon migrated to the character-grid format; the grid reproduces the
  // old rects pixel for pixel. Consumers import by name, so WindowFrame did
  // not change. Remaining icons move over one at a time the same way.
  return <PixelIcon name="GLYPH_CLOSE" />;
}

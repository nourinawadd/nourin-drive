// Detailed dithered pixel-art icon library — inline SVG, hard-edge rects.
// Ported faithfully from the Claude Design "PixelBench" handoff bundle
// (icons.js). Built from concise helpers — r() rect, g() group, svg() root,
// dither() 2px ordered checker — so the art stays dense but editable.
// All colors resolve from the --wb-* CSS vars in tokens.css.

import { createElement, type ReactElement } from "react";
import type { ProjectCategory } from "@/data/projects";

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
function svg(w: number, h: number, kids: (El | El[])[]): El {
  return createElement(
    "svg",
    { width: w, height: h, viewBox: `0 0 ${w} ${h}`, shapeRendering: "crispEdges", "aria-hidden": true },
    kids,
  );
}
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
  return svg(56, 40, shell(C.steel, ill));
}

export function IconDrawer() {
  return svg(56, 40, [
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
  return svg(56, 40, shell(C.red, ill));
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
  return svg(56, 40, shell(C.teal, ill));
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
  return svg(56, 40, shell(C.gray3, ill));
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
  return svg(56, 40, shell(C.purple, ill));
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
  return svg(56, 40, [
    createElement("g", { key: "t", transform: "translate(14, 6)" }, wastebasket()),
    r(16, 36, 24, 1, C.gray3),
    dither(16, 37, 24, 1, C.gray3, C.gray),
  ]);
}

export function DockTrash() {
  return svg(28, 28, wastebasket());
}

export function DockGlobe() {
  return svg(28, 28, [
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
  return svg(28, 28, [
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
  return svg(28, 28, [
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
  return svg(28, 28, [
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

function fileTile(body: string, bodyShadow: string, emblem: El): El {
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
  ]);
}

function FileGlobe() {
  return fileTile(C.blue3, C.blue2, g(
    r(5, 7, 5, 5, C.teal),
    r(5, 7, 5, 1, C.white), r(5, 7, 1, 5, C.white),
    r(9, 7, 1, 5, C.black), r(5, 11, 5, 1, C.black),
    r(5, 9, 5, 1, C.white), r(7, 7, 1, 5, C.white),
    r(6, 8, 1, 1, C.tealD), r(8, 10, 1, 1, C.tealD),
  ));
}
function FileBraces() {
  return fileTile(C.teal, C.tealD, g(
    r(5, 6, 1, 1, C.white), r(4, 7, 1, 3, C.white),
    r(5, 10, 1, 1, C.white), r(3, 8, 1, 1, C.white),
    r(9, 6, 1, 1, C.white), r(10, 7, 1, 3, C.white),
    r(9, 10, 1, 1, C.white), r(11, 8, 1, 1, C.white),
    r(6, 8, 1, 1, C.white), r(7, 8, 1, 1, C.white),
    r(8, 8, 1, 1, C.white),
  ));
}
function FileJoystick() {
  return fileTile(C.red, C.redD, g(
    r(7, 5, 2, 2, C.yellow), r(7, 5, 2, 1, C.white),
    r(7, 7, 2, 2, C.gray3),
    r(4, 9, 8, 3, C.gray0),
    r(4, 9, 8, 1, C.white), r(4, 11, 8, 1, C.gray3),
    r(6, 10, 1, 1, C.red),
  ));
}
function FileBrush() {
  return fileTile(C.purple, C.purpleD, g(
    r(5, 9, 1, 3, C.tan), r(6, 8, 1, 3, C.tan),
    r(7, 7, 1, 3, C.tan), r(5, 9, 3, 1, C.yellow),
    r(8, 6, 2, 3, C.gray), r(8, 6, 2, 1, C.white),
    r(8, 8, 2, 1, C.gray3),
    r(9, 4, 3, 3, C.orange), r(9, 4, 3, 1, C.yellow),
    r(9, 6, 3, 1, C.orangeD),
    r(4, 12, 6, 1, C.orange),
  ));
}
function FilePicture() {
  return fileTile(C.orange, C.orangeD, g(
    r(5, 6, 6, 5, C.teal),
    r(5, 6, 6, 1, C.white), r(5, 6, 1, 5, C.white),
    r(10, 6, 1, 5, C.tealD), r(5, 10, 6, 1, C.tealD),
    r(9, 7, 1, 1, C.yellow),
    r(6, 9, 1, 1, C.gray3),
    r(7, 8, 1, 2, C.gray3),
    r(8, 9, 1, 1, C.gray3),
  ));
}
function FileText() {
  return fileTile(C.gray0, C.gray2, g(
    r(5, 6, 6, 1, C.black),
    r(5, 8, 6, 1, C.black),
    r(5, 10, 4, 1, C.black),
    r(5, 12, 5, 1, C.gray3),
  ));
}

// Maps a project category to its dog-eared file icon (convenience wrapper
// for the Explorer list).
export function FileIcon({ category }: { category: ProjectCategory }) {
  switch (category) {
    case "websites": return FileGlobe();
    case "apis":     return FileBraces();
    case "games":    return FileJoystick();
    case "designs":  return FileBrush();
    case "photos":   return FilePicture();
    case "blog":     return FileText();
    default:         return FileText();
  }
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

export function CloseGlyph() {
  return svg(14, 14, [
    r(2, 2, 10, 10, C.black),
    r(3, 3, 8, 8, C.white),
    r(5, 5, 4, 4, C.black),
  ]);
}
export function MinGlyph() {
  return svg(14, 14, [r(3, 9, 8, 2, C.black)]);
}
export function DepthGlyph() {
  return svg(14, 14, [
    r(3, 3, 7, 6, C.black),
    r(4, 4, 5, 4, C.white),
    r(5, 6, 7, 6, C.black),
    r(6, 7, 5, 4, C.white),
  ]);
}

export function Pointer({ x, y }: { x: number; y: number }) {
  const blackRects = (
    [
      [2, 2], [2, 4], [2, 6], [2, 8], [2, 10], [2, 12],
      [2, 14], [2, 16], [2, 18], [2, 20],
      [4, 4], [4, 20], [6, 6], [6, 16], [6, 18],
      [8, 8], [8, 14], [8, 20],
      [10, 10], [10, 14], [10, 22],
      [12, 12], [12, 16], [12, 22],
      [14, 14], [14, 18], [14, 24],
      [16, 16], [16, 24],
    ] as [number, number][]
  ).map(([a, b]) => r(a, b, 2, 2, C.black));
  const orangeR = (
    [
      [4, 6, 2, 14], [6, 8, 2, 8], [8, 10, 2, 4], [10, 12, 2, 2],
      [8, 16, 2, 4], [10, 16, 2, 6], [12, 18, 2, 4], [14, 20, 2, 4],
    ] as [number, number, number, number][]
  ).map(([a, b, c, d]) => r(a, b, c, d, C.orange));
  const whiteR = (
    [[4, 6], [4, 8], [6, 10]] as [number, number][]
  ).map(([a, b]) => r(a, b, 2, 2, C.white));
  return createElement(
    "svg",
    {
      className: "pointer",
      style: { left: x, top: y },
      width: 22, height: 28, viewBox: "0 0 22 28", shapeRendering: "crispEdges", "aria-hidden": true,
    },
    [...blackRects, ...orangeR, ...whiteR],
  );
}

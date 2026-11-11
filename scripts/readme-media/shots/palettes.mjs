// docs/media/palettes.png: the same desktop in each of the six palettes, as a
// 3x2 grid. Every tile is the same scene (Profile, File Explorer and the
// Palette editor at fixed spots and sizes) so the only thing that changes from
// tile to tile is the colour. The guestbook stand is folded so it doesn't pull
// the eye. Tiles are full 1280x800 desktops kept 1:1: at 960x600 the desktop
// is too crowded (stickies over drives, the dock over the bottom), and
// scaling pixel art down blurs it.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  boot,
  closeWindow,
  dragWindow,
  openDrive,
  resizeWindow,
  snap,
  windowByTitle,
} from "../lib/boot.mjs";
import { DESKTOP } from "../lib/stage.mjs";
import { grid } from "../lib/compose.mjs";

// Same order as client/src/data/prefs.ts.
const PALETTES = ["workbench", "amber", "phosphor", "paper", "midnight", "hotpink"];
const TILE = DESKTOP.viewport;

// Final size and spot of each window, back to front.
const LAYOUT = [
  { title: "File Explorer", x: 300, y: 44, width: 620, height: 400 },
  { title: "User Profile", x: 150, y: 214, width: 500, height: 430 },
  { title: "Palette", x: 600, y: 262, width: 580, height: 400 },
];

// A new window opens over the drive column, so the next drive can't be
// double-clicked. Each one is sized and then parked mostly off the right edge
// as soon as it opens (windows aren't bounded to the screen), and everything
// is laid out once all three are up.
const PARK_X = 1220;

async function scene(page) {
  const size = (title) => {
    const w = LAYOUT.find((l) => l.title === title);
    return resizeWindow(page, title, w.width, w.height);
  };
  await openDrive(page, "Projects:");
  await size("File Explorer");
  await dragWindow(page, "File Explorer", PARK_X, 40);
  await openDrive(page, "User:");
  await size("User Profile");
  await dragWindow(page, "User Profile", PARK_X, 80);
  await openDrive(page, "Prefs:");
  await windowByTitle(page, "Prefs").getByRole("button", { name: "Palette" }).dblclick();
  await closeWindow(page, "Prefs");
  await size("Palette");
  for (const { title, x, y } of LAYOUT) await dragWindow(page, title, x, y);
}

export default {
  name: "palettes",
  async run({ browser, stage, origin, save }) {
    const dir = await mkdtemp(join(tmpdir(), "readme-media-palettes-"));
    try {
      const tiles = [];
      for (const [i, palette] of PALETTES.entries()) {
        const { page, context } = await stage({ seed: 100 + i, prefs: { palette }, standFolded: true });
        await boot(page, origin);
        await scene(page);
        const tile = join(dir, `${palette}.png`);
        await snap(page, tile);
        tiles.push(tile);
        await context.close();
      }
      await grid(browser, tiles, save("palettes.png"), { cols: 3, gap: 8, ...TILE });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
};

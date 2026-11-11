// docs/media/pet.gif: the cat. It turns up a minute after boot, walks in
// along the bottom of the screen, climbs the side of a window and wanders
// along its title bar.
//
// The cat climbs a window when it walks past one of its side edges and the
// window reaches down near the floor, so the Profile window is shrunk and
// parked low on the left, where the cat comes in. Its walk is driven by the
// seeded Math.random: seed 601 was picked by watching a few, because it
// climbs early and stays up, then fixed. The GIF is a 640x400 crop of the
// full 1280x800 desktop around where all that happens.

import { boot, dragWindow, openDrive, pump, resizeWindow } from "../lib/boot.mjs";

const FPS = 12.5;
const CROP = { x: 0, y: 400, width: 640, height: 400 };

export default {
  name: "pet",
  gif: true,
  async run({ stage, origin, film }) {
    const { page } = await stage({ seed: 601, prefs: { pet: "cat", petDelay: 60 }, standFolded: true });
    await boot(page, origin);
    await openDrive(page, "User:");
    await resizeWindow(page, "User Profile", 520, 380);
    await dragWindow(page, "User Profile", 110, 560);

    // Most of the minute until the cat appears, not filmed. Whole seconds,
    // so the walk starts from the same page time every run.
    for (let i = 0; i < 57; i++) {
      await page.clock.runFor(1000);
      await pump(page);
    }
    const rec = await film(page, { fps: FPS, clip: CROP });
    await rec.hold(Math.round(9 * FPS));
    await rec.save("pet.gif");
  },
};

// Not README media: proof that filming works, saved to the scratch folder.
// It blanks the screen with the Boing saver and films its first two seconds.
// The saver fades in with an 800 ms CSS transition, which runs on the
// browser's real clock unless the recorder pins it. If pinning works, frame 5
// (400 ms) is caught half-faded, and two runs give the same GIF byte for byte.

import { boot } from "../lib/boot.mjs";

export default {
  name: "gif-smoke",
  scratch: true,
  gif: true,
  async run({ stage, origin, film }) {
    const { page } = await stage({
      seed: 900,
      prefs: { saver: "boing" },
      viewport: { width: 640, height: 400 },
    });
    await boot(page, origin);
    const rec = await film(page, { fps: 12.5 });
    await page.evaluate(() => window.dispatchEvent(new Event("wb:blank-screen")));
    await rec.hold(25);
    await rec.save("gif-smoke.gif");
  },
};

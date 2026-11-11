// docs/media/boing.gif and starfield.gif: the two screensavers, each in a
// real 640x400 screen (the saver fills whatever screen it gets, so this isn't
// a shrunk copy), for the README's row of three.
//
// The fade-in is skipped: the saver is started with the same event the
// desktop's Blank Screen uses, the clock runs a fixed second, the fade is
// finished, and filming starts on the full picture. The mouse never moves, because any pointer
// movement wakes the saver up.
//
// Boing is filmed for one left-right-left crossing: at 640 wide the ball
// travels 512 px each way at 153.6 px/s, which is 6.67 s, its spin cancels out
// over the round trip, and it's within a tenth of a second of four bounces, so
// the loop point barely shows. The starfield is random and can't loop; it runs
// five seconds.

import { boot, warm } from "../lib/boot.mjs";

const FPS = 12.5;

function saverShot(name, saver, frames, seed) {
  return {
    name,
    gif: true,
    async run({ stage, origin, film }) {
      const { page } = await stage({ seed, prefs: { saver }, viewport: { width: 640, height: 400 } });
      await boot(page, origin);
      await page.evaluate(() => window.dispatchEvent(new Event("wb:blank-screen")));
      await warm(page, 1008); // past the 800 ms fade, a fixed amount
      // The fade is a CSS transition, which runs on the wall clock: whether
      // it's over by now depends on how fast this machine got here. Finish it
      // (and anything else finite) so filming always starts on the full saver.
      await page.evaluate(() => {
        for (const a of document.getAnimations()) {
          try {
            a.finish();
          } catch {
            // Infinite animations can't finish; film() pins those per frame.
          }
        }
      });
      const rec = await film(page, { fps: FPS });
      await rec.hold(frames);
      await rec.save(`${name}.gif`);
    },
  };
}

export default [saverShot("boing", "boing", 83, 700), saverShot("starfield", "stars", 62, 701)];

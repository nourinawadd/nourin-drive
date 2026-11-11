// docs/media/signal.gif: the easter egg, teased and never shown. The key
// sequence goes in with nothing on screen to say which keys, the desktop
// drops into the signal's dead air, the screen fades, and the GIF cuts off
// while it's still waiting, before anything is typed out.
//
// The reveal types its text from 350 + 1100 + 700 = 2150 ms after the last
// key (SignalReveal.tsx). The GIF films up to 2000 ms after it, and a guard
// on every frame stops the shot, before that frame is written, if the page
// time ever reaches 2100 ms after the trigger or the code is anywhere on the
// page. Frame times are exact on the stepped clock, so the margin holds.
//
// Neither the key sequence nor the code is written down here: the sequence
// is read from KonamiListener.tsx at run time, and guardSignal reads the code
// from SignalReveal.tsx, so this repo's scripts never contain either.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { boot, guardSignal } from "../lib/boot.mjs";

const FPS = 12.5;
const KEY_GAP = 3; // frames between keys, about a quarter of a second
const AFTER_MS = 2000; // the cut, after the trigger
const LIMIT_MS = 2100; // the guard: typing starts at 2150

function keySequence(root) {
  const src = readFileSync(join(root, "client/src/components/os/KonamiListener.tsx"), "utf8");
  const block = src.match(/SEQUENCE\s*=\s*\[([^\]]*)\]/);
  const keys = block ? [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
  if (!keys.length) throw new Error("couldn't read the key sequence; check KonamiListener.tsx");
  return keys;
}

export default {
  name: "signal",
  gif: true,
  async run({ stage, origin, film, root, log }) {
    const keys = keySequence(root);
    const { page } = await stage({ seed: 730 });
    await boot(page, origin);

    let trigger = null;
    let last = null;
    const rec = await film(page, {
      fps: FPS,
      onFrame: async (now) => {
        if (trigger !== null && now - trigger >= LIMIT_MS) {
          throw new Error(`frame at +${now - trigger} ms after the trigger; the guard stops at ${LIMIT_MS}`);
        }
        await guardSignal(page, root);
        last = now;
      },
    });

    await rec.hold(6);
    for (let i = 0; i < keys.length; i++) {
      await rec.key(keys[i]);
      if (i < keys.length - 1) await rec.hold(KEY_GAP);
    }
    trigger = await page.evaluate(() => Date.now());
    // The trigger frame itself, then one every 80 ms up to the cut.
    await rec.hold(Math.round(AFTER_MS / (1000 / FPS)) + 1);

    if (!(await page.locator(".wb-signal").count())) {
      throw new Error("the signal never opened; did the key sequence change?");
    }
    if (last - trigger !== AFTER_MS) throw new Error(`last frame at +${last - trigger} ms, expected +${AFTER_MS}`);
    await rec.save("signal.gif");
    log(`guard: last frame +${last - trigger} ms < ${LIMIT_MS}, code never on the page`);
  },
};

// docs/media/phone.gif: the phone shell in use. Tap the disk, the launcher
// comes up, tap Music, the player opens full screen, tap Back, and the
// launcher is there again. Real touch taps, each shown with a dot for a few
// frames. iPhone 15 at 2x rather than the stills' 3x: twice the bytes for no
// difference at the size the README shows it.

import { devices } from "playwright";
import { BOOT_BUTTON, warm } from "../lib/boot.mjs";

const FPS = 12.5;
const secs = (s) => Math.round(s * FPS);
const PHONE = { ...devices["iPhone 15"], deviceScaleFactor: 2 };

export default {
  name: "phone-gif",
  gif: true,
  async run({ stage, origin, film }) {
    const { page } = await stage({ seed: 720, device: PHONE });
    await page.goto(origin + "/");
    await warm(page);
    const disk = page.locator(BOOT_BUTTON);
    await disk.waitFor();

    const rec = await film(page, { fps: FPS, touch: true });
    await rec.hold(secs(0.8));
    await rec.tapLocator(disk);
    await rec.hold(secs(1.2));
    const music = page
      .locator(".wb-phone-drive")
      .filter({ has: page.locator(".wb-phone-drive-label", { hasText: "Music:" }) });
    await rec.tapLocator(music);
    await rec.hold(secs(1.8));
    await rec.tapLocator(page.getByRole("button", { name: "Back" }));
    await rec.hold(secs(1.4));
    await rec.save("phone.gif");
  },
};

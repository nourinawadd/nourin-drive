// docs/media/boot.gif and boot-dark.gif: the README's opening picture. The
// Kickstart screen, the pointer drifts to the disk and clicks, the desktop is
// there, and two seconds later About This Site opens by itself, the way a
// first visit goes. boot-dark is the same in the Midnight palette, for
// GitHub's dark theme. The boot screen itself doesn't change with the palette;
// the desktop behind it does.

import { BOOT_BUTTON, warm } from "../lib/boot.mjs";

const FPS = 12.5;
const secs = (s) => Math.round(s * FPS);

function bootShot(name, palette, seed) {
  return {
    name,
    gif: true,
    async run({ stage, origin, film }) {
      // readme: true leaves "seen the About window" unset, so it opens itself.
      const { page } = await stage({ seed, prefs: { palette }, readme: true });
      await page.goto(origin + "/");
      await warm(page); // React runs on the page clock in GIF shots
      const disk = page.locator(BOOT_BUTTON);
      await disk.waitFor();

      const rec = await film(page, { fps: FPS, pointer: { x: 900, y: 610 } });
      await rec.hold(secs(0.8));
      await rec.moveToLocator(disk, secs(1));
      await rec.hold(secs(0.3));
      await rec.click();
      // About opens 2 s after boot. Hold through that and then for a beat
      // more, so the loop restarts on a finished picture.
      await rec.hold(secs(2.2));
      await page.getByText("About This Site", { exact: true }).first().waitFor();
      await rec.hold(secs(1.6));
      await rec.save(`${name}.gif`);
    },
  };
}

export default [bootShot("boot", "workbench", 500), bootShot("boot-dark", "midnight", 501)];

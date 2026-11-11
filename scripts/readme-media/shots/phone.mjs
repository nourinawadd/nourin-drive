// docs/media/phone-*.png: the phone shell on an emulated iPhone 15 (393x659
// viewport at 3x). The shell picks itself from the narrow viewport and coarse
// pointer, the same detection a real phone goes through; nothing here forces
// `?mode=phone`.
//
//   phone-home   the launcher, right after tapping the boot disk
//   phone-app    one app open (Profile)
//   phone-music  the launcher with the now-playing bar, from a loaded track

import { devices } from "playwright";
import { BOOT_BUTTON, guardSignal, settle, snap } from "../lib/boot.mjs";

const PHONE = devices["iPhone 15"];
const TRACK = "massive-attack-elizabeth-fraser-teardrop";

async function bootPhone(page, origin) {
  await page.goto(origin + "/");
  const disk = page.locator(BOOT_BUTTON);
  await disk.waitFor();
  await page.evaluate(() => document.fonts.ready);
  await disk.tap();
  await page.locator(".wb-phone-grid").waitFor();
  await settle(page);
}

function phoneDrive(page, label) {
  return page.locator(".wb-phone-drive").filter({
    has: page.locator(".wb-phone-drive-label", { hasText: label }),
  });
}

const shots = [
  {
    name: "phone-home",
    stage: {},
    async run() {},
  },
  {
    name: "phone-app",
    stage: {},
    async run(page) {
      await phoneDrive(page, "User:").tap();
      await page.locator(".wb-phone-titlebar").first().waitFor();
      await settle(page);
    },
  },
  {
    name: "phone-music",
    stage: { player: { lastTrackId: TRACK } },
    async run(page) {
      await page.locator(".wb-phone-nowplaying").waitFor();
      await settle(page);
    },
  },
];

export default shots.map((shot, i) => ({
  name: shot.name,
  async run({ stage, origin, root, save }) {
    const { page } = await stage({ seed: 300 + i, device: PHONE, ...shot.stage });
    await bootPhone(page, origin);
    await shot.run(page);
    await guardSignal(page, root);
    await snap(page, save(`${shot.name}.png`));
  },
}));

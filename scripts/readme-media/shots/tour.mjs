// docs/media/desktop-tour.gif: "it works like a normal desktop". From a
// booted desktop the pointer opens Projects, shrinks the window from its
// corner and drags it aside by the title bar, opens User, nudges it, and
// minimises it to an icon on the desktop. Every movement glides over several
// frames, and every target is read from the page rather than hard-coded, so
// small layout changes don't send the pointer to the wrong place.

import { boot, windowByTitle } from "../lib/boot.mjs";

const FPS = 12.5;
const secs = (s) => Math.round(s * FPS);

function drive(page, label) {
  return page
    .locator(".wb-drive")
    .filter({ has: page.locator(".wb-drive-label", { hasText: new RegExp(`^${label}$`) }) });
}

export default {
  name: "desktop-tour",
  gif: true,
  async run({ stage, origin, film }) {
    const { page } = await stage({ seed: 510, standFolded: true });
    await boot(page, origin);
    const rec = await film(page, { fps: FPS, pointer: { x: 700, y: 520 }, maxFrames: 200 });
    await rec.hold(secs(0.5));

    // Open Projects.
    await rec.moveToLocator(drive(page, "Projects:").locator(".wb-drive-icon"), secs(0.8));
    await rec.dblclick();
    await rec.hold(secs(0.6));

    // Shrink it from the bottom-right corner (react-rnd's handle sits over
    // the window's edge, so a few pixels inside the corner grabs it).
    const explorer = windowByTitle(page, "File Explorer");
    let box = await explorer.boundingBox();
    await rec.moveTo(box.x + box.width - 3, box.y + box.height - 3, secs(0.8));
    await rec.down();
    await rec.moveTo(box.x + 620 - 3, box.y + 400 - 3, secs(1));
    await rec.up();
    await rec.hold(secs(0.3));

    // Drag it right by its title bar.
    box = await explorer.boundingBox();
    const grab = { x: box.x + 120, y: box.y + 9 };
    await rec.moveTo(grab.x, grab.y, secs(0.7));
    await rec.down();
    await rec.moveTo(grab.x + 430, grab.y + 70, secs(1));
    await rec.up();
    await rec.hold(secs(0.4));

    // Open User; the drive is uncovered now.
    await rec.moveToLocator(drive(page, "User:").locator(".wb-drive-icon"), secs(0.8));
    await rec.dblclick();
    await rec.hold(secs(0.6));

    // Nudge the profile down a little, then minimise it to an icon.
    const profile = windowByTitle(page, "User Profile");
    box = await profile.boundingBox();
    const bar = { x: box.x + 160, y: box.y + 9 };
    await rec.moveTo(bar.x, bar.y, secs(0.6));
    await rec.down();
    await rec.moveTo(bar.x + 60, bar.y + 50, secs(0.6));
    await rec.up();
    await rec.hold(secs(0.3));
    await rec.moveToLocator(profile.locator(".wb-winbtn--min"), secs(0.7));
    await rec.click();
    await rec.hold(secs(0.4));

    // Point at the icon it became, and rest there.
    await rec.moveToLocator(page.locator(".wb-minicon").first(), secs(0.8));
    await rec.hold(secs(1.4));
    await rec.save("desktop-tour.gif");
  },
};

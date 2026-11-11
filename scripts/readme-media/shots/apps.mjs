// docs/media/apps/<name>.png: one still per app, each opened alone on a fresh
// desktop at its normal opening size and clipped to the window. Anything an
// app needs to look lived-in (a folder opened, a track loaded, a couple of
// commands typed) is done from the outside, like a visitor would.

import { BLOG_ORIGIN } from "../lib/build.mjs";
import { advance, boot, guardSignal, openDrive, settle, snap, windowByTitle } from "../lib/boot.mjs";

// A track with album art, for the music player. Loaded, not playing.
const TRACK = "massive-attack-elizabeth-fraser-teardrop";

/** Polls `count()` while the page clock moves, until it's above zero and
 *  hasn't changed for a few rounds. For things that finish in their own time
 *  (pdf.js covers, lazy thumbnails) where there's no single "done" signal. */
async function untilSteady(page, count, { rounds = 4, max = 60 } = {}) {
  let last = -1;
  let same = 0;
  for (let i = 0; i < max; i++) {
    await advance(page, 250);
    const n = await count();
    same = n === last && n > 0 ? same + 1 : 0;
    last = n;
    if (same >= rounds) return n;
  }
  throw new Error(`never settled (last count ${last})`);
}

const APPS = [
  { name: "profile", drive: "User:", title: "User Profile" },
  {
    name: "explorer",
    drive: "Projects:",
    title: "File Explorer",
    // The root is a list of folders; one level down shows actual projects.
    async prepare(page, win) {
      await win.getByText("Websites", { exact: true }).last().dblclick();
      await settle(page);
    },
  },
  {
    name: "ereader",
    drive: "Library:",
    title: "Ereader",
    // Covers for PDFs are page one drawn into a canvas once the card is on
    // screen; wait until the drawn ones stop changing.
    async prepare(page, win) {
      await untilSteady(page, () =>
        win.locator("canvas").evaluateAll((cs) => cs.filter((c) => c.style.opacity === "1").length),
      );
      await settle(page);
    },
  },
  { name: "music", drive: "Music:", title: "Music Player", stage: { player: { lastTrackId: TRACK } } },
  {
    name: "gallery",
    drive: "Photos:",
    title: "Graphic Design",
    async prepare(page, win) {
      await untilSteady(page, () =>
        win.locator("img").evaluateAll((imgs) => imgs.filter((i) => i.complete && i.naturalWidth > 0).length),
      );
      await settle(page);
    },
  },
  {
    name: "shell",
    drive: "Shell:",
    title: "Shell",
    async prepare(page, win) {
      const input = win.locator("input");
      for (const cmd of ["ls", "cd Websites", "ls"]) {
        await input.click();
        await page.keyboard.type(cmd);
        await page.keyboard.press("Enter");
        await settle(page, { pageMs: 500, realMs: 200 });
      }
      await settle(page);
    },
  },
  { name: "api-studio", drive: "APIs:", title: "API Studio" },
  { name: "guestbook", drive: "Guestbook:", title: "Guestbook" },
  {
    name: "games",
    drive: "Games:",
    title: "Games",
    async prepare(page, win) {
      await untilSteady(page, () =>
        win.locator("img").evaluateAll((imgs) => imgs.filter((i) => i.complete && i.naturalWidth > 0).length),
      );
      await settle(page);
    },
  },
  {
    name: "blog",
    drive: "Blog:",
    title: "Blog",
    // The window is an iframe of the blog's address, which the stage answers
    // from the local blog build. Wait for it to load and for its fonts.
    async prepare(page) {
      let frame;
      for (let i = 0; i < 40 && !frame; i++) {
        frame = page.frames().find((f) => f.url().startsWith(BLOG_ORIGIN));
        if (!frame) await page.waitForTimeout(100);
      }
      if (!frame) throw new Error("the blog iframe never appeared");
      await frame.waitForLoadState("load");
      await frame.evaluate(() => document.fonts.ready);
      await settle(page);
    },
  },
];

export default APPS.map((app, i) => ({
  name: `apps/${app.name}`,
  async run({ stage, origin, root, save }) {
    const { page } = await stage({ seed: 200 + i, standFolded: true, ...app.stage });
    await boot(page, origin);
    await openDrive(page, app.drive);
    const win = windowByTitle(page, app.title);
    await win.waitFor();
    if (app.prepare) await app.prepare(page, win);
    await guardSignal(page, root);
    await snap(win, save(`apps/${app.name}.png`));
  },
}));

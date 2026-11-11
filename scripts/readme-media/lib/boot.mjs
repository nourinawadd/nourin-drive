// Moving a staged page along: letting time pass, booting the desktop, opening
// a drive.
//
// The page's clock is paused (see stage.mjs), so timers, rAF and Date only
// move when we say. Every helper here moves it by a fixed amount, which is
// what keeps the menu bar clock and Profile's uptime the same on every run.
// Real time still passes in between for the things a fake clock can't hold:
// network answers, font loading, image decoding, CSS transitions.

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const BOOT_BUTTON = '[aria-label="Insert the Workbench disk and boot"]';

/** Moves the page clock forward in fixed slices, with a real pause after each
 *  so promises, fetches and transitions catch up between slices. */
export async function advance(page, ms, { slice = 250, realPause = 60 } = {}) {
  for (let done = 0; done < ms; done += slice) {
    await page.clock.runFor(Math.min(slice, ms - done));
    await page.waitForTimeout(realPause);
  }
}

/**
 * Waits until the page looks finished: fonts loaded, images decoded, then a
 * fixed second of page time (long enough for the stand's 900 ms number roll)
 * and a real-time beat for CSS transitions, which run on the wall clock no
 * matter what the fake one says.
 */
export async function settle(page, { pageMs = 1000, realMs = 400 } = {}) {
  await page.evaluate(() => document.fonts.ready);
  await advance(page, pageMs);
  await page.evaluate(() =>
    Promise.all(
      [...document.images].filter((img) => img.src).map((img) => img.decode().catch(() => {})),
    ),
  );
  await page.waitForTimeout(realMs);
}

/**
 * The screenshot every shot should take. Infinite CSS animations (the sign
 * button's 2 s pulse, blinking cursors, marquees) run on the wall clock, so
 * each run would catch them at a different point; `animations: "disabled"`
 * puts them back on their first frame and finishes finite ones. Pass `clip`
 * or `locator` options through as usual.
 */
export async function snap(target, path, opts = {}) {
  return target.screenshot({ path, animations: "disabled", caret: "hide", ...opts });
}

/**
 * Throws if the page (any frame) shows the easter egg's code. The code is read
 * from the app's source at run time rather than written down here, so it
 * never ends up in this repo's scripts or in their output either.
 */
let signalCode;
export async function guardSignal(page, root) {
  if (signalCode === undefined) {
    const src = readFileSync(join(root, "client/src/components/os/SignalReveal.tsx"), "utf8");
    const m = src.match(/SIGNAL_CODE\s*=\s*"([^"]+)"/);
    if (!m) throw new Error("couldn't find the signal code to guard against; check SignalReveal.tsx");
    signalCode = m[1].toLowerCase();
  }
  for (const frame of page.frames()) {
    const text = await frame.evaluate(() => document.body?.innerText ?? "").catch(() => "");
    if (text.toLowerCase().includes(signalCode)) {
      throw new Error(`the signal code is on screen in ${frame.url()}; not saving this shot`);
    }
  }
}

/**
 * For pages staged with `reactOnClock` (the GIFs): runs everything that's due
 * at the current page time without moving the clock, round after round,
 * until a round changes nothing in the DOM and `busy()` (e.g. "requests in
 * flight") says false. React's renders and effects are zero-delay timers on
 * those pages, so this is "let React finish", at a fixed moment.
 *
 * `busy()` returns false, or something truthy that says what's pending. A
 * request that never finishes (a stream, say) would otherwise keep this
 * waiting forever, so after `waitMs` of real time it gives up with an error
 * naming what it was waiting on.
 */
export async function pump(page, { busy = () => false, rounds = 200, waitMs = 15000 } = {}) {
  for (let i = 0; i < rounds; i++) {
    const deadline = Date.now() + waitMs;
    for (let b = busy(); b; b = busy()) {
      if (Date.now() > deadline) {
        throw new Error(`still waiting after ${waitMs / 1000} s on: ${b === true ? "something busy" : b}`);
      }
      await page.waitForTimeout(10);
    }
    const before = await page.evaluate(() => window.__rmMut);
    await page.clock.runFor(0);
    // One trip round the real task queue, for anything not on the clock
    // (promise chains from finished fetches, module evaluation).
    await page.evaluate(
      () =>
        new Promise((r) => {
          const ch = new MessageChannel();
          ch.port1.onmessage = () => r();
          ch.port2.postMessage(0);
        }),
    );
    const after = await page.evaluate(() => window.__rmMut);
    if (after === before && !busy()) return;
  }
  throw new Error("the page never stopped changing at this moment");
}

/**
 * For `reactOnClock` pages, just after loading: moves the clock a fixed
 * 200 ms, one animation frame at a time, letting the page finish after each.
 * The first render waits on an animation frame, which the fake clock only
 * fires when time moves, so `pump` alone shows nothing. A fixed amount keeps
 * every run on the same page time.
 */
export async function warm(page, ms = 208) {
  for (let t = 0; t < ms; t += 16) {
    await page.clock.runFor(16);
    await pump(page);
  }
}

/** True when the page was staged with `reactOnClock`. */
export const reactOnClock = (page) => page.evaluate(() => "__rmMut" in window);

/** Loads the desktop and clicks the disk. */
export async function boot(page, origin, path = "/") {
  await page.goto(origin + path);
  // With React on the fake clock nothing renders until the clock runs: the
  // boot screen only appears once the shell mode is decided in the browser,
  // and a click on a page that hasn't hydrated does nothing.
  const onClock = await reactOnClock(page);
  if (onClock) await warm(page);
  const disk = page.locator(BOOT_BUTTON);
  await disk.waitFor();
  await page.evaluate(() => document.fonts.ready);
  await disk.click();
  if (onClock) await pump(page);
  await page.locator(".wb-drive").first().waitFor();
  await settle(page);
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A window by its exact title-bar text, e.g. "User Profile". */
export function windowByTitle(page, title) {
  return page
    .locator(".wb-window")
    .filter({ has: page.locator(".wb-title-text", { hasText: new RegExp(`^${escape(title)}$`) }) });
}

/**
 * Drags a window by its title bar so its top-left corner lands on (x, y).
 * It grabs the bar near its left end, clear of the gadgets on the right, and
 * moves in a few steps so react-rnd sees an ordinary drag.
 */
/**
 * A mouse drag from (fromX, fromY) to (toX, toY) in eight steps. On pages with
 * React on the fake clock (GIFs) each step also moves the clock one animation
 * frame and lets the page catch up, or the drag is lost; a fixed 16 ms per
 * step keeps it repeatable. Stills keep the plain stepped move.
 */
async function drag(page, fromX, fromY, toX, toY) {
  const onClock = await reactOnClock(page);
  await page.mouse.move(fromX, fromY);
  if (!onClock) {
    await page.mouse.down();
    await page.mouse.move(toX, toY, { steps: 8 });
    await page.mouse.up();
    return;
  }
  const tick = async () => {
    await page.clock.runFor(16);
    await pump(page);
  };
  await tick();
  await page.mouse.down();
  await tick();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(fromX + ((toX - fromX) * i) / 8, fromY + ((toY - fromY) * i) / 8);
    await tick();
  }
  await page.mouse.up();
  await tick();
}

export async function dragWindow(page, title, x, y) {
  const win = windowByTitle(page, title);
  const box = await win.boundingBox();
  const bar = await win.locator(".wb-titlebar").boundingBox();
  if (!box || !bar) throw new Error(`window "${title}" isn't on screen`);
  const grab = { x: bar.x + 40, y: bar.y + bar.height / 2 };
  await drag(page, grab.x, grab.y, x + (grab.x - box.x), y + (grab.y - box.y));
  await settle(page, { pageMs: 250, realMs: 150 });
}

/**
 * Resizes a window from its bottom-right corner to `width` x `height`.
 * react-rnd draws its resize handles over the window's edges, so grabbing a
 * few pixels inside the corner picks up the corner handle.
 */
export async function resizeWindow(page, title, width, height) {
  const box = await windowByTitle(page, title).boundingBox();
  if (!box) throw new Error(`window "${title}" isn't on screen`);
  const inset = 3;
  await drag(page, box.x + box.width - inset, box.y + box.height - inset, box.x + width - inset, box.y + height - inset);
  await settle(page, { pageMs: 250, realMs: 150 });
}

/** Clicks a window's close gadget. */
export async function closeWindow(page, title) {
  await windowByTitle(page, title).locator(".wb-winbtn--close").click();
  await settle(page, { pageMs: 250, realMs: 150 });
}

/** Double-clicks a desktop drive by its exact label, e.g. "Projects:". */
export async function openDrive(page, label) {
  const drive = page
    .locator(".wb-drive")
    .filter({ has: page.locator(".wb-drive-label", { hasText: new RegExp(`^${escape(label)}$`) }) });
  await drive.dblclick();
  await settle(page);
}

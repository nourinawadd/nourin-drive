// Filming a staged page one frame at a time, for the GIFs.
//
// The page clock is already paused (stage.mjs). For every frame the recorder
// takes the screenshot, then moves the clock forward by exactly one frame and
// lets the page catch up. Anything the script does between frames (a mouse
// step, a key, a tap) lands at a known moment in page time. That's what makes
// a GIF come out the same on every run, however slow the screenshots are.
//
// Two things don't follow Playwright's clock on their own, so the recorder
// handles them:
//
// - CSS animations and transitions run on the browser's real timeline. Before
//   each screenshot every running animation is paused and its currentTime set
//   from page time: how long since the recorder first saw it. The saver and
//   signal fades and the pulsing button then step with everything else.
// - Screenshots never include the mouse pointer. On the desktop the recorder
//   draws its own (a small pixel arrow) where the mouse is, and on the phone
//   it shows a dot for a few frames after each tap. Both are plain elements
//   added from outside, on top of everything, and never take clicks.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pump, reactOnClock } from "./boot.mjs";
import { encodeGif, frameName } from "./gif.mjs";

// A 1-bit arrow: B black, W white, space transparent. Drawn at 2x.
const ARROW = [
  "B          ",
  "BB         ",
  "BWB        ",
  "BWWB       ",
  "BWWWB      ",
  "BWWWWB     ",
  "BWWWWWB    ",
  "BWWWWWWB   ",
  "BWWWWWWWB  ",
  "BWWWWWWWWB ",
  "BWWWWWBBBBB",
  "BWWBWWB    ",
  "BWB BWWB   ",
  "BB  BWWB   ",
  "B    BWWB  ",
  "     BWWB  ",
  "      BB   ",
];
const ARROW_SCALE = 2;

function arrowSvg() {
  const fill = { B: "#000", W: "#fff" };
  const rects = [];
  ARROW.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (fill[c]) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill[c]}"/>`);
    }),
  );
  const w = ARROW[0].length;
  const h = ARROW.length;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * ARROW_SCALE}" height="${h * ARROW_SCALE}" ` +
    `viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects.join("")}</svg>`
  );
}

// Right after a big change, Chromium can hand back a screenshot before it has
// finished re-rasterising, and the edges of rotated things (the sticky notes)
// come out anti-aliased a touch differently. So each frame is shot until two
// screenshots in a row agree.
const MAX_SHOTS_PER_FRAME = 8;

// `prepare` runs before every attempt: a CSS transition the browser only
// creates while painting the previous attempt still gets pinned to this
// frame's page time instead of running on its own.
async function stableScreenshot(page, opts, prepare) {
  await prepare();
  let prev = await page.screenshot(opts);
  for (let i = 1; i < MAX_SHOTS_PER_FRAME; i++) {
    await page.waitForTimeout(15);
    await prepare();
    const next = await page.screenshot(opts);
    if (next.equals(prev)) return next;
    prev = next;
  }
  throw new Error(`the page kept changing across ${MAX_SHOTS_PER_FRAME} screenshots of one frame`);
}

const TOUCH_FRAMES = 4;
const TOUCH_SIZE = 36;

/**
 * Starts filming `page`. Options:
 *   dir        empty folder for the frames (capture.mjs makes one)
 *   fps        12.5 or 10 (see gif.mjs for why)
 *   clip       { x, y, width, height } to crop every frame
 *   pointer    { x, y } to draw the arrow from that spot, or omit for none
 *   touch      true to show a dot on taps (phone shots)
 *   maxFrames  safety cap so a runaway script can't fill the disk
 *   onFrame    (pageTimeMs) => void, called before each screenshot; throw to
 *              stop (signal.mjs uses it as its cut-off guard)
 */
export async function film(page, { dir, fps = 12.5, clip, pointer, touch = false, maxFrames = 300, onFrame }) {
  const step = 1000 / fps;
  mkdirSync(dir, { recursive: true });
  const times = [];
  let mouse = pointer ? { x: Math.round(pointer.x), y: Math.round(pointer.y) } : null;
  let touchAt = null;
  let touchLeft = 0;

  await page.evaluate(
    ({ svg, size }) => {
      // On <html>, not <body>: React owns body's children.
      const host = document.documentElement;
      const make = (id, css) => {
        if (document.getElementById(id)) return;
        const el = document.createElement("div");
        el.id = id;
        el.style.cssText =
          "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;display:none;" + css;
        host.appendChild(el);
        return el;
      };
      const arrow = make("__rm-pointer", "image-rendering:pixelated;");
      if (arrow) arrow.innerHTML = svg;
      make(
        "__rm-touch",
        `width:${size}px;height:${size}px;margin:-${size / 2}px 0 0 -${size / 2}px;border-radius:50%;` +
          "background:rgba(70,70,70,0.45);box-shadow:0 0 0 2px rgba(255,255,255,0.75);",
      );
    },
    { svg: arrowSvg(), size: TOUCH_SIZE },
  );
  if (mouse) await page.mouse.move(mouse.x, mouse.y);

  // Requests still on their way. Opening an app the first time fetches its
  // code as a separate chunk, on real time, so without waiting for these a
  // window could land a frame early on one run and a frame late on the next.
  // Audio and video are left out: the music player streams, and a stream can
  // stay open for as long as the page does.
  const inflight = new Set();
  page.on("request", (r) => {
    if (r.resourceType() !== "media") inflight.add(r);
  });
  page.on("requestfinished", (r) => inflight.delete(r));
  page.on("requestfailed", (r) => inflight.delete(r));

  if (!(await reactOnClock(page))) {
    throw new Error("film() needs a page staged with reactOnClock (capture.mjs sets it for gif shots)");
  }

  /** Lets the page finish everything due at this moment, including loads
   *  that work kicks off (a lazy chunk, an image), without moving the clock. */
  // Says what's pending by resource type only: request URLs stay out of the
  // output (some local file names shouldn't be printed).
  const pending = () =>
    inflight.size > 0 && `${inflight.size} request(s) in flight (${[...inflight].map((r) => r.resourceType()).join(", ")})`;
  const flush = () => pump(page, { busy: pending });

  async function frame() {
    if (times.length >= maxFrames) throw new Error(`more than ${maxFrames} frames; raise maxFrames if that's intended`);
    // Whatever the script just did (a key, a dispatched event) gets to finish
    // rendering at this moment, so it shows on this frame every run.
    await flush();
    // Images and fonts load on real time. Waiting for them here means a
    // window's pictures show up on the frame the window opens, every run,
    // instead of whenever the disk happened to answer. Lazy images below or
    // above the screen are left alone: they're not in the frame, and calling
    // decode() on one that hasn't started loading crashes the headless tab
    // (the phone's Music player has a few dozen album covers like that).
    await page.evaluate(async () => {
      await document.fonts.ready;
      const offscreen = (i) => {
        const r = i.getBoundingClientRect();
        return r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth;
      };
      await Promise.all(
        [...document.images]
          .filter((i) => i.src && !i.complete && !(i.loading === "lazy" && offscreen(i)))
          .map((i) => i.decode().catch(() => {})),
      );
    });
    const now = await page.evaluate(() => Date.now());
    if (onFrame) await onFrame(now);
    // Pins every CSS animation to this frame's page time and places the
    // pointer and touch dot. Repeated before each screenshot attempt.
    const prepare = () =>
      page.evaluate(
        ({ mouse, touchAt, touchOn }) => {
          const t = Date.now();
          const born = (window.__rmBorn ??= new WeakMap());
          for (const a of document.getAnimations()) {
            if (!born.has(a)) born.set(a, t);
            a.pause();
            a.currentTime = t - born.get(a);
          }
          const p = document.getElementById("__rm-pointer");
          if (p) {
            p.style.display = mouse ? "block" : "none";
            if (mouse) p.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
          }
          const d = document.getElementById("__rm-touch");
          if (d) {
            d.style.display = touchOn ? "block" : "none";
            if (touchOn) d.style.transform = `translate(${touchAt.x}px, ${touchAt.y}px)`;
          }
        },
        { mouse, touchAt, touchOn: touchLeft > 0 },
      );
    writeFileSync(join(dir, frameName(times.length)), await stableScreenshot(page, { clip, caret: "hide" }, prepare));
    times.push(now);
    if (touchLeft > 0) touchLeft--;
    await page.clock.runFor(step);
    await flush();
  }

  const ease = (t) => t * t * (3 - 2 * t);

  const rec = {
    times,
    frame,
    /** `n` frames with nothing happening. */
    async hold(n) {
      for (let i = 0; i < n; i++) await frame();
    },
    /** Glides the mouse to (x, y) over `n` frames, eased at both ends. */
    async moveTo(x, y, n) {
      const from = mouse ?? { x, y };
      for (let i = 1; i <= n; i++) {
        const t = ease(i / n);
        mouse = { x: Math.round(from.x + (x - from.x) * t), y: Math.round(from.y + (y - from.y) * t) };
        await page.mouse.move(mouse.x, mouse.y);
        await frame();
      }
    },
    /** Glides to the middle of a locator. */
    async moveToLocator(locator, n, { dx = 0, dy = 0 } = {}) {
      const box = await locator.boundingBox();
      if (!box) throw new Error("that element isn't on screen");
      await rec.moveTo(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, n);
    },
    down: () => page.mouse.down(),
    up: () => page.mouse.up(),
    async click() {
      await page.mouse.down();
      await page.mouse.up();
    },
    dblclick: () => page.mouse.dblclick(mouse.x, mouse.y),
    key: (k) => page.keyboard.press(k),
    /** A real touch tap at (x, y), shown as a dot for a few frames. */
    async tap(x, y) {
      touchAt = { x: Math.round(x), y: Math.round(y) };
      touchLeft = touch ? TOUCH_FRAMES : 0;
      await page.touchscreen.tap(touchAt.x, touchAt.y);
    },
    async tapLocator(locator) {
      const box = await locator.boundingBox();
      if (!box) throw new Error("that element isn't on screen");
      await rec.tap(box.x + box.width / 2, box.y + box.height / 2);
    },
    /** Encodes what's been filmed to `out` and deletes the frames (unless
     *  MEDIA_KEEP_FRAMES=1, for looking at what went into a GIF). */
    async encode(out) {
      try {
        return await encodeGif(dir, out, { fps });
      } finally {
        if (!process.env.MEDIA_KEEP_FRAMES) rmSync(dir, { recursive: true, force: true });
      }
    },
  };
  return rec;
}

// A "stage" is a fresh browser context and page set up so a shot comes out the
// same every run: seeded Math.random, a frozen clock in a fixed timezone,
// localStorage written before the app reads it, and every request that isn't
// to the local server either answered from fixtures or blocked.
//
// Nothing here reaches into the app. Everything goes in from outside, the way
// a visitor's browser would hold it: storage, the clock, network answers.

import { readFile } from "node:fs/promises";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BLOG_ORIGIN } from "./build.mjs";
import { contentType, resolveFile } from "./serve.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "..", "fixtures");
const readJson = (name) => JSON.parse(readFileSync(join(FIXTURES, name), "utf8"));

/** 2026-03-17 10:42:00, shown as-is because the stage runs in UTC. */
export const FROZEN_TIME = Date.UTC(2026, 2, 17, 10, 42, 0);
export const TIMEZONE = "UTC";

export const DESKTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };

const PREFS_DEFAULTS = {
  palette: "workbench",
  pattern: "checker",
  saver: "off",
  saverIdle: 90,
  pet: "off",
  petDelay: 180,
};

/** Where the blog's borrowed font files are served: on the blog's own address,
 *  which the stage answers from blog/out. Not on the local server: Chromium's
 *  Private Network Access rules block a public origin from loading anything
 *  off loopback, CORS headers or not. */
const BLOG_FONT_PATH = "/__readme-media/fonts/";

/**
 * Builds the font CSS the blog asks Google for, out of the @font-face rules
 * the client build already self-hosts. Same families, same files, so the blog
 * looks like the real one without a request leaving the machine. Returns the
 * CSS and the requested styles the client has no file for.
 */
function fontCss(clientOut) {
  const dir = join(clientOut, "_next", "static", "chunks");
  const rules = [];
  for (const name of readdirSync(dir).filter((f) => f.endsWith(".css"))) {
    const css = readFileSync(join(dir, name), "utf8");
    for (const rule of css.match(/@font-face\{[^}]*\}/g) ?? []) {
      if (!/font-family:\s*"?(VT323|IBM Plex Mono)"?;/.test(rule)) continue;
      rules.push(rule.replace(/url\(\.\.\/media\//g, `url(${BLOG_ORIGIN}${BLOG_FONT_PATH}`));
    }
  }
  const has = (family, style, weight) =>
    rules.some(
      (r) =>
        r.includes(`font-family:${family};`) &&
        r.includes(`font-style:${style}`) &&
        r.includes(`font-weight:${weight}`),
    );
  const wanted = [
    ["IBM Plex Mono", "normal", 400],
    ["IBM Plex Mono", "normal", 600],
    ["IBM Plex Mono", "italic", 400],
    ["VT323", "normal", 400],
  ];
  const missing = wanted.filter(([f, s, w]) => !has(f, s, w)).map(([f, s, w]) => `${f} ${s} ${w}`);
  return { css: rules.join("\n"), missing };
}

const json = (body, status = 200) => ({
  status,
  contentType: "application/json; charset=utf-8",
  headers: { "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});

/** The fake API. Returns a fulfil payload, or null for "not mocked". */
function answer(method, path, body, { time, guestbook, api }) {
  const gb = guestbook.entries;
  if (method === "GET" && path === "/api/guestbook") return json(gb);
  if (method === "GET" && path === "/api/guestbook/stats") return json(guestbook.stats);
  if (method === "POST" && path === "/api/guestbook/visit") return json(guestbook.stats);
  if (method === "POST" && path === "/api/guestbook") {
    let sent = {};
    try {
      sent = JSON.parse(body ?? "{}");
    } catch {
      /* the client always sends JSON; an odd body still gets an entry back */
    }
    const at = new Date(time).toISOString();
    const seq = Math.max(0, ...gb.map((e) => e.seq ?? 0)) + 1;
    return json({ _id: `fixture-${seq}`, seq, ...sent, createdAt: at, updatedAt: at }, 201);
  }
  if (method === "GET" && path === "/api/health") return json({ ...api.health, ts: time });
  if (method === "GET" && path === "/api/fun/uptime") return json(api.uptime);
  if (method === "GET" && path === "/api/fun/whoami") return json(api.whoami);
  if (/^\/api\/blog\/[^/]+\/stats$/.test(path) && method === "GET") return json(api.postStats);
  if (/^\/api\/blog\/[^/]+\/view$/.test(path) && method === "POST") return json(api.postStats);
  if (/^\/api\/blog\/[^/]+\/comments$/.test(path) && method === "GET") return json(api.postComments);
  return null;
}

/**
 * First frame of a GIF as PNG bytes. Animated GIFs (a gallery piece, a game
 * cover) play on the wall clock, so a still would catch a different frame
 * every run. Decoding is done by the same Chromium, with WebCodecs'
 * ImageDecoder, in a throwaway context with no routes; results are cached per
 * file for the whole run.
 */
const frozenGifs = new Map();
function firstFramePng(browser, origin, file) {
  if (!frozenGifs.has(file)) {
    frozenGifs.set(
      file,
      (async () => {
        const data = (await readFile(file)).toString("base64");
        const context = await browser.newContext();
        try {
          const page = await context.newPage();
          // ImageDecoder needs a secure context; the local server counts.
          await page.goto(`${origin}/404.html`);
          const png = await page.evaluate(async (b64) => {
            const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            const decoder = new ImageDecoder({ data: bytes, type: "image/gif" });
            const { image } = await decoder.decode({ frameIndex: 0 });
            const canvas = new OffscreenCanvas(image.displayWidth, image.displayHeight);
            canvas.getContext("2d").drawImage(image, 0, 0);
            image.close();
            decoder.close();
            const out = new Uint8Array(await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer());
            let s = "";
            for (const b of out) s += String.fromCharCode(b);
            return btoa(s);
          }, data);
          return Buffer.from(png, "base64");
        } finally {
          await context.close();
        }
      })(),
    );
  }
  return frozenGifs.get(file);
}

function initScript({ seed, local, session }) {
  // mulberry32: tiny, fast, and the same sequence for the same seed. Every
  // frame (the blog iframe too) starts from the shot's seed.
  let a = seed >>> 0;
  Math.random = function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  try {
    for (const [k, v] of Object.entries(local)) localStorage.setItem(k, v);
    for (const [k, v] of Object.entries(session)) sessionStorage.setItem(k, v);
  } catch {
    /* an opaque frame (about:blank) has no storage; nothing to seed there */
  }
}

/**
 * Opens a staged context and page.
 *
 * opts:
 *   origin       the local server (required)
 *   clientOut    path to client/out, for the font CSS and GIFs (required)
 *   blogOut      path to blog/out, served on the blog's address (required)
 *   seed         Math.random seed (default 1)
 *   prefs        merged over PREFS_DEFAULTS (pet and saver off by default)
 *   readme       true to let About This Site open itself after boot
 *   standFolded  true to fold the desktop guestbook stand
 *   player       wb:player object, e.g. { lastTrackId: "..." }
 *   device       a Playwright device descriptor (phone shots); overrides DESKTOP
 *   viewport     overrides the viewport of DESKTOP or device
 *   time         epoch ms to freeze at (default FROZEN_TIME)
 *   freezeGifs   false to let local GIFs animate (default: first frame only)
 */
export async function newStage(browser, opts) {
  const { origin, clientOut, blogOut } = opts;
  const time = opts.time ?? FROZEN_TIME;
  const local = new URL(origin).host;
  const report = { blocked: [], unmocked: [], mocked: 0, fontsMissing: [] };

  const base = opts.device ? { ...opts.device } : { ...DESKTOP };
  // Device descriptors name the engine they were written for (WebKit for
  // iPhones). That isn't a context option, and the capture is Chromium-only.
  delete base.defaultBrowserType;
  if (opts.viewport) base.viewport = opts.viewport;
  const context = await browser.newContext({
    ...base,
    timezoneId: TIMEZONE,
    locale: "en-GB",
    colorScheme: "light",
    serviceWorkers: "block",
  });

  const localStore = {
    "wb:prefs": JSON.stringify({ ...PREFS_DEFAULTS, ...opts.prefs }),
    "wb:sfx": JSON.stringify({ enabled: false, volume: 0.3 }),
  };
  if (!opts.readme) localStore["wb:readme-seen"] = "1";
  if (opts.standFolded) localStore["wb:guestbook-collapsed"] = "1";
  if (opts.player) {
    localStore["wb:player"] = JSON.stringify({
      volume: 0.8,
      shuffle: false,
      repeat: "off",
      lastTrackId: null,
      ...opts.player,
    });
  }
  // Already counted for this tab, so the stand doesn't POST a visit.
  const sessionStore = { "wb:guestbook-counted": "1" };
  await context.addInitScript(initScript, { seed: opts.seed ?? 1, local: localStore, session: sessionStore });

  const fixtures = { time, guestbook: readJson("guestbook.json"), api: readJson("api.json") };
  const fonts = fontCss(clientOut);
  const fontDir = join(clientOut, "_next", "static", "media");

  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());

    if (url.host === local) {
      if (opts.freezeGifs !== false && url.pathname.toLowerCase().endsWith(".gif")) {
        const file = await resolveFile(clientOut, url.pathname);
        if (file) {
          return route.fulfill({
            status: 200,
            contentType: "image/png",
            body: await firstFramePng(browser, origin, file),
          });
        }
      }
      return route.continue();
    }

    if (url.origin === BLOG_ORIGIN && url.pathname.startsWith(BLOG_FONT_PATH)) {
      const file = await resolveFile(fontDir, "/" + url.pathname.slice(BLOG_FONT_PATH.length));
      if (!file) return route.fulfill({ status: 404, body: "no such font" });
      return route.fulfill({ status: 200, contentType: contentType(file), body: await readFile(file) });
    }

    if (url.origin === BLOG_ORIGIN) {
      const file = (await resolveFile(blogOut, url.pathname)) ?? (await resolveFile(blogOut, "/404.html"));
      if (!file) return route.fulfill({ status: 404, body: "not found" });
      return route.fulfill({
        status: file.endsWith("404.html") && url.pathname !== "/404.html" ? 404 : 200,
        contentType: contentType(file),
        body: await readFile(file),
      });
    }

    if (url.host === "fonts.googleapis.com") {
      report.mocked++;
      // Only worth mentioning once something (the blog) actually asked.
      report.fontsMissing = fonts.missing;
      return route.fulfill({ status: 200, contentType: "text/css; charset=utf-8", body: fonts.css });
    }

    if (url.pathname.startsWith("/api/")) {
      if (req.method() === "OPTIONS") {
        return route.fulfill({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      }
      const res = answer(req.method(), url.pathname, req.postData(), fixtures);
      if (res) {
        report.mocked++;
        return route.fulfill(res);
      }
      report.unmocked.push(`${req.method()} ${req.url()}`);
      return route.fulfill(json({ error: "not mocked in scripts/readme-media" }, 404));
    }

    report.blocked.push(`${req.method()} ${req.url()}`);
    return route.abort("blockedbyclient");
  });

  // Install a second before the frozen moment and pause on it, so the page
  // loads with Date, timers and rAF all stopped at exactly FROZEN_TIME. From
  // here on, time only moves when a shot calls `advance` (lib/boot.mjs).
  await context.clock.install({ time: time - 1000 });
  await context.clock.pauseAt(time);

  const page = await context.newPage();
  return { context, page, report, origin, time };
}

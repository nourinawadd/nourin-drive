#!/usr/bin/env node
// `npm run media`: builds the site with capture-only settings (or reuses the
// last such build), serves it on a random localhost port, drives it with
// Playwright's Chromium and writes the README screenshots to docs/media/.
//
//   npm run media                      every shot
//   npm run media -- --list            names only, no build
//   npm run media -- --only palettes   one shot (comma-separate for more)
//   npm run media -- --rebuild         build even if the last build still fits
//   npm run media -- --headed          show the browser while it works
//   npm run media -- --check           run each shot twice and compare bytes
//
// Shots live in shots/*.mjs. Each file exports one shot or an array of them:
// `{ name, scratch?, run(ctx) }`. `ctx.save(rel)` hands back the path to
// write to, inside docs/media/ (or the scratch folder for `scratch` shots),
// and records the file for the size summary.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { ensureBuild, paths } from "./lib/build.mjs";
import { serve } from "./lib/serve.mjs";
import { newStage } from "./lib/stage.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const MEDIA_DIR = join(ROOT, "docs", "media");
const SCRATCH_DIR = join(tmpdir(), "readme-media");

function parseArgs(argv) {
  const opts = { list: false, only: null, rebuild: false, headed: false, check: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") opts.list = true;
    else if (a === "--rebuild") opts.rebuild = true;
    else if (a === "--headed") opts.headed = true;
    else if (a === "--check") opts.check = true;
    else if (a === "--only") {
      const v = argv[++i];
      if (!v || v.startsWith("--")) throw new Error("--only needs a shot name");
      opts.only = v.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (a.startsWith("--only=")) {
      opts.only = a.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean);
    } else throw new Error(`unknown flag: ${a}`);
  }
  return opts;
}

async function loadShots() {
  const dir = join(HERE, "shots");
  const shots = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort()) {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    const list = Array.isArray(mod.default) ? mod.default : [mod.default];
    for (const shot of list) {
      if (!shot?.name || typeof shot.run !== "function") {
        throw new Error(`shots/${file} exports something that isn't a shot`);
      }
      shots.push({ ...shot, file });
    }
  }
  const seen = new Set();
  for (const s of shots) {
    if (seen.has(s.name)) throw new Error(`two shots are called "${s.name}"`);
    seen.add(s.name);
  }
  return shots;
}

function pick(shots, only) {
  if (!only) return shots.filter((s) => !s.scratch);
  const missing = only.filter((n) => !shots.some((s) => s.name === n));
  if (missing.length) throw new Error(`no such shot: ${missing.join(", ")} (try --list)`);
  return shots.filter((s) => only.includes(s.name));
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const shots = await loadShots();

  if (opts.list) {
    for (const s of shots) console.log(`${s.name}${s.scratch ? "  (scratch)" : ""}`);
    return 0;
  }

  const chosen = pick(shots, opts.only);
  if (!chosen.length) {
    console.log("nothing to capture yet.");
    return 0;
  }

  ensureBuild(ROOT, { rebuild: opts.rebuild });
  const server = await serve(paths(ROOT).clientOut);
  console.log(`  serving client/out at ${server.origin}`);
  // No hostname resolves in this browser except the local server. The stage
  // answers or aborts every request before it would need DNS, so this changes
  // nothing for the shots; it's the backstop for traffic routing never sees,
  // like the blog's <link rel="preconnect"> to Google Fonts, and for any
  // routing mistake. Without it, the capture build's real API and blog
  // addresses would be one bug away from the live site.
  const browser = await chromium.launch({
    headless: !opts.headed,
    args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"],
  });

  const notes = [];
  const tally = { failed: 0, mocked: 0, blocked: 0, unmocked: 0, fontsMissing: new Set() };

  // One pass over the chosen shots. `baseFor(shot)` says where its files go;
  // returns what was written as { shot, rel, abs }.
  async function pass(baseFor, label = "") {
    const written = [];
    for (const shot of chosen) {
      const base = baseFor(shot);
      const stages = [];
      const ctx = {
        browser,
        origin: server.origin,
        root: ROOT,
        log: (msg) => notes.push(`[${shot.name}] ${msg}`),
        /** A staged context + page (lib/stage.mjs); closed after the shot. */
        stage: async (stageOpts = {}) => {
          const s = await newStage(browser, {
            ...stageOpts,
            origin: server.origin,
            clientOut: paths(ROOT).clientOut,
            blogOut: paths(ROOT).blogOut,
          });
          stages.push(s);
          return s;
        },
        save: (rel) => {
          const abs = join(base, rel);
          mkdirSync(dirname(abs), { recursive: true });
          written.push({ shot: shot.name, rel, abs });
          return abs;
        },
      };
      process.stdout.write(`  shot: ${shot.name}${label} ... `);
      try {
        await shot.run(ctx);
        console.log("ok");
      } catch (err) {
        tally.failed++;
        console.log("FAILED");
        console.error(`    ${err?.stack ?? err}`);
      } finally {
        for (const s of stages) {
          await s.context.close().catch(() => {});
          // A request that reached the fake API with no answer means the shot
          // shows an error state somewhere: that's a failed shot, not a note.
          for (const u of s.report.unmocked) {
            tally.failed++;
            notes.push(`[${shot.name}] UNMOCKED api call: ${u}`);
          }
          for (const b of s.report.blocked) notes.push(`[${shot.name}] blocked: ${b}`);
          tally.mocked += s.report.mocked;
          tally.blocked += s.report.blocked.length;
          tally.unmocked += s.report.unmocked.length;
          for (const f of s.report.fontsMissing) tally.fontsMissing.add(f);
        }
      }
    }
    return written;
  }

  let written;
  const verdicts = [];
  try {
    written = await pass((shot) => (shot.scratch ? SCRATCH_DIR : MEDIA_DIR));

    // --check: the same shots again into a throwaway folder, then a byte
    // comparison with the first pass. Any difference is a determinism bug
    // (an animation, a decode race, unseeded randomness) to fix at the source.
    if (opts.check) {
      const again = join(SCRATCH_DIR, "check");
      rmSync(again, { recursive: true, force: true });
      const second = await pass(() => again, " (again)");
      for (const w of written) {
        const twin = second.find((s) => s.shot === w.shot && s.rel === w.rel);
        const same = twin && existsSync(twin.abs) && readFileSync(w.abs).equals(readFileSync(twin.abs));
        if (!same) tally.failed++;
        verdicts.push(`    ${w.rel.replaceAll("\\", "/")}  ${same ? "identical" : "DIFFERS"}`);
      }
      rmSync(again, { recursive: true, force: true });
    }
  } finally {
    await browser.close();
    await server.close();
  }

  if (notes.length) console.log("\n" + [...new Set(notes)].map((n) => `  ${n}`).join("\n"));
  console.log(
    `\n  network: ${tally.mocked} answered from fixtures, ${tally.blocked} blocked, ` +
      `${tally.unmocked} unmocked api calls`,
  );
  if (tally.fontsMissing.size) {
    console.log(`  blog fonts with no local file (browser fakes them): ${[...tally.fontsMissing].join(", ")}`);
  }
  if (written.length) {
    console.log("\n  files:");
    let media = 0;
    for (const { abs } of written) {
      const shown = abs.startsWith(ROOT) ? relative(ROOT, abs) : abs;
      const size = statSync(abs).size;
      if (abs.startsWith(MEDIA_DIR)) media += size;
      console.log(`    ${shown.replaceAll("\\", "/")}  ${kb(size)}${size > 1024 * 1024 ? "  OVER 1 MB" : ""}`);
    }
    if (existsSync(MEDIA_DIR)) console.log(`  docs/media total: ${kb(dirSize(MEDIA_DIR))} (this run: ${kb(media)})`);
  }
  if (verdicts.length) console.log("\n  determinism (two runs, byte compare):\n" + verdicts.join("\n"));
  return tally.failed ? 1 : 0;
}

function dirSize(dir) {
  let total = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    total += e.isDirectory() ? dirSize(p) : statSync(p).size;
  }
  return total;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`\n  ${err?.message ?? err}`);
    process.exit(1);
  },
);

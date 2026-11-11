// Finding and running ffmpeg for the GIFs.
//
// The lookup order lets every setup work without editing anything:
// FFMPEG_PATH if you've pointed it somewhere on purpose, then the binary the
// ffmpeg-static devDependency downloads on install (the default, same version
// everywhere), then whatever `ffmpeg` is on PATH. Playwright ships an ffmpeg
// too, but it's cut down for video recording and can't write GIFs, so it's
// never used.

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let resolved;

/** `{ path, from }` for the ffmpeg to use, or throws with what to do about it. */
export function findFfmpeg() {
  if (resolved) return resolved;

  const fromEnv = process.env.FFMPEG_PATH;
  if (fromEnv) {
    if (!existsSync(fromEnv)) throw new Error(`FFMPEG_PATH points at ${fromEnv}, which doesn't exist`);
    return (resolved = { path: fromEnv, from: "FFMPEG_PATH" });
  }

  try {
    const p = require("ffmpeg-static");
    if (p && existsSync(p)) return (resolved = { path: p, from: "ffmpeg-static" });
  } catch {
    /* not installed; fall through to PATH */
  }

  // `ffmpeg -version` succeeding is the cheapest "is it on PATH" test that
  // works the same on Windows and elsewhere.
  const probe = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (probe.status === 0) return (resolved = { path: "ffmpeg", from: "PATH" });

  throw new Error(
    "no ffmpeg found. run `npm install` (ffmpeg-static downloads one; if npm skipped its " +
      "install script, `npm install-scripts approve ffmpeg-static`), put ffmpeg on PATH, " +
      "or set FFMPEG_PATH",
  );
}

/** Runs ffmpeg with an argument list (no shell, so paths with spaces are fine). */
export function ffmpeg(args) {
  const { path } = findFfmpeg();
  return new Promise((done, fail) => {
    const child = spawn(path, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    child.on("error", fail);
    child.on("close", (code) => (code === 0 ? done() : fail(new Error(`ffmpeg exited ${code}: ${err.trim()}`))));
  });
}

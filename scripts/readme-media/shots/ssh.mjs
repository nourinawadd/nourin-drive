// docs/media/ssh.gif: `ssh nourin.is-a.dev`, the terminal version, recorded
// from scripts/readme-media/ssh.tape with VHS. Optional: without `vhs` on
// PATH the shot is skipped with a note, and everything else still runs.
//
// It's the only shot that touches the live server, so it's marked `live`:
// it can't be repeatable, and `--check` doesn't compare it. VHS needs ffmpeg
// too; it gets the same one the other GIFs use.

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { delimiter, dirname, isAbsolute, join } from "node:path";
import { findFfmpeg } from "../lib/ffmpeg.mjs";

export default {
  name: "ssh",
  gif: true,
  live: true,
  async run({ root, save }) {
    const probe = spawnSync("vhs", ["--version"], { encoding: "utf8", shell: false });
    if (probe.error || probe.status !== 0) {
      return { skipped: "vhs isn't installed; see docs/readme-media.md to add ssh.gif" };
    }

    // VHS takes its output path from the tape, so a copy of the tape gets
    // this run's Output line at the top.
    const out = save("ssh.gif");
    const tape = readFileSync(join(root, "scripts/readme-media/ssh.tape"), "utf8");
    const cache = join(root, "node_modules", ".cache", "readme-media");
    mkdirSync(cache, { recursive: true });
    const runTape = join(cache, "ssh.tape");
    writeFileSync(runTape, `Output "${out.replaceAll("\\", "/")}"\n\n${tape}`);

    const ff = findFfmpeg().path;
    const env = { ...process.env };
    if (isAbsolute(ff)) env.PATH = `${dirname(ff)}${delimiter}${env.PATH ?? ""}`;
    const run = spawnSync("vhs", [runTape], { cwd: root, env, encoding: "utf8", shell: false });
    if (run.error || run.status !== 0) {
      throw new Error(`vhs failed (exit ${run.status}): ${(run.stderr || run.stdout || String(run.error)).trim().slice(-600)}`);
    }
  },
};

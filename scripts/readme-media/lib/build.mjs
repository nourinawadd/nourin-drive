// Builds the blog and the client the way the capture needs them, and decides
// when an existing build can be reused.
//
// The client bakes its NEXT_PUBLIC_* settings in at build time, and Next also
// reads client/.env.local, which may carry real analytics ids and the real
// API. So the harness never trusts a client/out it didn't make: after its own
// build it leaves a stamp next to the output, and anything without a matching
// stamp gets rebuilt. Setting every variable in the process env matters too,
// because Next prefers the process env over .env files; the analytics ids are
// set to empty strings, which the client treats as "off".

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

// The real addresses, because they show on screen: API Studio's URL bar and
// the Blog window's address bar both print them. Nothing actually goes there.
// The stage routes every request that isn't to the local server: the API is
// answered from fixtures, the blog from blog/out, and anything else is
// aborted and logged. An API call with no fixture fails the run.
export const API_ORIGIN = "https://nourin.is-a.dev";
export const BLOG_ORIGIN = "https://blog.nourin.is-a.dev";

export const BUILD_ENV = {
  NEXT_PUBLIC_API_URL: API_ORIGIN,
  NEXT_PUBLIC_BLOG_URL: BLOG_ORIGIN,
  NEXT_PUBLIC_TTYD_URL: "/terminal/",
  NEXT_PUBLIC_GA_MEASUREMENT_ID: "",
  NEXT_PUBLIC_CLARITY_PROJECT_ID: "",
  NEXT_TELEMETRY_DISABLED: "1",
};

const STAMP_NAME = ".readme-media-build.json";

export function paths(root) {
  return {
    root,
    clientOut: join(root, "client", "out"),
    blogOut: join(root, "blog", "out"),
    stamp: join(root, "client", "out", STAMP_NAME),
  };
}

function run(cmd, { cwd, env }) {
  console.log(`\n  > ${cmd}\n`);
  // npm is a .cmd on Windows, which Node only spawns through a shell.
  const r = spawnSync(cmd, { cwd, env, stdio: "inherit", shell: true });
  if (r.status !== 0) throw new Error(`"${cmd}" exited with ${r.status ?? r.signal}`);
}

function git(root, args) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
}

/** Content hash of the blog's sources, so new posts trigger a rebuild. */
function blogHash(root) {
  const h = createHash("sha1");
  const blog = join(root, "blog");
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else h.update(relative(blog, p)).update(readFileSync(p));
    }
  };
  for (const part of ["content", "templates", "styles", "public", "scripts"]) walk(join(blog, part));
  for (const file of ["site.config.json", "blog.js"]) {
    const p = join(blog, file);
    if (existsSync(p)) h.update(file).update(readFileSync(p));
  }
  return h.digest("hex");
}

function wantedStamp(root) {
  return { sha: git(root, ["rev-parse", "HEAD"]), blog: blogHash(root), env: BUILD_ENV };
}

/** Why the current output can't be used, or null when it can. */
function staleReason(root, wanted) {
  const p = paths(root);
  if (!existsSync(join(p.clientOut, "index.html"))) return "client/out is missing";
  if (!existsSync(join(p.blogOut, "index.html"))) return "blog/out is missing";
  if (!existsSync(p.stamp)) return "client/out wasn't built by this harness";
  let have;
  try {
    have = JSON.parse(readFileSync(p.stamp, "utf8"));
  } catch {
    return "the build stamp is unreadable";
  }
  if (have.sha !== wanted.sha) return `HEAD moved (${have.sha.slice(0, 7)} -> ${wanted.sha.slice(0, 7)})`;
  if (have.blog !== wanted.blog) return "blog sources changed";
  if (JSON.stringify(have.env) !== JSON.stringify(wanted.env)) return "capture env changed";
  return null;
}

/** Builds when needed (or when forced). Returns true if it built. */
export function ensureBuild(root, { rebuild = false } = {}) {
  const wanted = wantedStamp(root);
  const reason = rebuild ? "--rebuild" : staleReason(root, wanted);
  if (!reason) {
    console.log(`  build: reusing client/out (stamped at ${wanted.sha.slice(0, 7)})`);
    return false;
  }

  console.log(`  build: building, because ${reason}`);
  const env = { ...process.env, ...BUILD_ENV };
  run("npm --workspace blog run build", { cwd: root, env });
  run("npm --workspace client run build", { cwd: root, env });
  writeFileSync(paths(root).stamp, JSON.stringify(wanted, null, 2) + "\n");
  warnGenerated(root);
  return true;
}

/** The client build runs `npm run gen`, which rewrites tracked files. */
export function warnGenerated(root) {
  const dirty = git(root, ["status", "--short", "--", "client/src/data"])
    .split("\n")
    .filter((l) => l.includes(".generated.ts"));
  if (!dirty.length) return;
  console.log(
    "\n  heads up: the build rewrote these tracked files. they're build output," +
      "\n  not part of the media, so leave them out of the commit:\n" +
      dirty.map((l) => `    ${l}`).join("\n") +
      "\n",
  );
}

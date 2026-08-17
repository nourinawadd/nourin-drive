// Shared terminal prompting for the `npm run add` / `npm run add:doc` wizards.
//
// Buffered line reader: works whether stdin is an interactive TTY (lines arrive
// one Enter at a time) or a pipe/file (all lines arrive at once) - readline's
// own question() drops piped lines, so we queue them ourselves.

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export function createPrompt() {
  const rl = createInterface({ input, output });
  const queue = [];
  let waiting = null;
  let closed = false;

  rl.on("line", (line) => {
    if (waiting) { const r = waiting; waiting = null; r(line); }
    else queue.push(line);
  });
  rl.on("close", () => {
    closed = true;
    if (waiting) { const r = waiting; waiting = null; r(null); }
  });

  const nextLine = () => {
    if (queue.length) return Promise.resolve(queue.shift());
    if (closed) return Promise.resolve(null);
    return new Promise((res) => { waiting = res; });
  };

  const ask = async (q, def) => {
    output.write(def ? `${q} (${def}): ` : `${q}: `);
    const line = await nextLine();
    const a = (line ?? "").trim();
    return a || def || "";
  };

  const askYesNo = async (q, def = true) => {
    output.write(`${q} (${def ? "Y/n" : "y/N"}): `);
    const a = ((await nextLine()) ?? "").trim().toLowerCase();
    if (!a) return def;
    return a.startsWith("y");
  };

  /** Read "- " lines until a blank line / EOF. */
  const askBullets = async (heading) => {
    console.log(heading);
    const bullets = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      output.write("  - ");
      const line = await nextLine();
      const b = (line ?? "").trim();
      if (!b) break;
      bullets.push(b);
    }
    return bullets;
  };

  return { rl, ask, askYesNo, askBullets, close: () => rl.close() };
}

export const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "entry";

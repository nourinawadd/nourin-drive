// Not README media: a quick "does the harness work at all" shot. It boots a
// staged desktop and saves it to the scratch folder, never to docs/media.
// Two runs should give byte-identical files, and the run summary should show
// nothing blocked and nothing unmocked.

import { boot, snap } from "../lib/boot.mjs";

export default {
  name: "smoke",
  scratch: true,
  async run({ stage, origin, save }) {
    const { page } = await stage({ seed: 1 });
    await boot(page, origin);
    await snap(page, save("smoke.png"));
  },
};

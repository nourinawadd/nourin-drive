// Lays several PNGs out as one image, using the browser we already have
// instead of an image library: a tiny HTML page with the tiles as data URLs at
// their exact pixel size, screenshotted. The page background is left
// transparent, so the gaps take on whatever the README is shown on (GitHub's
// light or dark theme) instead of a colour picked here.

import { readFile } from "node:fs/promises";

/**
 * tiles: absolute PNG paths, all the same size, in reading order.
 * Returns once `out` is written.
 */
export async function grid(browser, tiles, out, { cols, gap = 8, width, height }) {
  const rows = Math.ceil(tiles.length / cols);
  const total = { width: cols * width + (cols - 1) * gap, height: rows * height + (rows - 1) * gap };
  const imgs = await Promise.all(
    tiles.map(async (t) => `data:image/png;base64,${(await readFile(t)).toString("base64")}`),
  );

  const html = `<!doctype html><html><head><style>
    html, body { margin: 0; background: transparent; }
    .g { display: grid; grid-template-columns: repeat(${cols}, ${width}px);
         grid-auto-rows: ${height}px; gap: ${gap}px; }
    img { display: block; width: ${width}px; height: ${height}px; image-rendering: pixelated; }
  </style></head><body><div class="g">${imgs.map((src) => `<img src="${src}">`).join("")}</div></body></html>`;

  const page = await browser.newPage({ viewport: total, deviceScaleFactor: 1 });
  try {
    await page.setContent(html);
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
    await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, ...total } });
  } finally {
    await page.close();
  }
  return total;
}

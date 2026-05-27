# Gallery images — just drop them here

Put image files (`.jpg`, `.png`, `.webp`, `.gif`, `.avif`, ...) in this folder
and they show up in the Gallery app. No code to edit.

A script (`client/scripts/gen-gallery.mjs`) scans this folder and rebuilds the
gallery whenever you run `npm run dev` or `npm run build`. If the dev server is
already running and you add files, run `npm run gallery` (in `client/`) to
refresh, then reload the page.

## Categories — two ways (mix freely)

**1. Subfolders = categories (easiest):**

```
gallery/
  Photography/
    sunset over water.jpg
  Posters/
    jazz night.png
```

→ categories **Photography** and **Posters**, shown as filter tabs.

**2. Filename prefix for top-level files:**

| Filename                     | Category    | Title       |
| ---------------------------- | ----------- | ----------- |
| `Posters - Jazz Night.jpg`   | Posters     | Jazz Night  |
| `sunset.jpg`                 | Gallery     | sunset      |

## Titles, order, and dates

The title is the filename (extension stripped, `_` becomes a space). Optional:

| Filename                       | Title       | Order | Date    |
| ------------------------------ | ----------- | ----- | ------- |
| `01 - Jazz Night (2024).jpg`   | Jazz Night  | 1     | 2024    |
| `Skyline (2023-06).png`        | Skyline     | —     | 2023-06 |

Use images you own or are licensed to use.

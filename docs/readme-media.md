# README media

How the screenshots in the README get made, and how to make more. Nothing in
`docs/media/` is captured by hand. One command builds the site, opens it in a
headless Chromium, clicks through it and saves the pictures, and it gives the
same pixels every time you run it.

## The short version

```
npm install
npx playwright install chromium     # once per machine, ~150 MB, outside the repo
npm run media                       # every shot, into docs/media/
```

The first run builds the blog and the client, so it takes two or three
minutes. After that it reuses the build until something changes (see
[the build](#the-build)), and a full run takes a minute and a half.

```
scripts/readme-media/
  capture.mjs         the command: flags, build, server, runs the shots, prints sizes
  lib/build.mjs       builds blog + client with capture settings, decides when to rebuild
  lib/serve.mjs       a tiny static server for client/out on a random port
  lib/stage.mjs       a fresh browser per shot: seed, clock, storage, fake network
  lib/boot.mjs        booting, opening drives, moving windows, waiting, screenshots
  lib/compose.mjs     lays several PNGs out as one grid
  shots/*.mjs         one file per shot (or per group of shots)
  fixtures/*.json     what the fake api answers
docs/media/           the output
```

## Flags

```
npm run media -- --list                    every shot's name, no build
npm run media -- --only palettes           just that one
npm run media -- --only apps/music,apps/shell
npm run media -- --check                   run everything twice and compare the bytes
npm run media -- --rebuild                 build even if the last build still fits
npm run media -- --headed                  show the browser so you can watch
```

At the end of every run you get the network tally (answered, blocked,
unmocked), each file's size, anything over 1 MB flagged, and the total for
`docs/media/`. With `--check` you also get "identical" or "DIFFERS" for each
file, and the command fails if any differ.

## What's in the pictures

| File | What it is |
| --- | --- |
| `palettes.png` | the same desktop in all six palettes, a 3×2 grid of full 1280×800 desktops |
| `apps/<name>.png` | one app opened alone, cropped to its window: profile, explorer, ereader, music, gallery, shell, api-studio, guestbook, games, blog |
| `phone-home.png` | the phone launcher, on an emulated iPhone 15 |
| `phone-app.png` | User Profile open on the phone |
| `phone-music.png` | the launcher with a track loaded in the now-playing bar |

`smoke` is also in `--list`. It's a quick "does any of this work" shot that
saves a booted desktop to your temp folder (`%TEMP%\readme-media\` on
Windows), never to `docs/media/`. `--only` can run it; a plain
`npm run media` skips it.

## Why it comes out the same every run

Every shot starts from a clean browser context, and before the site loads:

- **Randomness is seeded.** `Math.random` is replaced with a small seeded
  generator, a different seed per shot, so the pet, the starfield and the
  shuffle always pick the same things.
- **Time is frozen** at 17 March 2026, 10:42:00, in UTC, and only moves when
  the script moves it, by fixed amounts. That's why the menu bar always reads
  `10:42:0x` and Profile's uptime is a second or two.
- **Storage is filled in** the way a returning visitor's browser would have
  it: palette and pattern, pet and screensaver off, sound effects off, the
  About window already seen, the visit already counted, and for the music
  shots a last-played track.
- **The network is fake.** Every request that isn't to the local server is
  answered or stopped:
  - `/api/...` on any address is answered from `fixtures/api.json` and
    `fixtures/guestbook.json`. A call with no answer fails the shot, because
    it would show an error somewhere in the picture.
  - The blog address is answered from the local `blog/out` build.
  - The blog's Google Fonts request is answered with the same VT323 and IBM
    Plex Mono files the client build already ships.
  - Anything else is blocked and listed in the summary.
  - Underneath all that, the browser can't look up any hostname except the
    local server's, so even something the routing never sees (like the
    blog's preconnect hints) can't reach the internet.
- **Looping animations are stopped** at their first frame when the screenshot
  is taken (the guestbook stand's pulsing button, blinking cursors).
- **Animated GIFs are frozen** at frame one. The gallery and the games list
  both have one, and they'd otherwise catch a different frame each time.

Byte-for-byte matching holds on one machine. Another OS or another Chromium
version renders fonts a little differently, so regenerate everything from one
machine rather than mixing files from two.

## The build

The capture never uses whatever is sitting in `client/out`. It builds the
client itself, with:

- the API and blog addresses set to the real ones (`https://nourin.is-a.dev`,
  `https://blog.nourin.is-a.dev`), because API Studio and the Blog window
  print them on screen. Nothing actually goes there; see above.
- analytics turned off, whatever `client/.env.local` says.

After building, it leaves a stamp at `client/out/.readme-media-build.json`.
It rebuilds when the stamp is missing, when you've moved to a different
commit, when anything in the blog changed, or when you pass `--rebuild`.
Uncommitted edits to the client don't count as a change, so pass
`--rebuild` after those.

## What not to commit

The client build runs `npm run gen`, which rewrites the tracked
`client/src/data/*.generated.ts` files. If `git status` shows them changed
after a capture, that's build output, not part of the media; leave them out
of the commit. After each build the command checks for them and prints a
reminder listing any that changed.

Commit the PNGs you meant to change and nothing else from `docs/media/`.
Every regeneration adds the binaries to history again, so regenerate when the
site has actually changed, not on every commit.

## Adding a shot

Make a file in `scripts/readme-media/shots/`. It exports a shot, or an array
of them for a group like `apps.mjs`:

```js
import { boot, openDrive, snap, windowByTitle } from "../lib/boot.mjs";

export default {
  name: "apps/prefs",                 // what --only and --list use
  async run({ stage, origin, root, save }) {
    const { page } = await stage({ seed: 400, standFolded: true });
    await boot(page, origin);         // load the desktop, click the disk
    await openDrive(page, "Prefs:");  // double-click a drive by its label
    const win = windowByTitle(page, "Prefs");
    await snap(win, save("apps/prefs.png"));   // save() is relative to docs/media/
  },
};
```

What a shot gets to work with:

- `stage(options)` returns `{ page, context }`, set up as described above and
  closed for you afterwards. Options:
  - `seed`: the random seed (give each shot its own).
  - `prefs`: overrides for the Prefs settings, e.g. `{ palette: "amber" }` or
    `{ pet: "cat" }`.
  - `readme: true` lets About This Site open itself after boot.
  - `standFolded: true` folds the guestbook stand.
  - `player: { lastTrackId }` loads a track (ids are in
    `client/src/data/tracks.generated.ts`).
  - `device` is a Playwright device for phone shots (see `phone.mjs`), and
    `viewport` sets a different size.
  - `time` freezes at another moment.
  - `freezeGifs: false` lets GIFs animate.
- `save(path)` gives you the path to write to and adds the file to the size
  summary. Shots marked `scratch: true` save to the temp folder instead.
- `log(message)` adds a line to the summary.
- `root` is the repo root, for anything that needs to read a file.

The helpers in `lib/boot.mjs`:

- `boot`, `openDrive`, `windowByTitle`, `dragWindow`, `resizeWindow`,
  `closeWindow`: the desktop, the way you'd use it with a mouse.
- `settle(page)`: wait until it looks finished. It waits for fonts, moves the
  clock a fixed second, waits for images to decode, then gives a short real
  pause for CSS transitions. Call it after anything that changes the screen.
- `advance(page, ms)`: move the clock by exactly that much.
- `snap(pageOrLocator, path)`: the screenshot to use, with looping animations
  stopped. Pass a window locator to crop to that window.
- `guardSignal(page, root)`: fails the shot if the easter egg's code is
  anywhere on screen. Call it before `snap` in anything that types or opens
  things. It reads the code out of the app at run time, so the code never
  appears in these scripts.

`lib/compose.mjs` has `grid(browser, tiles, out, { cols, gap, width, height })`
for putting several screenshots into one image; `palettes.mjs` uses it. The
gaps are transparent, so they match GitHub's light and dark backgrounds.

After adding a shot, run `npm run media -- --only <name> --check`, open the
PNG and look at it. If the check says DIFFERS, something on screen is moving
on its own: a CSS animation, an image still loading, a timer the shot didn't
wait for. Fix the cause (wait for the right thing, freeze it from the
outside) rather than adding sleeps.

## When something goes wrong

- **"UNMOCKED api call"**: the site asked the API for something
  `fixtures/` doesn't answer. Add it to `answer()` in `lib/stage.mjs`, with
  the same shape as the real controller in `server/src/controllers/`.
- **"blocked: ..."**: something tried to reach the outside world. Usually
  harmless, but if it's something the picture needs, serve it locally the way
  the blog and its fonts are.
- **A click times out saying something "intercepts pointer events"**: a
  window or sticky note is on top of what you're clicking. Move the window
  out of the way first (`palettes.mjs` parks each window off to the right as
  soon as it opens).
- **The blog shows in a plain monospace font**: the font request wasn't
  answered. Check that `client/out/_next/static/chunks/*.css` still has the
  `@font-face` rules `lib/stage.mjs` looks for.
- **Nothing changed after editing the client**: the build was reused. Pass
  `--rebuild`.

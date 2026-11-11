# README media

How the screenshots and GIFs in the README get made, and how to make more.
Nothing in `docs/media/` is captured by hand. One command builds the site,
opens it in a headless Chromium, clicks through it and saves the pictures and
GIFs, and it gives the same bytes every time you run it.

## The short version

```
npm install                         # also fetches ffmpeg for the GIFs (see below)
npx playwright install chromium     # once per machine, ~150 MB, outside the repo
npm run media                       # every shot, into docs/media/
```

The first run builds the blog and the client, which adds two or three
minutes. After that it reuses the build until something changes (see
[the build](#the-build)), and a full run takes about four minutes, most of it
filming the GIFs.

```
scripts/readme-media/
  capture.mjs         the command: flags, build, server, runs the shots, prints sizes
  lib/build.mjs       builds blog + client with capture settings, decides when to rebuild
  lib/serve.mjs       a tiny static server for client/out on a random port
  lib/stage.mjs       a fresh browser per shot: seed, clock, storage, fake network
  lib/boot.mjs        booting, opening drives, moving windows, waiting, screenshots
  lib/compose.mjs     lays several PNGs out as one grid
  lib/film.mjs        films a page frame by frame for a GIF, draws the pointer
  lib/gif.mjs         turns the frames into a GIF with ffmpeg
  lib/ffmpeg.mjs      finds ffmpeg
  shots/*.mjs         one file per shot (or per group of shots)
  fixtures/*.json     what the fake api answers
  ssh.tape            the terminal session for ssh.gif (VHS, optional)
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
unmocked), each file's size (and frame count for GIFs), any PNG over 1 MB
flagged, and the total for `docs/media/`. A GIF over 3 MB fails the run. With
`--check` you also get "identical" or "DIFFERS" for each file, and the
command fails if any differ. `ssh.gif` is the exception: it's recorded from
the live server, so `--check` doesn't run it twice and says "not compared".

## What's in the pictures

| File | What it is |
| --- | --- |
| `palettes.png` | the same desktop in all six palettes, a 3×2 grid of full 1280×800 desktops |
| `apps/<name>.png` | one app opened alone, cropped to its window: profile, explorer, ereader, music, gallery, shell, api-studio, guestbook, games, blog |
| `phone-home.png` | the phone launcher, on an emulated iPhone 15 |
| `phone-app.png` | User Profile open on the phone |
| `phone-music.png` | the launcher with a track loaded in the now-playing bar |
| `boot.gif` | the Kickstart screen, the pointer goes to the disk and clicks, the desktop boots and About This Site opens |
| `boot-dark.gif` | the same in the Midnight palette, for GitHub's dark mode |
| `desktop-tour.gif` | open Projects, resize it and drag it aside, open User, nudge it, minimise it to an icon |
| `boing.gif` | the Boing screensaver at 640×400, one left-right-left crossing so it loops |
| `starfield.gif` | the starfield screensaver at 640×400, five seconds |
| `pet.gif` | the cat walks in and climbs onto a window, a 640×400 crop of the desktop |
| `phone.gif` | the phone: tap the disk, tap Music, tap Back, on an iPhone 15 at 2x |
| `signal.gif` | the easter egg's start: the keys go in (not shown), the screen fades, cut before anything is typed |
| `ssh.gif` | `ssh nourin.is-a.dev`, optional, only made when VHS is installed |

`smoke` and `gif-smoke` are also in `--list`. They're quick "does any of this
work" shots (a booted desktop, a few frames of the saver fading in) that save
to your temp folder (`%TEMP%\readme-media\` on Windows), never to
`docs/media/`. `--only` can run them; a plain `npm run media` skips them.

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
  is taken (the guestbook stand's pulsing button, blinking cursors). GIFs
  can't do that, since the motion is the point; see
  [the GIFs](#the-gifs) for what they do instead.
- **Animated GIFs are frozen** at frame one. The gallery and the games list
  both have one, and they'd otherwise catch a different frame each time.

Byte-for-byte matching holds on one machine. Another OS or another Chromium
version renders fonts a little differently, so regenerate everything from one
machine rather than mixing files from two.

## The GIFs

A GIF shot is a staged page like any other, filmed one frame at a time with
`film()` from `lib/film.mjs`. It isn't a screen recording: nothing is timed
against the wall clock, which is why the GIFs repeat byte for byte the same
way the PNGs do.

### How filming works

- **One frame, then exactly one frame of time.** For each frame the recorder
  takes a screenshot, moves the page clock forward 80 ms and lets the page
  catch up. Anything the script does between frames (a mouse step, a key, a
  tap) happens at a known moment of page time, however slow the screenshots
  are. 12.5 fps is on purpose: GIF delays are whole hundredths of a second,
  and 80 ms is exactly 8 of them. 10 fps is exact too; 15 fps isn't.
- **React runs on the page clock.** Normally React schedules its work on the
  browser's real task queue, so a render could land between any two frames.
  Shots marked `gif: true` get a page where that work, `performance.now()`
  and `requestAnimationFrame` all follow the fake clock instead. The catch is
  that nothing renders until the clock moves, so use the helpers (`boot`,
  `warm`, `pump`, `dragWindow`) rather than plain Playwright waits on those
  pages; they know to move it.
- **It waits for what loads in real time.** Before each frame it waits for
  requests still in flight (an app's code is fetched the first time you open
  it) and for images on screen to decode. A window then shows up on the same
  frame every run, with its pictures, however fast the disk was. If something
  never finishes, it gives up after 15 seconds and says what it was waiting
  for.
- **CSS animations follow page time.** They run on the browser's real
  timeline, so before every screenshot each one is paused and set to how long
  it's been running in page time. The pulsing button, the saver fade and the
  signal fade step along with everything else. One thing it can't fix: a
  transition that started before filming began has already run for however
  long the machine took to get there. Finish it first; `savers.mjs` does this
  for the saver's fade-in.
- **Each frame is shot until two screenshots agree**, so a half-painted frame
  never gets in.
- **The pointer is drawn in.** Screenshots don't include the mouse, so the
  recorder adds a small pixel arrow where the mouse is, and on the phone a
  grey dot for a few frames after each tap. Both are added from outside, sit
  on top of everything and never take clicks.

The frames go to `node_modules/.cache/readme-media/frames/` (out of the repo
and off the system drive) and are deleted once the GIF is written, or when
the shot fails. Set `MEDIA_KEEP_FRAMES=1` to keep them for a look.

### ffmpeg

The GIFs are encoded by ffmpeg, from the `ffmpeg-static` dev dependency, so
everyone gets the same version. npm 11 doesn't run a package's install
script until it's approved, and `ffmpeg-static` downloads its binary in one,
so `package.json` approves exactly that version under `allowScripts`. A plain
`npm install` fetches it. If you upgrade `ffmpeg-static`, approve the new
version:

```
npm install-scripts approve ffmpeg-static --allow-scripts-pin
```

Otherwise the command looks for `FFMPEG_PATH`, then `ffmpeg` on PATH, and
the first line of every run says which one it used. Playwright's own ffmpeg
can't write GIFs, so it's never used.

Each GIF gets one 256-colour palette built from what changes between frames,
no dithering (it sprays noise over flat pixel art), and only the changed
part of each frame is stored. Frames are never scaled.

### Size

Each GIF has to stay under 3 MB, or the run fails. Today they go from about
50 KB (the pet) to about 1.3 MB (the desktop tour). If one gets too big, in
this order:

1. Drop to 10 fps (the `FPS` constant at the top of the shot; holds written
   with `secs()` keep their length).
2. Make it shorter.
3. Crop to where things happen (`clip`), like `pet.gif` does.

Never scale it down. Pixel art scaled by anything but a whole number turns
to mush, and that's worse than a bigger file.

### signal.gif

The easter egg starts with a pause, a fade and a hold, and only then types
its secret out, 2150 ms after the last key. The GIF stops at 2000 ms, and it's
guarded on every frame: if the page time reaches 2100 ms after the trigger,
or the code is anywhere on the page, the shot fails before that frame is
saved. The summary prints the guard's result (`last frame +2000 ms < 2100`).
The shot reads the key sequence out of `KonamiListener.tsx` and the code out
of `SignalReveal.tsx` when it runs, so neither is written down in these
scripts. Don't move the cut later, and don't add anything that shows which
keys were pressed.

### ssh.gif (optional)

This one is a terminal session, recorded by
[VHS](https://github.com/charmbracelet/vhs) from `scripts/readme-media/ssh.tape`
against the live server. Without `vhs` on PATH it's skipped with a note and
everything else runs as normal. To make it:

1. Install VHS (`winget install charmbracelet.vhs` or `scoop install vhs`).
   It also needs `ttyd` on PATH; see VHS's readme. It gets ffmpeg from this
   command, so you don't need another.
2. Run `ssh nourin.is-a.dev` once in a normal terminal and accept the host
   key, or the GIF will show that prompt.
3. `npm run media -- --only ssh`, then watch it. The keys in the tape are a
   first guess at looking around; change the moves and the `Sleep`s until it
   reads well.

It talks to the real server, so it can't come out the same twice; `--check`
leaves it out. Nothing private goes in the tape: the public address and
keystrokes only.

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

Commit the files you meant to change and nothing else from `docs/media/`.
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

A GIF shot says `gif: true` (which sets the page up for filming, see
[how filming works](#how-filming-works)) and uses `film` instead of `snap`:

```js
import { boot, windowByTitle } from "../lib/boot.mjs";

const FPS = 12.5;
const secs = (s) => Math.round(s * FPS);

export default {
  name: "prefs-gif",
  gif: true,
  async run({ stage, origin, film }) {
    const { page } = await stage({ seed: 740, standFolded: true });
    await boot(page, origin);
    const rec = await film(page, { fps: FPS, pointer: { x: 900, y: 600 } });
    await rec.hold(secs(0.6));                     // nothing happening
    await rec.moveToLocator(page.getByText("Prefs:"), secs(0.8));
    await rec.dblclick();
    await rec.hold(secs(1.5));
    await rec.save("prefs.gif");                   // encodes; relative to docs/media/
  },
};
```

`film(page, options)` takes `fps`, `clip` (crop every frame), `pointer` (draw
the arrow, starting there), `touch: true` (dots on taps, for phone shots),
`maxFrames` (a safety cap, 300 by default) and `onFrame(pageTime)`, which is
called before each screenshot and can throw to stop the shot. What you get
back records a frame for every step it takes:

- `hold(n)`: n frames of nothing.
- `moveTo(x, y, n)`, `moveToLocator(locator, n)`: glide the pointer there
  over n frames, easing in and out.
- `click()`, `dblclick()`, `down()`, `up()`, `key(name)`: these happen
  between frames and don't add any, so follow them with a `hold`.
- `tap(x, y)`, `tapLocator(locator)`: a real touch tap, with the dot.
- `save(path)`: writes the GIF and adds it to the summary.

Holds and moves count frames, so keep times in seconds with a `secs()` like
the one above and the GIF keeps its pace if you change the frame rate.

After adding a shot, run `npm run media -- --only <name> --check`, open the
PNG or GIF and look at it (for a GIF, step through the frames, or keep them
with `MEDIA_KEEP_FRAMES=1`). If the check says DIFFERS, something on screen is moving
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
- **"no ffmpeg found"**: `npm install` didn't get the binary. See
  [ffmpeg](#ffmpeg).
- **"film() needs a page staged with reactOnClock"**: the shot films but
  isn't marked `gif: true`.
- **A GIF shot sits on the boot screen, or a click does nothing**: React only
  renders when the page clock moves on GIF pages. Use `boot`, `warm` or
  `pump` from `lib/boot.mjs` instead of waiting on the page directly.
- **"still waiting after 15 s on: 1 request(s) in flight (...)"**: something
  the page asked for never finished, so the frame couldn't be taken at a
  settled moment. The message gives the kind of request (script, image,
  fetch); find what starts it and either let it finish or block it in
  `lib/stage.mjs`.
- **"Target crashed"**: the browser tab died. The one case found so far was
  waiting for lazy images below the screen to decode, which the recorder now
  skips. Run with `MEDIA_KEEP_FRAMES=1` to see the last frame it got to.
- **"the page kept changing across 8 screenshots of one frame"**: something
  is moving that isn't on the page clock or a CSS animation, like a video or
  a canvas driven by real time. Freeze it from outside or leave it out of
  the shot.
- **A GIF is identical within one `--check` run but different the next
  time**: something real-time was caught at a different point, most often a
  CSS transition that started before `film()`. Finish it before filming (see
  `savers.mjs`). Comparing two separate runs (`sha1sum` before and after)
  catches this when `--check` doesn't.

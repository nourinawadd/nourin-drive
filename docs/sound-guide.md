# Interface sound effects

The bleeps the desktop makes when you open a window, launch a drive or hit a
requester. Completely separate from the Music Player — see `music-guide.md` for
that. Muting one never touches the other.

## The short version

The sounds are **generated**, not recorded. `client/scripts/gen-sfx.mjs`
synthesises eleven WAV files into `client/public/sfx/` from oscillators and
noise bursts. It runs as part of `npm run gen` (so on every `predev` / `prebuild`), or
on its own with `npm run sfx` from `client/`.

```
client/scripts/gen-sfx.mjs   the synthesiser - edit here to change a sound
client/public/sfx/*.wav      its output - committed, safe to overwrite by hand
client/src/lib/sfx.ts        the playback engine
client/src/context/sfxStore.ts   on/off + level, persisted
client/src/components/os/SfxEngine.tsx   mounts it, wires the window sounds
client/src/lib/useSeek.ts        the hook loading screens call
```

## The eleven sounds

| File | When it fires | Wired in |
| --- | --- | --- |
| `boot.wav` | Clicking through the Kickstart screen | `BootScreen.tsx` |
| `open.wav` | A window appears | `SfxEngine.tsx` |
| `close.wav` | A window goes away | `SfxEngine.tsx` |
| `minimize.wav` | A window drops to the taskbar | `SfxEngine.tsx` |
| `restore.wav` | It comes back | `SfxEngine.tsx` |
| `launch.wav` | Double-clicking a drive icon (a floppy seek) | `DriveColumn.tsx` |
| `select.wav` | Single-clicking a drive icon | `DriveColumn.tsx` |
| `menu.wav` | Picking a menu bar entry | `TopMenubar.tsx` |
| `error.wav` | A site refuses to embed | `Browser.tsx` |
| `seek.wav` | Repeating, while something is loading | `useSeek.ts` |
| `ready.wav` | That load finished | `sfx.ts` |

Window sounds come from a single subscription to `useWindowStore` that diffs the
window list, rather than a call in each of `WindowFrame`, `Taskbar` and `Dock`.
Add a new way to open a window and it makes the right noise for free.

Maximise is deliberately silent — it fires often enough while reading that a
sound on it grates.

## Loading

`seek` and `ready` are not one-shots you fire from a click. They come from
`startSeek()` in `lib/sfx.ts`, or more usually from the `useSeek(active)` hook
that wraps it:

```tsx
useSeek(loading && !error);       // PdfPane, while a book opens
useSeek(!!src && !ready, 30_000); // GamePlayer, while a build downloads
```

While at least one caller is active, `seek` replays every 400–520 ms. The gap is
jittered so it reads as a drive working rather than a sample on a metronome.

- **It is refcounted.** Opening a PDF starts two overlapping loads — the pdf.js
  chunk and the document itself — and they share one run of chatter instead of
  cutting each other off. `ready` plays once, when the last of them finishes.
- **It gives up.** After 12 seconds (30 for a game build, which is genuinely
  that slow) the chatter stops on its own. A load that never finishes goes quiet
  rather than grinding forever, and `ready` is suppressed, because a drive that
  never found anything shouldn't claim it did.

Where it is deliberately *not* wired: the library grid's PDF thumbnails. A dozen
cards render at once when you scroll, and that is a noise, not a sound.

Game builds are the awkward case. The iframe's own `onLoad` fires when the
engine's `index.html` lands, which for AstraCipher is about 140 MB early. The
shells in `public/games/*/index.html` post a `game:ready` message when the wasm
and pack are actually in, next to the `game:exit` hook that was already there.
**Re-exporting a game from Godot or Unity overwrites both** — put them back, or
the chatter just times out.

## Changing how something sounds

Edit its entry in the `SOUNDS` map in `gen-sfx.mjs` and run `npm run sfx`. Each
one is a few lines of `tone()` and `noise()` mixed into a buffer:

```js
open: {
  seed: 22,
  peak: 0.7,
  render() {
    const out = buffer(0.12);
    mix(out, tone({ dur: 0.09, from: 430, to: 940, curve: 2.6 }), 0.006, 0.55);
    mix(out, noise({ dur: 0.02, cutoff: 0.6, curve: 5 }), 0, 0.22);
    return out;
  },
},
```

- `tone({ dur, from, to, wave, attack, curve })` — `from`/`to` sweep the pitch
  exponentially; `wave` is `sine` / `square` / `saw` / `triangle`; `curve` is how
  fast it decays (higher is snappier).
- `noise({ dur, cutoff, attack, curve })` — white noise through a one-pole
  lowpass. Low `cutoff` gives a dull thud, high gives a hiss.
- `mix(out, part, atSeconds, gain)` — lay a part into the buffer.
- `peak` is the final level relative to the other sounds. It is applied after
  normalising, so it is the only knob that matters for "this one is too loud".

Output is 8-bit 11 kHz mono, which is what Paula actually did and why these have
the right amount of grit. All eleven come to about 31 KB.

`seed` feeds a deterministic PRNG, so the noise is identical every run and the
script rewrites nothing when the definitions haven't changed. If you change a
seed you get a different noise burst, which is occasionally the easiest way to
get a `launch` seek you like better.

## Using real samples instead

Nothing in the engine cares where the files came from. Drop your own
`open.wav` (or `.mp3`, if you also change the extension in `lib/sfx.ts`) into
`client/public/sfx/` and it will be used as-is — but note that `npm run gen`
regenerates any file whose bytes don't match the synthesiser's output, so remove
the sound from the `SOUNDS` map first, or it will be overwritten on the next
build.

## Playback rules

`lib/sfx.ts` is a small Web Audio wrapper. Things it does on purpose:

- **Nothing happens until the visitor interacts.** Browsers refuse to start an
  `AudioContext` without a gesture. `SfxEngine` waits for the first pointerdown
  or keypress, then creates the context and fetches all eleven files. The click
  that dismisses the boot screen is usually that gesture, which is why the boot
  chime is on the click and not on a timer — if the screen auto-dismisses after
  2.2 s untouched, there is no gesture yet and no sound to play.
- **Four voices, like Paula.** A fifth overlapping sound is dropped rather than
  queued.
- **The same sound can't retrigger within 60 ms.** "Close All" on six windows is
  one close, not six on top of each other.
- **Late sounds are dropped.** If a sound is queued before the files finish
  decoding and more than 700 ms passes, it is discarded — a blip arriving a
  second after the click is worse than silence.

## The off switch

A speaker glyph in the menu bar, left of the memory readout. It writes
`{ enabled, volume }` to `wb:sfx` in localStorage, so the choice survives a
reload. Default is on at 30 %.

Volume has a store action (`setVolume`) but no UI yet — the menu bar toggle is
on/off only. If you want a slider, `useSfxStore` is where to hang it.

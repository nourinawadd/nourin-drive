# Music files — just drop them here

Put your audio files (`.mp3`, `.m4a`, `.ogg`, `.wav`, `.flac`, ...) in this
folder. That's it — the Music Player picks them up automatically. No code to
edit.

How it works: a script (`client/scripts/gen-tracks.mjs`) scans this folder and
rebuilds the track list whenever you run `npm run dev` or `npm run build`. While
`npm run dev` is running it also watches this folder, so a file you drop in
appears without any second command. If you generated the list some other way,
`npm run tracks` (in `client/`) refreshes it.

## Playlists = folders

**A folder in here is a playlist.** Make one, drag songs into it, done:

```
music/
  01 - Late Night/          → playlist "Late Night", shown first
      Daft Punk - Veridis Quo.mp3
      Air - Alone in Kyoto.mp3
  Covers I Like/            → playlist "Covers I Like"
      Jeff Buckley - Hallelujah.mp3
  Get Lucky.mp3             → no folder, so it lands in "Singles"
```

- The `01 - ` prefix is **optional** and only sets the order. It's stripped from
  the name you see, so `01 - Late Night` displays as "Late Night".
- Folders without a number come after the numbered ones, alphabetically.
  **Singles** is always last.
- A song lives in exactly one playlist — the folder it's in.
- Loose files at the top level are fine. If you never make a folder, everything
  is in "Singles" and the player works exactly as it always has.
- `cover.jpg` (or `folder`/`thumbnail`, `.png`/`.webp`) inside a playlist folder
  becomes that playlist's art. Without one, the first few track covers are
  stacked instead.

> `covers/` is **reserved** — that's where extracted album art is written, and
> it's wiped and rebuilt on every run. Don't name a playlist `covers`.

## Naming = nicer titles (optional)

Embedded tags win; the filename is the fallback:

| Filename                         | Artist          | Title        |
| -------------------------------- | --------------- | ------------ |
| `Daft Punk - Get Lucky.mp3`      | Daft Punk       | Get Lucky    |
| `01 - Daft Punk - Get Lucky.mp3` | Daft Punk       | Get Lucky    |
| `Get Lucky.mp3`                  | Unknown Artist  | Get Lucky    |

The leading number (`01 - `) sets the play order within its playlist; it's
stripped from the title.

Album, year, track number and duration come from the file's tags only — there's
no filename convention for those. Duration is what fills the **Time** column, so
a file with no tags shows `--:--` there.

## Cover art (optional)

Drop an image with the same name next to the audio file and it's used as the
cover, e.g. `Daft Punk - Get Lucky.mp3` + `Daft Punk - Get Lucky.jpg`
(`.png` / `.webp` / `.gif` also work). Otherwise the art embedded in the file is
extracted to `covers/` automatically. No art at all = a coloured placeholder.

Use audio you own or are licensed to use.

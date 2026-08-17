# Adding music (and organising it into playlists)

The companion to `library-guide.md`, for the Music Player instead of the Ereader.

## The short version

Drop audio into `client/public/music/`. To make a playlist, make a folder and
put songs in it. That's the whole system.

```
client/public/music/
  01 - Late Night/
      Daft Punk - Veridis Quo.mp3
      Air - Alone in Kyoto.mp3
  Covers I Like/
      Jeff Buckley - Hallelujah.mp3
  Get Lucky.mp3
```

gives you three playlists: **Late Night** (2), **Covers I Like** (1), and
**Singles** (1, where anything loose ends up).

While `npm run dev` is running the folder is watched, so a song you drag in shows
up without a second command. Otherwise `npm run tracks` from `client/`.

## The folder name is the playlist

Same idea as the Ereader's shelves. Make a new folder and you have a new
playlist - no code change, nothing to register.

| Folder | Playlist | Position |
| --- | --- | --- |
| `01 - Late Night` | Late Night | first |
| `02 - Hype` | Hype | second |
| `Covers I Like` | Covers I Like | after the numbered ones, A-Z |
| *(no folder)* | Singles | always last |

The `NN - ` prefix is optional and is stripped from the displayed name. It only
sets order, exactly like the `04 - ` on a track filename sets play order.

Two things worth knowing:

- **A song lives in exactly one playlist** - whichever folder it's in. This is
  the trade-off of using folders instead of a playlist file. If you want the same
  song in two playlists, you need two copies of the file.
- **`covers/` is reserved.** It's where embedded album art gets extracted, and
  it's deleted and rebuilt on every run. Don't name a playlist `covers` (and note
  Windows won't distinguish `Covers` from `covers`).

Nesting deeper than one level is allowed but the *top* folder still decides the
playlist - `music/Late Night/2019/song.mp3` is still in "Late Night".

## Playlist cover art

Put `cover.jpg` in the folder. `folder`, `thumbnail` and `thumb` also work, as do
`.png` / `.webp` / `.gif`. Without one, the Playlists view stacks the first three
track covers instead.

## Where each field comes from

| Field | Source |
| --- | --- |
| Title, Artist | embedded tags first, then the filename |
| Album, Year, Track no. | embedded tags **only** |
| Duration (the Time column) | embedded tags only |
| Cover | sidecar image → embedded art → coloured placeholder |
| Playlist | the folder |

### Filename tricks

| Filename | Artist | Title |
| --- | --- | --- |
| `Daft Punk - Get Lucky.mp3` | Daft Punk | Get Lucky |
| `01 - Daft Punk - Get Lucky.mp3` | Daft Punk | Get Lucky |
| `Get Lucky.mp3` | Unknown Artist | Get Lucky |

Split is on the **first** `" - "`, so `Simon - Garfunkel - The Boxer.mp3` gives
artist "Simon" and title "Garfunkel - The Boxer". Rename it or fix the tags.

## The player

- Opens in **grid** view. `▦ Grid` / `▤ List` in the toolbar switches, and the
  choice is remembered per window (right-click works too).
- **List** view sorts by any column - click a header, click again to reverse.
- **Playlists** in the toolbar is the picker; the chips under it filter in place.
- Search covers title, artist, album and playlist name.
- Keyboard: `space` play/pause, `←`/`→` seek 5s, `↑`/`↓` move, `Enter` play,
  `N`/`P` next/prev, `S` shuffle, `R` repeat.
- Volume, shuffle, repeat and the last track are remembered between visits. The
  last track is *cued*, never auto-played.
- **Playback is not tied to the window.** Minimize it, bury it, close it - the
  music keeps going, because the audio lives on the desktop rather than inside
  the window. Reopen from the dock to get back to it.
- Media keys and headphone buttons work, and the OS media popup shows the cover.

## When it doesn't work

| Symptom | Cause |
| --- | --- |
| New song doesn't appear | Dev server not running, or you generated with `npm run build` earlier. Run `npm run tracks`. |
| Folder ignored, songs in "Singles" | The folder is named `covers` (reserved), or starts with a `.` |
| Playlists all in the wrong order | Only some folders are numbered. Numbered ones always come first. |
| **Time** shows `--:--` | The file has no duration tag. Re-tag it, or ignore it. |
| Year looks wrong / missing | A bare `1970` with no date frame is treated as "no year" - it's the epoch placeholder plenty of taggers write. See `plausibleYear()` in `gen-tracks.mjs`. |
| Album shows the song title | That's what the file's tags say. Fix the tags. |
| Cover is a coloured square | No sidecar image and no embedded art. |
| Two songs collapse into one | Identical artist + title generate the same id; the second gets a numeric suffix, so this shouldn't happen - if it does, check for duplicate files. |

## Quick reference

```
client/public/music/<Playlist>/<Artist> - <Title>.mp3   a song in a playlist
client/public/music/<Artist> - <Title>.mp3              a song in "Singles"
client/public/music/<Playlist>/cover.jpg                playlist art
client/public/music/<Artist> - <Title>.jpg              track art (overrides tags)

npm run tracks          regenerate now
npm run music:watch     regenerate on every change (included in npm run dev)
```

Generated into `client/src/data/tracks.generated.ts`; the type and helpers live
in `client/src/data/tracks.ts`. Never edit the generated file.

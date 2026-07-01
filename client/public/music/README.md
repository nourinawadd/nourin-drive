# Music files — just drop them here

Put your audio files (`.mp3`, `.m4a`, `.ogg`, `.wav`, `.flac`, ...) in this
folder. That's it — the Music Player picks them up automatically. No code to
edit.

How it works: a script (`client/scripts/gen-tracks.mjs`) scans this folder and
rebuilds the playlist whenever you run `npm run dev` or `npm run build`. If the
dev server is already running and you add a file, run `npm run tracks` (in the
`client/` folder) to refresh, then reload the page.

## Naming = nicer titles (optional)

The player reads the title and artist from the filename:

| Filename                         | Artist          | Title        |
| -------------------------------- | --------------- | ------------ |
| `Daft Punk - Get Lucky.mp3`      | Daft Punk       | Get Lucky    |
| `01 - Daft Punk - Get Lucky.mp3` | Daft Punk       | Get Lucky    |
| `Get Lucky.mp3`                  | Unknown Artist  | Get Lucky    |

The leading number (`01 - `) just sets the play order; it's stripped from the
title.

## Cover art (optional)

Drop an image with the same name next to the audio file and it's used as the
cover, e.g. `Daft Punk - Get Lucky.mp3` + `Daft Punk - Get Lucky.jpg`
(`.png` / `.webp` / `.gif` also work). No image = a coloured placeholder.

Use audio you own or are licensed to use.

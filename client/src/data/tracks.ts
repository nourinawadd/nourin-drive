// Music for the Music Player app.
//
// You don't edit this list by hand. Drop audio files into client/public/music/
// and the list is generated automatically (see scripts/gen-tracks.mjs, which
// runs on `npm run dev` / `npm run build`, or run `npm run tracks` to refresh
// without restarting). While `npm run dev` is up, a watcher regenerates on
// every drop, so a song you drag in appears without a second command.
//
// A FOLDER IS A PLAYLIST - the same idea as the Ereader's shelves:
//   public/music/01 - Late Night/Song.mp3   →  playlist "Late Night", pinned 1st
//   public/music/Covers Night/Song.mp3      →  playlist "Covers Night"
//   public/music/loose-track.mp3            →  playlist "Singles"
// The "NN - " prefix is optional and only sets the order. `covers` is reserved
// at the top level: it's where extracted album art is written.
//
// Filename convention for nice titles (all optional, embedded tags win):
//   "Artist - Title.mp3"   →  artist "Artist", title "Title"
//   "01 - Artist - Title.mp3" → same, the leading number sets play order
//   "Title.mp3"            →  artist "Unknown Artist", title "Title"

import { GENERATED_PLAYLISTS, GENERATED_TRACKS } from "./tracks.generated";

export type Track = {
  id: string;
  title: string;
  artist: string;
  src: string;       // public path, e.g. "/music/Late Night/track.mp3"
  art?: string;      // optional cover image, public path
  playlist: string;  // folder name; "Singles" for files loose at the top level
  album?: string;
  year?: number;
  trackNo?: number;
  duration?: number; // whole seconds, read from the file's tags at build time
};

export type Playlist = {
  name: string;
  cover?: string;    // cover.jpg in the folder; otherwise fall back to track art
  count: number;
};

export const TRACKS: Track[] = GENERATED_TRACKS;

/** Playlists in the generator's order: numbered, then A-Z, then Singles last. */
export const PLAYLISTS: Playlist[] = GENERATED_PLAYLISTS;

/** The chip that means "don't filter". Mirrors ALL_SHELVES in the Ereader. */
export const ALL_TRACKS = "All Tracks";

export function trackById(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}

/** Tracks in one playlist, or everything for ALL_TRACKS. Generator order. */
export function tracksIn(playlist: string): Track[] {
  if (playlist === ALL_TRACKS) return TRACKS;
  return TRACKS.filter((t) => t.playlist === playlist);
}

/** Case-insensitive match across title, artist, album and playlist. */
export function searchTracks(tracks: Track[], query: string): Track[] {
  const q = query.trim().toLowerCase();
  if (!q) return tracks;
  return tracks.filter((t) =>
    [t.title, t.artist, t.album, t.playlist]
      .filter(Boolean)
      .some((field) => (field as string).toLowerCase().includes(q)),
  );
}

/**
 * Art to represent a playlist: its own cover if it has one, otherwise the first
 * few track covers to stack - the same treatment the Ereader gives a shelf.
 */
export function playlistArt(playlist: string, max = 3): string[] {
  const own = PLAYLISTS.find((p) => p.name === playlist)?.cover;
  if (own) return [own];
  const arts: string[] = [];
  for (const t of tracksIn(playlist)) {
    if (t.art && !arts.includes(t.art)) arts.push(t.art);
    if (arts.length === max) break;
  }
  return arts;
}

/** Seconds → "m:ss". Shared by the track list, the seek bar and the queue. */
export function formatDuration(sec: number | undefined): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

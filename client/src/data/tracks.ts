// Playlist for the Music Player app.
//
// You don't edit this list by hand. Drop audio files into client/public/music/
// and the list is generated automatically (see scripts/gen-tracks.mjs, which
// runs on `npm run dev` / `npm run build`, or run `npm run tracks` to refresh
// without restarting).
//
// Filename convention for nice titles (all optional):
//   "Artist - Title.mp3"   →  artist "Artist", title "Title"
//   "01 - Artist - Title.mp3" → same, the leading number sets play order
//   "Title.mp3"            →  artist "Unknown Artist", title "Title"

import { GENERATED_TRACKS } from "./tracks.generated";

export type Track = {
  id: string;
  title: string;
  artist: string;
  src: string;   // public path, e.g. "/music/track.mp3"
  art?: string;  // optional cover image, public path
};

export const TRACKS: Track[] = GENERATED_TRACKS;

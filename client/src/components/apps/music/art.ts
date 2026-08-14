import type { Track } from "@/data/tracks";

// Stable gradient per track so placeholder covers stay consistent between the
// row, the grid tile and the now-playing bar (mirrors the Gallery / Games
// placeholder convention). Keyed off the track id rather than its position in
// the list, which changes the moment you filter, sort or pick a playlist.
const GRADIENTS = [
  "linear-gradient(135deg, #ff8800, #cc3333)",
  "linear-gradient(135deg, #3377aa, #22aa77)",
  "linear-gradient(135deg, #8866cc, #3377aa)",
  "linear-gradient(135deg, #ee8800, #8866cc)",
  "linear-gradient(135deg, #555555, #22aa77)",
  "linear-gradient(135deg, #cc3333, #ee8800)",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const gradFor = (key: string) => GRADIENTS[hash(key) % GRADIENTS.length];

/** Cover art if the track has one, otherwise a stable gradient placeholder. */
export function cover(track: Track | null): React.CSSProperties {
  if (track?.art) {
    return {
      backgroundImage: `url("${track.art}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { background: gradFor(track?.id ?? "none") };
}

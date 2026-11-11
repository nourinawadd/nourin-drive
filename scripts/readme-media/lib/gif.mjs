// PNG frames to a GIF, tuned for pixel art.
//
// Two passes. The first builds one 256-colour palette for the whole clip, and
// `stats_mode=diff` builds it from what changes between frames, so the colours
// of the moving parts aren't crowded out by a big static backdrop. The second
// maps every frame onto that palette with no dithering, because dithering a
// flat pixel-art fill sprays noise over it (and that noise changes every frame,
// which makes the file bigger too). `diff_mode=rectangle` only re-encodes the
// area that changed. There's no scale filter anywhere: frames go in at the
// size they were captured.
//
// The frame rate should be one GIF can hold exactly. GIF delays are whole
// hundredths of a second, so 12.5 fps (8/100 s) and 10 fps (10/100 s) are
// exact, and 15 fps would alternate 6 and 7.

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ffmpeg } from "./ffmpeg.mjs";

export const FRAME_PATTERN = "frame-%05d.png";
export const frameName = (i) => `frame-${String(i).padStart(5, "0")}.png`;

export async function encodeGif(frameDir, out, { fps }) {
  const frames = readdirSync(frameDir).filter((f) => /^frame-\d{5}\.png$/.test(f)).length;
  if (!frames) throw new Error("no frames to encode");
  const input = ["-framerate", String(fps), "-i", join(frameDir, FRAME_PATTERN)];
  const palette = join(frameDir, "palette.png");

  await ffmpeg([...input, "-vf", "palettegen=stats_mode=diff:reserve_transparent=0", palette]);
  await ffmpeg([
    ...input,
    "-i",
    palette,
    "-lavfi",
    "paletteuse=dither=none:diff_mode=rectangle",
    "-loop",
    "0",
    out,
  ]);
  return { frames, bytes: statSync(out).size };
}

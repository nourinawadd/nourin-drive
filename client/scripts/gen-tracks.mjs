// Scans client/public/music/ for audio files and (re)writes
// src/data/tracks.generated.ts with one entry per file. Runs automatically
// before `npm run dev` and `npm run build` (see predev/prebuild), so you
// never edit a track list by hand — just drop files in and they appear.
//
// Filename → metadata convention (all optional):
//   "Artist - Title.mp3"        → artist "Artist",  title "Title"
//   "01 - Artist - Title.mp3"   → same, leading track number sets the order
//   "Title.mp3"                 → artist "Unknown Artist", title "Title"
// A cover image with the same base name (.jpg/.jpeg/.png/.webp/.gif) next to
// the audio file is picked up automatically as the track art. If no sidecar
// image exists, embedded cover art is extracted from the audio file and written
// to public/music/covers/ as a real image.
//
// Embedded art is written to disk rather than inlined as a base64 data URI: a
// data URI lands in tracks.generated.ts, which is a TypeScript module the
// bundler has to parse and ship to the browser. Thirty covers inlined that way
// made this file 9.3 MB, with single lines over 600 KB — enough to wedge the
// dev compiler outright. As files they cost nothing to compile, get cached by
// the browser, and skip the ~33% base64 size penalty.

import { readdirSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname, parse } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFile } from "music-metadata";

const here = dirname(fileURLToPath(import.meta.url));
const MUSIC_DIR = join(here, "..", "public", "music");
const COVERS_DIR = join(MUSIC_DIR, "covers");
const OUT_FILE = join(here, "..", "src", "data", "tracks.generated.ts");

const AUDIO_EXT = new Set([".mp3", ".m4a", ".aac", ".ogg", ".oga", ".wav", ".flac", ".webm"]);
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

// Cover MIME → extension. Anything unrecognised is treated as JPEG, which is
// what virtually all embedded art is.
const COVER_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

if (!existsSync(MUSIC_DIR)) mkdirSync(MUSIC_DIR, { recursive: true });

// Wiped and rebuilt every run so covers for deleted tracks don't linger. The
// directory holds nothing but this script's output, so it's safe to remove.
rmSync(COVERS_DIR, { recursive: true, force: true });
mkdirSync(COVERS_DIR, { recursive: true });

const entries = readdirSync(MUSIC_DIR);
const images = new Set(entries.map((f) => f.toLowerCase()));

async function readMetadata(file) {
  try {
    const metadata = await parseFile(join(MUSIC_DIR, file), { skipCovers: false });
    const title = metadata.common.title ? String(metadata.common.title).trim() : undefined;
    const artist = metadata.common.artist
      ? Array.isArray(metadata.common.artist)
        ? String(metadata.common.artist[0]).trim()
        : String(metadata.common.artist).trim()
      : undefined;
    const picture = metadata.common.picture?.[0];
    return { title, artist, picture: picture?.data?.length ? picture : undefined };
  } catch (error) {
    console.warn(`[gen-tracks] could not read embedded metadata for ${file}: ${error.message}`);
    return {};
  }
}

// Writes embedded art to public/music/covers/<id>.<ext> and returns its public
// path, or undefined if the write fails (a missing cover is cosmetic — never a
// reason to fail the whole generation step).
function writeCover(id, picture) {
  const ext = COVER_EXT[String(picture.format || "").toLowerCase()] ?? ".jpg";
  const filename = `${id}${ext}`;
  try {
    writeFileSync(join(COVERS_DIR, filename), Buffer.from(picture.data));
    return `/music/covers/${encodeURIComponent(filename)}`;
  } catch (error) {
    console.warn(`[gen-tracks] could not write cover for ${id}: ${error.message}`);
    return undefined;
  }
}

function findArt(file, id, picture) {
  const base = parse(file).name;

  for (const ext of IMAGE_EXT) {
    const candidate = `${base}${ext}`;
    const match = entries.find((f) => f.toLowerCase() === candidate.toLowerCase());
    if (match) return `/music/${encodeURIComponent(match)}`;
  }

  return picture ? writeCover(id, picture) : undefined;
}

function parseName(filename) {
  let name = parse(filename).name; // strip extension
  let order = null;

  // Optional leading track number: "01 - ", "01. ", "01 "
  const numMatch = name.match(/^\s*(\d+)\s*[-.]?\s+(.*)$/);
  if (numMatch && numMatch[2]) {
    order = parseInt(numMatch[1], 10);
    name = numMatch[2];
  }

  // "Artist - Title" (split on the first " - ")
  const dash = name.indexOf(" - ");
  let artist = "Unknown Artist";
  let title = name.trim();
  if (dash !== -1) {
    artist = name.slice(0, dash).trim();
    title = name.slice(dash + 3).trim();
  }
  return { artist, title, order };
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "track";
}

const audioFiles = entries
  .filter((f) => AUDIO_EXT.has(parse(f).ext.toLowerCase()))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

const seen = new Set();
const tracks = [];
for (const [i, file] of audioFiles.entries()) {
  const metadata = await readMetadata(file);
  const { artist: embeddedArtist, title: embeddedTitle, picture } = metadata;
  const { artist, title, order } = parseName(file);
  const finalArtist = embeddedArtist || artist || "Unknown Artist";
  const finalTitle = embeddedTitle || title;
  let id = slug(`${finalArtist}-${finalTitle}`);
  if (seen.has(id)) id = `${id}-${i}`;
  seen.add(id);
  const art = findArt(file, id, picture);
  tracks.push({ id, title: finalTitle, artist: finalArtist, src: `/music/${encodeURIComponent(file)}`, art, order });
}

// Order by leading track number when present, otherwise keep the sorted order.
tracks.sort((a, b) => {
  if (a.order != null && b.order != null) return a.order - b.order;
  if (a.order != null) return -1;
  if (b.order != null) return 1;
  return 0;
});

const body = tracks
  .map((t) => {
    const fields = [
      `id: ${JSON.stringify(t.id)}`,
      `title: ${JSON.stringify(t.title)}`,
      `artist: ${JSON.stringify(t.artist)}`,
      `src: ${JSON.stringify(t.src)}`,
    ];
    if (t.art) fields.push(`art: ${JSON.stringify(t.art)}`);
    return `  { ${fields.join(", ")} },`;
  })
  .join("\n");

const out = `// AUTO-GENERATED by scripts/gen-tracks.mjs — do not edit by hand.
// Add/remove songs by dropping files in client/public/music/, then this file
// is rewritten on the next \`npm run dev\` / \`npm run build\` (or \`npm run tracks\`).
import type { Track } from "./tracks";

export const GENERATED_TRACKS: Track[] = [
${body}
];
`;

writeFileSync(OUT_FILE, out, "utf8");
const covers = tracks.filter((t) => t.art?.startsWith("/music/covers/")).length;
console.log(
  `[gen-tracks] wrote ${tracks.length} track(s) to tracks.generated.ts` +
    (covers ? ` and extracted ${covers} cover(s) to public/music/covers/` : ""),
);

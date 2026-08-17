// Scans client/public/music/ for audio files and (re)writes
// src/data/tracks.generated.ts with one entry per file. Runs automatically
// before `npm run dev` and `npm run build` (see predev/prebuild), so you
// never edit a track list by hand - just drop files in and they appear.
//
// A FOLDER IS A PLAYLIST. Same convention the Ereader uses for shelves:
//
//   public/music/01 - Late Night/Artist - Song.mp3   → playlist "Late Night"
//   public/music/Covers Night/Artist - Song.mp3      → playlist "Covers Night"
//   public/music/loose-track.mp3                     → playlist "Singles"
//
// An optional "NN - " prefix on the folder pins the playlist's position and is
// stripped from the displayed name; unnumbered folders follow alphabetically and
// "Singles" always sits last. A cover.jpg / thumbnail.png in the folder becomes
// the playlist's art. Only the first level is a playlist - nest deeper and the
// top folder still wins, which keeps "playlist" a flat, obvious idea.
//
// `covers` is a RESERVED folder name at the top level: it is this script's own
// output directory (see below), so it can't also be a playlist. Windows folder
// names are case-insensitive, so "Covers" is reserved too.
//
// Filename → metadata convention (all optional):
//   "Artist - Title.mp3"        → artist "Artist",  title "Title"
//   "01 - Artist - Title.mp3"   → same, leading track number sets the order
//   "Title.mp3"                 → artist "Unknown Artist", title "Title"
// Embedded tags beat the filename for title/artist, and album, year, track
// number and duration come from the tags alone.
//
// A cover image with the same base name (.jpg/.jpeg/.png/.webp/.gif) next to
// the audio file is picked up automatically as the track art. If no sidecar
// image exists, embedded cover art is extracted from the audio file and written
// to public/music/covers/ as a real image.
//
// Embedded art is written to disk rather than inlined as a base64 data URI: a
// data URI lands in tracks.generated.ts, which is a TypeScript module the
// bundler has to parse and ship to the browser. Thirty covers inlined that way
// made this file 9.3 MB, with single lines over 600 KB - enough to wedge the
// dev compiler outright. As files they cost nothing to compile, get cached by
// the browser, and skip the ~33% base64 size penalty.

import {
  readdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  watch,
} from "node:fs";
import { join, dirname, parse, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseFile } from "music-metadata";

const here = dirname(fileURLToPath(import.meta.url));
const MUSIC_DIR = join(here, "..", "public", "music");
const COVERS_DIR = join(MUSIC_DIR, "covers");
const OUT_FILE = join(here, "..", "src", "data", "tracks.generated.ts");

/** Top-level folder this script owns. Never treated as a playlist. */
const COVERS_FOLDER = "covers";
/** Where loose files at the top level land. Always sorted last. */
const SINGLES = "Singles";

const AUDIO_EXT = new Set([".mp3", ".m4a", ".aac", ".ogg", ".oga", ".wav", ".flac", ".webm"]);
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const PLAYLIST_COVER_NAMES = ["cover", "folder", "thumbnail", "thumb"];

// Cover MIME → extension. Anything unrecognised is treated as JPEG, which is
// what virtually all embedded art is.
const COVER_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Every file under public/music/, as path segments relative to it. Same shape as
 * gen-gallery's walk, minus the top-level covers/ directory this script writes.
 */
function walk(dir, base = []) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    // Only at the top level: a nested folder called "covers" is a real folder.
    if (base.length === 0 && name.toLowerCase() === COVERS_FOLDER) continue;
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...walk(abs, [...base, name]));
    else out.push([...base, name]);
  }
  return out;
}

/** "01 - Late Night" → { name: "Late Night", order: 1 }. */
function parseFolderName(raw) {
  const match = raw.match(/^\s*(\d+)\s*[-.]?\s+(.*)$/);
  if (match && match[2]) return { name: match[2].trim(), order: parseInt(match[1], 10) };
  return { name: raw.trim(), order: null };
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

const first = (value) =>
  value == null ? undefined : String(Array.isArray(value) ? value[0] : value).trim() || undefined;

/**
 * Plenty of taggers write the Unix epoch as a placeholder, so a bare year of
 * 1970 with no date frame to corroborate it is almost always "no year" rather
 * than a 1970 record. Several files in public/music/ are exactly that. If you
 * ever add genuine 1970 music, give it a full `date` tag (or delete this).
 */
function plausibleYear(common) {
  const fromDate = common.date ? parseInt(String(common.date).slice(0, 4), 10) : undefined;
  const year = common.year ?? fromDate;
  if (year == null || !Number.isFinite(year)) return undefined;
  if (year === 1970 && fromDate == null) return undefined;
  return year;
}

async function readMetadata(relPath) {
  try {
    const metadata = await parseFile(join(MUSIC_DIR, relPath), { skipCovers: false });
    const { common, format } = metadata;
    const picture = common.picture?.[0];
    return {
      title: first(common.title),
      artist: first(common.artist),
      album: first(common.album),
      year: plausibleYear(common),
      trackNo: common.track?.no ?? undefined,
      // Whole seconds - the player only ever renders m:ss, and the extra
      // decimals would be noise in every line of the generated file.
      duration: Number.isFinite(format?.duration) ? Math.round(format.duration) : undefined,
      picture: picture?.data?.length ? picture : undefined,
    };
  } catch (error) {
    console.warn(`[gen-tracks] could not read embedded metadata for ${relPath}: ${error.message}`);
    return {};
  }
}

// Writes embedded art to public/music/covers/<id>.<ext> and returns its public
// path, or undefined if the write fails (a missing cover is cosmetic - never a
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

const publicPath = (parts) => `/music/${parts.map(encodeURIComponent).join("/")}`;

/**
 * A sidecar image beside the audio file wins; otherwise the embedded art is
 * extracted. `siblings` is the directory listing the file actually lives in, so
 * a sidecar inside a playlist folder is found the same as one at the top.
 */
function findArt(parts, siblings, id, picture) {
  const base = parse(parts[parts.length - 1]).name;
  const dir = parts.slice(0, -1);

  for (const ext of IMAGE_EXT) {
    const candidate = `${base}${ext}`.toLowerCase();
    const match = siblings.find((f) => f.toLowerCase() === candidate);
    if (match) return publicPath([...dir, match]);
  }

  return picture ? writeCover(id, picture) : undefined;
}

/** cover.jpg / folder.png / … in a playlist folder, as a public path. */
function findPlaylistCover(folder) {
  const abs = join(MUSIC_DIR, folder);
  if (!existsSync(abs)) return undefined;
  const files = readdirSync(abs).filter((f) => !f.startsWith("."));
  for (const base of PLAYLIST_COVER_NAMES) {
    for (const ext of IMAGE_EXT) {
      const hit = files.find((f) => f.toLowerCase() === base + ext);
      if (hit) return publicPath([folder, hit]);
    }
  }
  return undefined;
}

/** Numbered playlists in order, then unnumbered A-Z, then Singles. */
function comparePlaylists(a, b) {
  if (a.name === SINGLES) return b.name === SINGLES ? 0 : 1;
  if (b.name === SINGLES) return -1;
  if (a.order != null && b.order != null) return a.order - b.order;
  if (a.order != null) return -1;
  if (b.order != null) return 1;
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

/** Leading-number tracks first in their number order, then the alphabetical pass. */
function compareTracks(a, b) {
  if (a.order != null && b.order != null) return a.order - b.order;
  if (a.order != null) return -1;
  if (b.order != null) return 1;
  return 0;
}

function field(name, value) {
  return value == null || value === "" ? null : `${name}: ${JSON.stringify(value)}`;
}

export async function generate() {
  if (!existsSync(MUSIC_DIR)) mkdirSync(MUSIC_DIR, { recursive: true });

  // Wiped and rebuilt every run so covers for deleted tracks don't linger. The
  // directory holds nothing but this script's output, so it's safe to remove.
  rmSync(COVERS_DIR, { recursive: true, force: true });
  mkdirSync(COVERS_DIR, { recursive: true });

  const audioFiles = walk(MUSIC_DIR)
    .filter((parts) => AUDIO_EXT.has(parse(parts[parts.length - 1]).ext.toLowerCase()))
    .sort((a, b) =>
      a.join(sep).localeCompare(b.join(sep), undefined, { numeric: true, sensitivity: "base" }),
    );

  // One listing per directory, reused for every sidecar lookup in it.
  const listings = new Map();
  const siblingsOf = (parts) => {
    const dir = parts.slice(0, -1).join(sep);
    if (!listings.has(dir)) listings.set(dir, readdirSync(join(MUSIC_DIR, dir)));
    return listings.get(dir);
  };

  const seen = new Set();
  const tracks = [];
  const playlists = new Map();

  for (const [i, parts] of audioFiles.entries()) {
    const relPath = parts.join(sep);
    const folder = parts.length > 1 ? parts[0] : null;
    const { name: playlist, order: playlistOrder } = folder
      ? parseFolderName(folder)
      : { name: SINGLES, order: null };

    if (!playlists.has(playlist)) {
      playlists.set(playlist, {
        name: playlist,
        order: playlistOrder,
        cover: folder ? findPlaylistCover(folder) : undefined,
      });
    }

    const meta = await readMetadata(relPath);
    const fromName = parseName(parts[parts.length - 1]);
    const finalArtist = meta.artist || fromName.artist || "Unknown Artist";
    const finalTitle = meta.title || fromName.title;

    let id = slug(`${finalArtist}-${finalTitle}`);
    if (seen.has(id)) id = `${id}-${i}`;
    seen.add(id);

    tracks.push({
      id,
      title: finalTitle,
      artist: finalArtist,
      src: publicPath(parts),
      art: findArt(parts, siblingsOf(parts), id, meta.picture),
      playlist,
      album: meta.album,
      year: meta.year,
      // A tag track number is a better order than the filename when both exist.
      trackNo: meta.trackNo ?? fromName.order ?? undefined,
      duration: meta.duration,
      order: fromName.order ?? meta.trackNo ?? null,
    });
  }

  const ordered = [...playlists.values()].sort(comparePlaylists);
  const rank = new Map(ordered.map((p, i) => [p.name, i]));

  // Grouped by playlist so the generated file reads like the player looks, and
  // so `tracksIn()` gets a contiguous slice without re-sorting.
  tracks.sort((a, b) => {
    const byPlaylist = rank.get(a.playlist) - rank.get(b.playlist);
    return byPlaylist !== 0 ? byPlaylist : compareTracks(a, b);
  });

  const trackRows = tracks
    .map((t) => {
      const fields = [
        field("id", t.id),
        field("title", t.title),
        field("artist", t.artist),
        field("src", t.src),
        field("art", t.art),
        field("playlist", t.playlist),
        field("album", t.album),
        field("year", t.year),
        field("trackNo", t.trackNo),
        field("duration", t.duration),
      ].filter(Boolean);
      return `  { ${fields.join(", ")} },`;
    })
    .join("\n");

  const playlistRows = ordered
    .map((p) => {
      const count = tracks.filter((t) => t.playlist === p.name).length;
      const fields = [field("name", p.name), field("cover", p.cover), `count: ${count}`].filter(
        Boolean,
      );
      return `  { ${fields.join(", ")} },`;
    })
    .join("\n");

  const out = `// AUTO-GENERATED by scripts/gen-tracks.mjs - do not edit by hand.
// Add/remove songs by dropping files in client/public/music/ (a folder there is
// a playlist), then this file is rewritten on the next \`npm run dev\` /
// \`npm run build\` (or \`npm run tracks\`).
import type { Playlist, Track } from "./tracks";

export const GENERATED_TRACKS: Track[] = [
${trackRows}
];

// Display order: numbered folders first, then alphabetical, then Singles.
export const GENERATED_PLAYLISTS: Playlist[] = [
${playlistRows}
];
`;

  // Skip the write when nothing actually changed. writeFileSync always bumps
  // the mtime, which would make Next recompile on every dev start and on every
  // unrelated save while watching.
  const prev = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, "utf8") : null;
  if (prev === out) return tracks.length;

  writeFileSync(OUT_FILE, out, "utf8");
  const covers = tracks.filter((t) => t.art?.startsWith("/music/covers/")).length;
  console.log(
    `[gen-tracks] wrote ${tracks.length} track(s) across ${ordered.length} playlist(s)` +
      ` to tracks.generated.ts` +
      (covers ? ` and extracted ${covers} cover(s) to public/music/covers/` : ""),
  );
  return tracks.length;
}

/**
 * Regenerate whenever anything under public/music/ changes, so dragging a song
 * into a playlist folder updates the browser without a second command. The
 * generated file lands in src/, so Next's fast refresh takes it from there.
 */
function startWatching() {
  let timer = null;
  let running = false;
  const rerun = (_event, filename) => {
    // Our own covers/ writes would otherwise retrigger the watcher forever.
    if (filename && String(filename).split(sep)[0].toLowerCase() === COVERS_FOLDER) return;
    clearTimeout(timer);
    // Editors and file copies land in bursts, and a rebuild per burst would
    // thrash the dev server.
    timer = setTimeout(async () => {
      if (running) return;
      running = true;
      try {
        await generate();
      } catch (err) {
        // A half-copied file mid-write shouldn't take the watcher down.
        console.error(`[gen-tracks] regenerate failed: ${err.message}`);
      } finally {
        running = false;
      }
    }, 250);
  };

  watch(MUSIC_DIR, { recursive: true }, rerun);
  console.log("[gen-tracks] watching public/music/ - drops and moves regenerate automatically");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  await generate();
  if (process.argv.includes("--watch")) startWatching();
}

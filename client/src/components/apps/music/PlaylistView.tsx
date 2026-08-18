"use client";

import Image from "next/image";
import { ALL_TRACKS, PLAYLISTS, TRACKS, formatDuration, playlistArt, type Track } from "@/data/tracks";
import { cover, gradFor } from "./art";

export type SortKey = "order" | "title" | "artist" | "album" | "duration";

/* ── playlist chips ─────────────────────────────────────────────────────── */

export function PlaylistChips({
  playlist, onSelect,
}: {
  playlist: string;
  onSelect: (name: string) => void;
}) {
  return (
    <div style={chipRow}>
      {[{ name: ALL_TRACKS, count: TRACKS.length }, ...PLAYLISTS].map((p) => {
        const active = p.name === playlist;
        return (
          <button
            key={p.name}
            type="button"
            onClick={() => onSelect(p.name)}
            aria-pressed={active}
            style={{ ...chip, ...(active ? chipActive : null) }}
          >
            {p.name}
            <span style={{ marginLeft: 6, opacity: 0.65 }}>{p.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── grid ───────────────────────────────────────────────────────────────── */

export function TrackGrid({
  tracks, currentId, playing, onPlay, selectedId, onSelect, empty,
}: {
  tracks: Track[];
  currentId: string | null;
  playing: boolean;
  onPlay: (t: Track) => void;
  selectedId: string | null;
  onSelect: (t: Track) => void;
  empty: React.ReactNode;
}) {
  if (!tracks.length) return <div style={emptyNote}>{empty}</div>;
  return (
    <div style={grid} role="list">
      {tracks.map((t) => {
        const isCurrent = t.id === currentId;
        return (
          <button
            key={t.id}
            type="button"
            role="listitem"
            aria-current={isCurrent ? "true" : undefined}
            tabIndex={t.id === selectedId ? 0 : -1}
            data-track={t.id}
            onFocus={() => onSelect(t)}
            onClick={() => onPlay(t)}
            style={{ ...tile, ...(isCurrent ? tileActive : null) }}
            title={`${t.title} · ${t.artist}`}
          >
            {/* Gradient sits behind the artwork, so a tile whose image is still
                being optimised shows colour rather than an empty grey square. */}
            <span style={{ ...tileArt, background: gradFor(t.id) }}>
              {t.art ? (
                // next/image resizes and caches: the source covers are full-size
                // album art, far larger than a 120px tile needs.
                <Image
                  src={t.art}
                  alt=""
                  width={140}
                  height={140}
                  sizes="140px"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : null}
              {isCurrent && <span style={tileBadge}>{playing ? "♪" : "❚❚"}</span>}
            </span>
            <span style={tileTitle}>{t.title}</span>
            <span style={tileArtist}>{t.artist}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── list ───────────────────────────────────────────────────────────────── */

const COLUMNS: { key: SortKey; label: string; width?: number; align?: "right" }[] = [
  { key: "order", label: "#", width: 34 },
  { key: "title", label: "Title" },
  { key: "artist", label: "Artist" },
  { key: "album", label: "Album" },
  { key: "duration", label: "Time", width: 52, align: "right" },
];

export function TrackList({
  tracks, currentId, playing, onPlay, selectedId, onSelect, sortKey, sortAsc, onSort, empty,
}: {
  tracks: Track[];
  currentId: string | null;
  playing: boolean;
  onPlay: (t: Track) => void;
  selectedId: string | null;
  onSelect: (t: Track) => void;
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (k: SortKey) => void;
  empty: React.ReactNode;
}) {
  return (
    <div style={listWrap}>
      <div style={headRow}>
        {COLUMNS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onSort(c.key)}
            style={{
              ...headCell,
              ...(c.width ? { width: c.width, flex: "none" } : null),
              ...(c.align === "right" ? { justifyContent: "flex-end" } : null),
            }}
            title={`Sort by ${c.label}`}
          >
            {c.label}
            {sortKey === c.key && <span style={{ marginLeft: 4 }}>{sortAsc ? "▲" : "▼"}</span>}
          </button>
        ))}
      </div>

      {!tracks.length ? (
        <div style={emptyNote}>{empty}</div>
      ) : (
        <div style={listBody} role="list">
          {tracks.map((t, i) => {
            const isCurrent = t.id === currentId;
            return (
              <button
                key={t.id}
                type="button"
                role="listitem"
                aria-current={isCurrent ? "true" : undefined}
                tabIndex={t.id === selectedId ? 0 : -1}
                data-track={t.id}
                onFocus={() => onSelect(t)}
                onClick={() => onPlay(t)}
                style={{ ...row, ...(isCurrent ? rowActive : null) }}
                title={`${t.title} · ${t.artist}`}
              >
                <span style={{ ...cell, width: 34, flex: "none", textAlign: "center" }}>
                  {isCurrent ? (playing ? "♪" : "❚❚") : i + 1}
                </span>
                <span style={{ ...cell, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ ...rowThumb, ...cover(t) }} />
                  <span style={ellipsis}>{t.title}</span>
                </span>
                <span style={cell}>{t.artist}</span>
                <span style={{ ...cell, opacity: 0.75 }}>{t.album ?? ""}</span>
                <span style={{ ...cell, width: 52, flex: "none", textAlign: "right" }}>
                  {formatDuration(t.duration)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── playlist picker ────────────────────────────────────────────────────── */

export function PlaylistPicker({ onOpen }: { onOpen: (name: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <h2 style={sectionHeading}>Playlists</h2>
      {PLAYLISTS.map((p) => {
        const arts = playlistArt(p.name);
        return (
          <button key={p.name} type="button" onClick={() => onOpen(p.name)} style={playlistRow}>
            <span style={{ display: "flex", gap: 3, flexShrink: 0 }}>
              {(arts.length ? arts : [null]).map((src, i) => (
                <span
                  key={i}
                  style={{
                    width: 34,
                    height: 34,
                    border: "1px solid var(--wb-black)",
                    ...(src
                      ? {
                          backgroundImage: `url("${src}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : { background: gradFor(p.name) }),
                  }}
                />
              ))}
            </span>
            <span style={{ minWidth: 0, textAlign: "left" }}>
              <span style={{ fontSize: 13, fontWeight: "bold", display: "block" }}>{p.name}</span>
              <span style={{ fontSize: 11, opacity: 0.75 }}>
                {p.count} track{p.count === 1 ? "" : "s"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────────────────────── */

const chipRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 4, flexShrink: 0 };
const chip: React.CSSProperties = {
  padding: "2px 10px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const chipActive: React.CSSProperties = {
  background: "var(--wb-orange)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-3), inset -1px -1px 0 var(--wb-white)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))",
  gap: 8,
  alignContent: "start",
  padding: 2,
};
const tile: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
  padding: 4,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  color: "var(--wb-black)",
  cursor: "pointer",
  textAlign: "left",
};
const tileActive: React.CSSProperties = { background: "var(--wb-orange)" };
const tileArt: React.CSSProperties = {
  position: "relative",
  display: "block",
  aspectRatio: "1 / 1",
  border: "1px solid var(--wb-black)",
  overflow: "hidden",
  lineHeight: 0,
};
const tileBadge: React.CSSProperties = {
  position: "absolute",
  right: 2,
  bottom: 2,
  padding: "0 4px",
  fontSize: 11,
  lineHeight: "14px",
  background: "var(--wb-orange)",
  border: "1px solid var(--wb-black)",
};
const ellipsis: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
};
const tileTitle: React.CSSProperties = { ...ellipsis, fontSize: 12, fontWeight: "bold", marginTop: 2 };
const tileArtist: React.CSSProperties = { ...ellipsis, fontSize: 11, opacity: 0.75 };

const listWrap: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  border: "1px solid var(--wb-black)",
  background: "var(--wb-white)",
};
const headRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "0 4px",
  background: "var(--wb-gray)",
  borderBottom: "1px solid var(--wb-black)",
  flexShrink: 0,
};
const headCell: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  padding: "3px 2px",
  background: "transparent",
  border: "none",
  borderRight: "1px solid var(--wb-gray-2)",
  fontFamily: "var(--wb-font)",
  fontSize: 11,
  fontWeight: "bold",
  color: "var(--wb-black)",
  cursor: "pointer",
};
const listBody: React.CSSProperties = { flex: 1, overflow: "auto" };
const row: React.CSSProperties = {
  display: "flex",
  gap: 8,
  width: "100%",
  alignItems: "center",
  padding: "2px 4px",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid var(--wb-gray-0)",
  cursor: "pointer",
  textAlign: "left",
  font: "inherit",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
};
const rowActive: React.CSSProperties = { background: "var(--wb-orange)" };
const cell: React.CSSProperties = { flex: 1, minWidth: 0, ...ellipsis };
const rowThumb: React.CSSProperties = {
  width: 24,
  height: 24,
  border: "1px solid var(--wb-black)",
  flexShrink: 0,
};

const sectionHeading: React.CSSProperties = { margin: "0 0 6px", fontSize: 13, fontWeight: "bold" };
const playlistRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 6,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  color: "var(--wb-black)",
  cursor: "pointer",
};
const emptyNote: React.CSSProperties = { padding: 16, fontSize: 14, lineHeight: 1.6, opacity: 0.75 };

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALL_TRACKS, TRACKS, searchTracks, tracksIn, type Track } from "@/data/tracks";
import { currentTrack, usePlayerStore } from "@/context/playerStore";
import { useWindowStore } from "@/context/windowStore";
import { APP_REGISTRY } from "@/data/appRegistry";
import { defaultSize } from "@/lib/windowBounds";
import { ContextMenu, type MenuItem } from "@/components/os/ContextMenu";
import { PlayerBar } from "./PlayerBar";
import { PlaylistChips, PlaylistPicker, TrackGrid, TrackList, type SortKey } from "./PlaylistView";

// Compact "mini player" footprint, restored to the previous size on expand.
const MINI_W = 320;
const MINI_H = 150;

type ViewMode = "grid" | "list";

export type MusicPayload = {
  playlist?: string;
  view?: ViewMode;
  browse?: "tracks" | "playlists";
  sortKey?: SortKey;
  sortAsc?: boolean;
  mini?: boolean;
  /** Restore size for the mini toggle. In the payload, not a ref, so it
   *  survives the unmount that minimizing the window causes. */
  prevSize?: { width: number; height: number };
};

/**
 * The Music Player window: browse, search and pick what plays.
 *
 * Playback itself lives in playerStore + AudioEngine on the desktop, so this
 * component can be unmounted (minimized, closed) without stopping the music.
 * View state lives in the window payload for the same reason - the Ereader and
 * Explorer both do this, and it's what makes minimize/restore lossless.
 */
export function Music({ winId, payload }: { winId: string; payload: unknown }) {
  const patchPayload = useWindowStore((s) => s.patchPayload);
  const updateBounds = useWindowStore((s) => s.updateBounds);
  const setNoMaximize = useWindowStore((s) => s.setNoMaximize);
  const saved = (payload ?? {}) as MusicPayload;

  const setState = useCallback(
    (patch: MusicPayload) => patchPayload(winId, patch),
    [patchPayload, winId],
  );

  const playlist = saved.playlist ?? ALL_TRACKS;
  const view = saved.view ?? "grid";
  const browse = saved.browse ?? "tracks";
  const sortKey = saved.sortKey ?? "order";
  const sortAsc = saved.sortAsc ?? true;
  const mini = saved.mini ?? false;

  // Search is deliberately NOT persisted - a filter you can't see the cause of
  // after restoring a window is worse than losing a half-typed query.
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const track = usePlayerStore(currentTrack);
  const playing = usePlayerStore((s) => s.playing);
  const play = usePlayerStore((s) => s.play);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  const visible: Track[] = useMemo(() => {
    const scoped = searchTracks(tracksIn(playlist), query);
    if (sortKey === "order") return sortAsc ? scoped : [...scoped].reverse();
    const dir = sortAsc ? 1 : -1;
    return [...scoped].sort((a, b) => {
      if (sortKey === "duration") return ((a.duration ?? 0) - (b.duration ?? 0)) * dir;
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      return av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }, [playlist, query, sortKey, sortAsc]);

  // Keep the roving-tabindex anchor on something that still exists after a
  // filter or a playlist change, otherwise the list has no tab stop at all.
  useEffect(() => {
    if (!visible.length) {
      setSelectedId(null);
    } else if (!selectedId || !visible.some((t) => t.id === selectedId)) {
      setSelectedId(visible[0].id);
    }
  }, [visible, selectedId]);

  const onPlay = useCallback(
    (t: Track) => {
      // Clicking the track that's already loaded means pause/resume, not restart.
      if (t.id === track?.id) toggle();
      else play(t.id, visible, query ? `search "${query}"` : playlist);
    },
    [track?.id, toggle, play, visible, playlist, query],
  );

  function sortBy(key: SortKey) {
    if (key === sortKey) setState({ sortAsc: !sortAsc });
    else setState({ sortKey: key, sortAsc: true });
  }

  // Collapse to a compact bar and back. The restore size lives in the payload so
  // minimizing between the two doesn't lose it.
  function toggleMini() {
    const win = useWindowStore.getState().windows.find((w) => w.id === winId);
    if (!mini) {
      // Also drops out of maximized: that state paints the whole desktop and
      // ignores the window's own w/h, so shrinking the bounds alone would leave
      // the mini player full screen.
      setNoMaximize(winId, true);
      setState({ mini: true, prevSize: win ? { width: win.width, height: win.height } : undefined });
      updateBounds(winId, { width: MINI_W, height: MINI_H });
    } else {
      setNoMaximize(winId, false);
      setState({ mini: false });
      updateBounds(winId, saved.prevSize ?? defaultSize(APP_REGISTRY.music));
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    // Never steal keys from the search box, or you can't type an "n".
    if (e.target === searchRef.current) {
      if (e.key === "Escape") {
        setQuery("");
        bodyRef.current?.focus();
      }
      return;
    }
    const move = (delta: number) => {
      if (!visible.length) return;
      const at = visible.findIndex((t) => t.id === selectedId);
      const to = Math.min(visible.length - 1, Math.max(0, (at < 0 ? 0 : at) + delta));
      const target = visible[to];
      setSelectedId(target.id);
      bodyRef.current
        ?.querySelector<HTMLElement>(`[data-track="${CSS.escape(target.id)}"]`)
        ?.focus();
    };
    // Grid arrows are 1-D here on purpose: the column count is fluid, so
    // up/down guessing a stride would jump unpredictably as the window resizes.
    switch (e.key) {
      case " ": e.preventDefault(); toggle(); break;
      case "ArrowRight": e.preventDefault(); seek(usePlayerStore.getState().time + 5); break;
      case "ArrowLeft": e.preventDefault(); seek(Math.max(0, usePlayerStore.getState().time - 5)); break;
      case "ArrowDown": e.preventDefault(); move(1); break;
      case "ArrowUp": e.preventDefault(); move(-1); break;
      case "Enter": {
        const sel = visible.find((t) => t.id === selectedId);
        if (sel) { e.preventDefault(); onPlay(sel); }
        break;
      }
      case "n": case "N": next(); break;
      case "p": case "P": prev(); break;
      case "s": case "S": toggleShuffle(); break;
      case "r": case "R": cycleRepeat(); break;
      default: return;
    }
  }

  const menuItems: MenuItem[] = [
    { kind: "item", label: "View as Grid", hint: view === "grid" ? "•" : undefined, onSelect: () => setState({ view: "grid" }) },
    { kind: "item", label: "View as List", hint: view === "list" ? "•" : undefined, onSelect: () => setState({ view: "list" }) },
    { kind: "separator" },
    { kind: "item", label: "All Tracks", hint: playlist === ALL_TRACKS ? "•" : undefined, onSelect: () => setState({ playlist: ALL_TRACKS, browse: "tracks" }) },
    { kind: "item", label: "Browse Playlists", onSelect: () => setState({ browse: "playlists" }) },
  ];

  if (TRACKS.length === 0) {
    return (
      <div style={empty}>
        No tracks yet. Drop audio files into <code>client/public/music/</code>, where a folder
        becomes a playlist, then run <code>npm run tracks</code> (or restart the dev server) and
        reload.
      </div>
    );
  }

  const emptyMessage = query
    ? `Nothing matches “${query}”.`
    : `Nothing in ${playlist} yet.`;

  return (
    <div
      style={root}
      ref={bodyRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => {
        if (mini) return;
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {!mini && (
        <>
          <div style={toolbar}>
            <ToolButton active={browse === "tracks"} onClick={() => setState({ browse: "tracks" })}>
              ♪ Tracks
            </ToolButton>
            <ToolButton active={browse === "playlists"} onClick={() => setState({ browse: "playlists" })}>
              ▤ Playlists
            </ToolButton>
            <span style={toolDivider} />
            <ToolButton active={view === "grid"} onClick={() => setState({ view: "grid" })}>
              ▦ Grid
            </ToolButton>
            <ToolButton active={view === "list"} onClick={() => setState({ view: "list" })}>
              ▤ List
            </ToolButton>
            <span style={{ flex: 1 }} />
            <span aria-hidden style={{ fontSize: 13, opacity: 0.6 }}>⌕</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (browse !== "tracks") setState({ browse: "tracks" });
              }}
              placeholder="Title, artist, album"
              style={searchInput}
              aria-label="Search the music"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} style={clearButton} title="Clear search">
                ×
              </button>
            )}
          </div>

          {browse === "playlists" ? (
            <div style={scroller}>
              <PlaylistPicker onOpen={(name) => setState({ playlist: name, browse: "tracks" })} />
            </div>
          ) : (
            <>
              <PlaylistChips playlist={playlist} onSelect={(name) => setState({ playlist: name })} />
              {view === "grid" ? (
                <div style={scroller}>
                  <TrackGrid
                    tracks={visible}
                    currentId={track?.id ?? null}
                    playing={playing}
                    onPlay={onPlay}
                    selectedId={selectedId}
                    onSelect={(t) => setSelectedId(t.id)}
                    empty={emptyMessage}
                  />
                </div>
              ) : (
                <TrackList
                  tracks={visible}
                  currentId={track?.id ?? null}
                  playing={playing}
                  onPlay={onPlay}
                  selectedId={selectedId}
                  onSelect={(t) => setSelectedId(t.id)}
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={sortBy}
                  empty={emptyMessage}
                />
              )}
            </>
          )}
        </>
      )}

      <PlayerBar mini={mini} onToggleMini={toggleMini} />

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}
    </div>
  );
}

function ToolButton({
  active, onClick, children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{ ...toolBtn, ...(active ? toolBtnActive : null) }}
    >
      {children}
    </button>
  );
}

/* ---- styles (Workbench skin, Spotify-ish layout) --------------------- */

const root: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontFamily: "var(--wb-font)",
  color: "var(--wb-black)",
  outline: "none",
};
const toolbar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  flexShrink: 0,
};
const toolBtn: React.CSSProperties = {
  padding: "2px 8px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 13,
  color: "var(--wb-black)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const toolBtnActive: React.CSSProperties = {
  background: "var(--wb-orange)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-3), inset -1px -1px 0 var(--wb-white)",
};
const toolDivider: React.CSSProperties = {
  width: 1,
  alignSelf: "stretch",
  background: "var(--wb-gray-2)",
  margin: "0 2px",
};
const searchInput: React.CSSProperties = {
  width: 160,
  padding: "2px 6px",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-2)",
  fontFamily: "var(--wb-font)",
  fontSize: 13,
  color: "var(--wb-black)",
};
const clearButton: React.CSSProperties = {
  padding: "1px 6px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  fontFamily: "var(--wb-font)",
  fontSize: 13,
  color: "var(--wb-black)",
  cursor: "pointer",
};
const scroller: React.CSSProperties = { flex: 1, minHeight: 0, overflow: "auto" };
const empty: React.CSSProperties = {
  padding: 12,
  fontSize: 13,
  opacity: 0.7,
  fontFamily: "var(--wb-font)",
  lineHeight: 1.6,
};

"use client";

import { currentTrack, usePlayerStore } from "@/context/playerStore";
import { formatDuration, type Track } from "@/data/tracks";
import { cover } from "./art";

/**
 * Now-playing, transport, seek and volume. Becomes the entire UI in mini mode.
 * Reads and writes the player store directly — playback outlives this window, so
 * there is no state to lift and nothing to pass down.
 */
export function PlayerBar({ mini, onToggleMini }: { mini: boolean; onToggleMini: () => void }) {
  const track: Track | null = usePlayerStore(currentTrack);
  const playing = usePlayerStore((s) => s.playing);
  const time = usePlayerStore((s) => s.time);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const error = usePlayerStore((s) => s.error);
  const source = usePlayerStore((s) => s.source);

  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  // The tag duration is known before the file loads, so the seek bar has a real
  // length from the first frame instead of snapping when metadata lands.
  const total = duration || track?.duration || 0;

  return (
    <div style={{ ...bar, ...(mini ? barMini : null) }}>
      <div style={nowPlaying}>
        <span
          style={{ ...barThumb, ...(track ? cover(track) : { background: "var(--wb-gray-3)" }) }}
        />
        <span style={barMeta}>
          <strong style={barTitle}>{track ? track.title : "..."}</strong>
          <span style={barArtist}>
            {error
              ? "file not found"
              : track
                ? `${track.artist}${source ? ` · from ${source}` : ""}`
                : "nothing playing"}
          </span>
        </span>
      </div>

      <div style={seekRow}>
        <span style={timeText}>{formatDuration(time)}</span>
        <input
          type="range"
          min={0}
          max={total}
          step={0.1}
          value={Math.min(time, total)}
          onChange={(e) => seek(Number(e.target.value))}
          style={slider}
          aria-label="Seek"
          disabled={!track}
        />
        <span style={timeText}>{formatDuration(total || undefined)}</span>
      </div>

      <div style={controls}>
        {!mini && (
          <button
            type="button"
            style={{ ...ctrlBtn, ...(shuffle ? ctrlOn : null) }}
            onClick={toggleShuffle}
            aria-pressed={shuffle}
            aria-label={`Shuffle ${shuffle ? "on" : "off"}`}
            title={`Shuffle ${shuffle ? "on" : "off"}`}
          >
            ⇄
          </button>
        )}
        <button type="button" style={ctrlBtn} onClick={() => prev()} aria-label="Previous track" title="Previous">
          ⏮
        </button>
        <button
          type="button"
          style={{ ...ctrlBtn, ...playBtn }}
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button type="button" style={ctrlBtn} onClick={() => next()} aria-label="Next track" title="Next">
          ⏭
        </button>
        {!mini && (
          <button
            type="button"
            style={{ ...ctrlBtn, ...(repeat !== "off" ? ctrlOn : null) }}
            onClick={cycleRepeat}
            aria-pressed={repeat !== "off"}
            aria-label={`Repeat: ${repeat}`}
            title={`Repeat: ${repeat}`}
          >
            {repeat === "one" ? "🔂" : "🔁"}
          </button>
        )}
        {!mini && (
          <span style={volWrap}>
            <span style={{ fontSize: 12 }} aria-hidden>
              🔊
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ ...slider, width: 60 }}
              aria-label="Volume"
            />
          </span>
        )}
        <button
          type="button"
          style={{ ...ctrlBtn, marginLeft: "auto" }}
          onClick={onToggleMini}
          aria-label={mini ? "Expand player" : "Shrink to mini player"}
          title={mini ? "Expand player" : "Shrink to mini player"}
        >
          {mini ? "⊞" : "⊟"}
        </button>
      </div>
    </div>
  );
}

/* ---- styles ---------------------------------------------------------- */

const bar: React.CSSProperties = {
  flexShrink: 0,
  border: "2px solid var(--wb-black)",
  background: "var(--wb-gray)",
  padding: 6,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};
const barMini: React.CSSProperties = {
  // No track list above it, so fill the window body. Longhand (not the `flex`
  // shorthand) so toggling doesn't conflict with `bar`'s flexShrink.
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 0,
};
const nowPlaying: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const barThumb: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "1px solid var(--wb-black)",
  flexShrink: 0,
};
const barMeta: React.CSSProperties = { display: "flex", flexDirection: "column", overflow: "hidden" };
const barTitle: React.CSSProperties = {
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const barArtist: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.7,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const seekRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6 };
const slider: React.CSSProperties = { flex: 1, accentColor: "var(--wb-orange)", cursor: "pointer" };
const timeText: React.CSSProperties = {
  fontSize: 11,
  width: 34,
  textAlign: "center",
  flexShrink: 0,
};
const controls: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4 };
const ctrlBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  lineHeight: 1,
  padding: "3px 8px",
  background: "var(--wb-gray-0)",
  border: "1px solid var(--wb-black)",
  boxShadow: "1px 1px 0 var(--wb-black)",
  cursor: "pointer",
  color: "var(--wb-black)",
};
const playBtn: React.CSSProperties = {
  background: "var(--wb-orange)",
  fontSize: 16,
  padding: "3px 12px",
};
const ctrlOn: React.CSSProperties = { background: "var(--wb-orange)" };
const volWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginLeft: "auto",
};

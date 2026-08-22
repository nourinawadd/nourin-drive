"use client";

import { currentTrack, usePlayerStore } from "@/context/playerStore";
import { formatDuration, type Track } from "@/data/tracks";
import { cover } from "./art";

type PlayerIcon =
  | "shuffle"
  | "previous"
  | "play"
  | "pause"
  | "next"
  | "repeat"
  | "repeatOne"
  | "volume"
  | "expand"
  | "shrink";

function PlayerGlyph({ icon, size = 15 }: { icon: PlayerIcon; size?: number }) {
  const common = {
    fill: "currentColor",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "square" as const,
    strokeLinejoin: "miter" as const,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={glyphSvg}>
      {icon === "shuffle" && <path {...common} fill="none" d="M3 7h4l10 10h4M3 17h4l3-3M14 7h7M18 4l3 3-3 3M18 14l3 3-3 3" />}
      {icon === "previous" && <path {...common} d="M5 5h2v14H5zM9 12l10-7v14z" />}
      {icon === "play" && <path {...common} d="M7 4l12 8-12 8z" />}
      {icon === "pause" && <path {...common} d="M6 5h4v14H6zM14 5h4v14h-4z" />}
      {icon === "next" && <path {...common} d="M17 5h2v14h-2zM5 5l10 7-10 7z" />}
      {icon === "repeat" && <path {...common} fill="none" d="M5 7h12l3 3M20 10l-3 3M19 17H7l-3-3M4 14l3-3" />}
      {icon === "repeatOne" && <><path {...common} fill="none" d="M5 7h12l3 3M20 10l-3 3M19 17H7l-3-3M4 14l3-3" /><path {...common} d="M11 9h2v7h-2z" /></>}
      {icon === "volume" && <><path {...common} d="M4 10h4l6-5v14l-6-5H4z" /><path {...common} fill="none" d="M17 9c1 1 1 5 0 6M20 7c2 3 2 7 0 10" /></>}
      {icon === "expand" && <path {...common} fill="none" d="M5 10V5h5M14 5h5v5M19 14v5h-5M10 19H5v-5" />}
      {icon === "shrink" && <path {...common} fill="none" d="M9 5v4H5M15 5v4h4M19 15h-4v4M5 15h4v4" />}
    </svg>
  );
}

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
          <PlayerGlyph icon="shuffle" />
          </button>
        )}
        <button type="button" style={ctrlBtn} onClick={() => prev()} aria-label="Previous track" title="Previous">
         <PlayerGlyph icon="previous" />
        </button>
        <button
          type="button"
          style={{ ...ctrlBtn, ...playBtn }}
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <PlayerGlyph icon="pause" size={17} /> : <PlayerGlyph icon="play" size={17} />}
        </button>
        <button type="button" style={ctrlBtn} onClick={() => next()} aria-label="Next track" title="Next">
         <PlayerGlyph icon="next" />
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
            {repeat === "one" ? <PlayerGlyph icon="repeatOne" /> : <PlayerGlyph icon="repeat" />}
          </button>
        )}
        {!mini && (
          <span style={volWrap}>
            <span style={volumeIcon} aria-hidden>
              <PlayerGlyph icon="volume" size={14} />
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
          {mini ? <PlayerGlyph icon="expand" /> : <PlayerGlyph icon="shrink" />}
        </button>
      </div>
    </div>
  );
}

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
  fontSize: 14,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const barArtist: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const seekRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6 };
const slider: React.CSSProperties = { flex: 1, accentColor: "var(--wb-orange)", cursor: "pointer" };
const timeText: React.CSSProperties = {
  fontSize: 12,
  width: 34,
  textAlign: "center",
  flexShrink: 0,
};
const controls: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4 };
const glyphSvg: React.CSSProperties = {
  display: "block",
  filter: "drop-shadow(1px 1px 0 var(--wb-black))",
};
const ctrlBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 15,
  lineHeight: 1,
  padding: "3px 8px",
  background: "var(--wb-gray-0)",
  border: "1px solid var(--wb-black)",
  boxShadow: "1px 1px 0 var(--wb-black)",
  cursor: "pointer",
  color: "var(--wb-white)",
};
const playBtn: React.CSSProperties = {
  background: "var(--wb-orange)",
  fontSize: 17,
  padding: "3px 12px",
};
const ctrlOn: React.CSSProperties = { background: "var(--wb-orange)" };
const volumeIcon: React.CSSProperties = { color: "var(--wb-white)", display: "inline-flex" };
const volWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginLeft: "auto",
};

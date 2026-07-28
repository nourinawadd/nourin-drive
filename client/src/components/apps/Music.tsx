"use client";

import { useEffect, useRef, useState } from "react";
import { TRACKS, type Track } from "@/data/tracks";
import { useWindowStore } from "@/context/windowStore";

type RepeatMode = "off" | "all" | "one";

// Compact "mini player" footprint, restored to the previous size on expand.
const MINI_W = 320;
const MINI_H = 150;
const FULL_W = 480;
const FULL_H = 460;

// Stable gradient per track index so placeholder covers stay consistent
// (mirrors the Gallery / Games placeholder convention).
const GRADIENTS = [
  "linear-gradient(135deg, #ff8800, #cc3333)",
  "linear-gradient(135deg, #3377aa, #22aa77)",
  "linear-gradient(135deg, #8866cc, #3377aa)",
  "linear-gradient(135deg, #ee8800, #8866cc)",
  "linear-gradient(135deg, #555555, #22aa77)",
  "linear-gradient(135deg, #cc3333, #ee8800)",
];
const gradFor = (i: number) => GRADIENTS[i % GRADIENTS.length];

// Cover art if the track has one, otherwise a stable gradient placeholder.
function cover(track: Track | null, i: number): React.CSSProperties {
  if (track?.art) {
    return {
      backgroundImage: `url("${track.art}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { background: gradFor(i) };
}

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Music({ winId }: { winId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const updateBounds = useWindowStore((s) => s.updateBounds);
  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [error, setError] = useState(false);
  const [mini, setMini] = useState(false);
  const prevSize = useRef<{ width: number; height: number } | null>(null);

  const current: Track | null = index == null ? null : TRACKS[index] ?? null;

  // Collapse to a compact bar (playback keeps going — same component, the
  // window just shrinks) and back. Remembers the size you came from.
  function toggleMini() {
    const win = useWindowStore.getState().windows.find((w) => w.id === winId);
    if (!mini) {
      if (win) prevSize.current = { width: win.width, height: win.height };
      updateBounds(winId, { width: MINI_W, height: MINI_H });
      setMini(true);
    } else {
      updateBounds(winId, prevSize.current ?? { width: FULL_W, height: FULL_H });
      setMini(false);
    }
  }

  // Whenever the selected track changes, load and start playing it.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || index == null) return;
    setError(false);
    setTime(0);
    a.play().catch(() => {});
  }, [index]);

  // Keep the element's volume in sync with the slider.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function nextIndex(from: number): number | null {
    if (shuffle && TRACKS.length > 1) {
      let n = from;
      while (n === from) n = Math.floor(Math.random() * TRACKS.length);
      return n;
    }
    if (from + 1 < TRACKS.length) return from + 1;
    return repeat === "all" ? 0 : null;
  }

  function prevIndex(from: number): number {
    // Mirror typical players: restart current track if we're past 3s.
    if ((audioRef.current?.currentTime ?? 0) > 3) return from;
    if (from - 1 >= 0) return from - 1;
    return repeat === "all" ? TRACKS.length - 1 : 0;
  }

  function togglePlay() {
    if (index == null) {
      setIndex(0);
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }

  function playNext() {
    if (index == null) return;
    const n = nextIndex(index);
    if (n == null) {
      setPlaying(false);
      return;
    }
    setIndex(n);
  }

  function onEnded() {
    const a = audioRef.current;
    if (repeat === "one" && a) {
      a.currentTime = 0;
      a.play().catch(() => {});
      return;
    }
    playNext();
  }

  function seek(value: number) {
    const a = audioRef.current;
    if (a && Number.isFinite(a.duration)) {
      a.currentTime = value;
      setTime(value);
    }
  }

  if (TRACKS.length === 0) {
    return (
      <div style={empty}>
        No tracks yet. Drop audio files into <code>client/public/music/</code>,
        then run <code>npm run tracks</code> (or restart the dev server) and reload.
      </div>
    );
  }

  return (
    <div style={root}>
      {/* Track list — hidden in mini mode */}
      {!mini && (
      <div style={list}>
        {TRACKS.map((t, i) => {
          const active = i === index;
          return (
            <button
              key={t.id}
              style={{ ...row, ...(active ? rowActive : null) }}
              onClick={() => (active ? togglePlay() : setIndex(i))}
              title={`${t.title} · ${t.artist}`}
            >
              <span style={rowNum}>
                {active && playing ? "♪" : i + 1}
              </span>
              <span style={{ ...rowThumb, ...cover(t, i) }} />
              <span style={rowMeta}>
                <strong style={rowTitle}>{t.title}</strong>
                <span style={rowArtist}>{t.artist}</span>
              </span>
            </button>
          );
        })}
      </div>
      )}

      {/* Now-playing bar (the whole UI when mini) */}
      <div style={{ ...bar, ...(mini ? barMini : null) }}>
        <div style={nowPlaying}>
          <span
            style={{
              ...barThumb,
              ...(current ? cover(current, index!) : { background: "var(--wb-gray-3)" }),
            }}
          />
          <span style={barMeta}>
            <strong style={barTitle}>{current ? current.title : "..."}</strong>
            <span style={barArtist}>
              {error ? "file not found" : current ? current.artist : "nothing playing"}
            </span>
          </span>
        </div>

        <div style={seekRow}>
          <span style={timeText}>{fmt(time)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(time, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            style={slider}
            aria-label="Seek"
          />
          <span style={timeText}>{fmt(duration)}</span>
        </div>

        <div style={controls}>
          {!mini && (
            <button
              style={{ ...ctrlBtn, ...(shuffle ? ctrlOn : null) }}
              onClick={() => setShuffle((s) => !s)}
              title="Shuffle"
            >
              ⇄
            </button>
          )}
          <button style={ctrlBtn} onClick={() => index != null && setIndex(prevIndex(index))} title="Previous">
            ⏮
          </button>
          <button style={{ ...ctrlBtn, ...playBtn }} onClick={togglePlay} title={playing ? "Pause" : "Play"}>
            {playing ? "⏸" : "▶"}
          </button>
          <button style={ctrlBtn} onClick={playNext} title="Next">
            ⏭
          </button>
          {!mini && (
            <button
              style={{ ...ctrlBtn, ...(repeat !== "off" ? ctrlOn : null) }}
              onClick={() => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"))}
              title={`Repeat: ${repeat}`}
            >
              {repeat === "one" ? "🔂" : "🔁"}
            </button>
          )}
          {!mini && (
            <span style={volWrap}>
              <span style={{ fontSize: 12 }}>🔊</span>
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
            style={{ ...ctrlBtn, marginLeft: "auto" }}
            onClick={toggleMini}
            title={mini ? "Expand player" : "Shrink to mini player"}
          >
            {mini ? "⊞" : "⊟"}
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={current?.src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={onEnded}
        onError={() => {
          setError(true);
          setPlaying(false);
        }}
      />
    </div>
  );
}

/* ---- styles (Workbench skin, Spotify-ish layout) ------------------- */
const root: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontFamily: "var(--wb-font)",
  color: "var(--wb-black)",
};
const list: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  border: "1px solid var(--wb-black)",
  background: "var(--wb-white)",
  display: "flex",
  flexDirection: "column",
};
const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: 4,
  background: "transparent",
  border: "none",
  borderBottom: "1px solid var(--wb-gray-0)",
  cursor: "pointer",
  textAlign: "left",
  font: "inherit",
  color: "inherit",
};
const rowActive: React.CSSProperties = {
  background: "var(--wb-orange)",
};
const rowNum: React.CSSProperties = {
  width: 18,
  textAlign: "center",
  fontSize: 12,
  flexShrink: 0,
};
const rowThumb: React.CSSProperties = {
  width: 28,
  height: 28,
  border: "1px solid var(--wb-black)",
  flexShrink: 0,
};
const rowMeta: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
const rowTitle: React.CSSProperties = {
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const rowArtist: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.7,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
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
const nowPlaying: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};
const barThumb: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "1px solid var(--wb-black)",
  flexShrink: 0,
};
const barMeta: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
const barTitle: React.CSSProperties = {
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const barArtist: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.7,
};
const seekRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};
const slider: React.CSSProperties = {
  flex: 1,
  accentColor: "var(--wb-orange)",
  cursor: "pointer",
};
const timeText: React.CSSProperties = {
  fontSize: 11,
  width: 34,
  textAlign: "center",
  flexShrink: 0,
};
const controls: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
};
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
const ctrlOn: React.CSSProperties = {
  background: "var(--wb-orange)",
};
const volWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginLeft: "auto",
};
const empty: React.CSSProperties = {
  padding: 12,
  fontSize: 12,
  opacity: 0.7,
  fontFamily: "var(--wb-font)",
  lineHeight: 1.6,
};

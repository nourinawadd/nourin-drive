"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

interface Track {
  id: string;
  name: string;
  artist: string;
  cover: string;
  colorA: string;
  colorB: string;
  duration: number; // seconds
}

const TRACKS: Track[] = [
  { id: "t1", name: "Midnight City",   artist: "M83",            cover: "🌃", colorA: "#1a3a5c", colorB: "#0d2240", duration: 242 },
  { id: "t2", name: "The Less I Know", artist: "Tame Impala",    cover: "🌀", colorA: "#3a1a5c", colorB: "#220d40", duration: 216 },
  { id: "t3", name: "Feels",           artist: "Calvin Harris",  cover: "✨", colorA: "#1a5c3a", colorB: "#0d4028", duration: 235 },
  { id: "t4", name: "Breathe",         artist: "Télépopmusik",   cover: "🌬️", colorA: "#2a4a2a", colorB: "#1a3018", duration: 258 },
  { id: "t5", name: "Blinding Lights", artist: "The Weeknd",     cover: "🌆", colorA: "#5c1a1a", colorB: "#400d0d", duration: 200 },
  { id: "t6", name: "Lost in the Fire", artist: "Gesaffelstein", cover: "🔥", colorA: "#4a2a0a", colorB: "#301a04", duration: 233 },
];

const PLAYLISTS = [
  { emoji: "❤️", name: "Liked Songs" },
  { emoji: "🌙", name: "Night Drive" },
  { emoji: "⚡", name: "Energy Mix"  },
  { emoji: "🎸", name: "Indie Rock"  },
  { emoji: "🌊", name: "Chill Vibes" },
];

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function SpotifyApp({ windowId }: { windowId: string }) {
  const [current,  setCurrent]  = useState<Track | null>(null);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);   // 0–100
  const [elapsed,  setElapsed]  = useState(0);   // seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick the progress bar while playing
  useEffect(() => {
    if (!playing || !current) return;
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 0.5;
        if (next >= current.duration) {
          playNext();
          return 0;
        }
        setProgress((next / current.duration) * 100);
        return next;
      });
    }, 500);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, current]);

  function play(track: Track) {
    clearInterval(timerRef.current!);
    setCurrent(track);
    setPlaying(true);
    setProgress(0);
    setElapsed(0);
  }

  function togglePlay() {
    if (!current) { play(TRACKS[0]); return; }
    setPlaying((p) => !p);
  }

  function playNext() {
    const idx = current ? TRACKS.findIndex((t) => t.id === current.id) : -1;
    play(TRACKS[(idx + 1) % TRACKS.length]);
  }

  function playPrev() {
    const idx = current ? TRACKS.findIndex((t) => t.id === current.id) : 0;
    play(TRACKS[(idx - 1 + TRACKS.length) % TRACKS.length]);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    if (!current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgress(pct * 100);
    setElapsed(pct * current.duration);
  }

  const duration = current?.duration ?? 0;

  return (
    <div className="flex h-full" style={{ background: "#121212" }}>
      {/* ── Sidebar ─────────────────────────────────────── */}
      <div className="w-[190px] flex flex-col shrink-0" style={{ background: "#1a1a1a" }}>
        <div className="px-4 pt-4 pb-2">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#888" }}>
            Library
          </div>
          {[
            { emoji: "🏠", name: "Home"         },
            { emoji: "🔍", name: "Search"       },
            { emoji: "📚", name: "Your Library" },
          ].map((item) => (
            <button
              key={item.name}
              className="flex items-center gap-2 px-2 py-[6px] w-full text-left text-[12px] rounded hover:text-white"
              style={{ color: "#b3b3b3", fontFamily: "var(--font-ui)" }}
            >
              <span>{item.emoji}</span> {item.name}
            </button>
          ))}
        </div>
        <div className="px-4 pt-2 pb-1">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#888" }}>
            Playlists
          </div>
          {PLAYLISTS.map((pl) => (
            <button
              key={pl.name}
              className="flex items-center gap-2 px-2 py-[5px] w-full text-left text-[11px] hover:text-white"
              style={{ color: "#b3b3b3", fontFamily: "var(--font-ui)" }}
            >
              <span>{pl.emoji}</span> {pl.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5" style={{ paddingBottom: 90 }}>
          {/* Hero */}
          <div
            className="px-6 py-5 mb-5 -mx-5 -mt-5"
            style={{
              background: current
                ? `linear-gradient(180deg, ${current.colorA} 0%, #121212 100%)`
                : "linear-gradient(180deg, #1a4a3a 0%, #121212 100%)",
            }}
          >
            <h2 className="text-xl font-bold text-white mb-1">Good evening 🌙</h2>
            <p className="text-[11px]" style={{ color: "#b3b3b3" }}>Pick up where you left off</p>
          </div>

          <div className="text-white font-bold text-[16px] mb-3">Recently Played</div>
          <div className="grid grid-cols-3 gap-3">
            {TRACKS.map((t) => (
              <button
                key={t.id}
                className={clsx(
                  "text-left p-3 rounded cursor-pointer transition-colors",
                  current?.id === t.id ? "bg-[#3a3a3a]" : "bg-[#282828] hover:bg-[#3a3a3a]"
                )}
                onClick={() => play(t)}
              >
                <div
                  className="w-full aspect-square flex items-center justify-center text-4xl rounded mb-2"
                  style={{ background: `linear-gradient(135deg, ${t.colorA}, #121212)` }}
                >
                  {t.cover}
                </div>
                <div className="text-white text-[12px] font-semibold truncate">{t.name}</div>
                <div className="text-[10px] truncate" style={{ color: "#b3b3b3" }}>{t.artist}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Player bar ──────────────────────────────── */}
        <div
          className="shrink-0 flex items-center gap-3 px-4 py-3"
          style={{ height: 78, background: "#181818", borderTop: "1px solid #282828" }}
        >
          {/* Now playing */}
          <div className="flex items-center gap-2 w-[180px] shrink-0">
            <div
              className="w-11 h-11 flex items-center justify-center text-xl rounded shrink-0"
              style={{
                background: current
                  ? `linear-gradient(135deg, ${current.colorA}, #121212)`
                  : "#282828",
              }}
            >
              {current?.cover ?? "🎵"}
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-[11px] font-semibold truncate">
                {current?.name ?? "No track selected"}
              </div>
              <div className="text-[10px] truncate" style={{ color: "#b3b3b3" }}>
                {current?.artist ?? "—"}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-4">
              <button
                className="text-[16px] hover:text-white transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#b3b3b3" }}
                onClick={playPrev}
              >
                ⏮
              </button>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] text-[#121212] hover:scale-105 transition-transform"
                style={{ background: "#fff", border: "none", cursor: "pointer" }}
                onClick={togglePlay}
              >
                {playing ? "⏸" : "▶"}
              </button>
              <button
                className="text-[16px] hover:text-white transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#b3b3b3" }}
                onClick={playNext}
              >
                ⏭
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 w-full max-w-xs">
              <span className="text-[10px] font-mono w-6 text-center" style={{ color: "#b3b3b3" }}>
                {formatTime(elapsed)}
              </span>
              <div
                className="flex-1 h-[3px] rounded cursor-pointer relative"
                style={{ background: "#4a4a4a" }}
                onClick={seek}
              >
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{ width: `${progress}%`, background: "#1db954" }}
                />
              </div>
              <span className="text-[10px] font-mono w-6 text-center" style={{ color: "#b3b3b3" }}>
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume (decorative) */}
          <div className="flex items-center gap-1 w-24 shrink-0">
            <span style={{ color: "#b3b3b3", fontSize: 13 }}>🔊</span>
            <div className="flex-1 h-[3px] rounded" style={{ background: "#4a4a4a" }}>
              <div className="h-full rounded w-3/4" style={{ background: "#b3b3b3" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

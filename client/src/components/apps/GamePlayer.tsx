"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowStore } from "@/context/windowStore";
import { useSeek } from "@/lib/useSeek";

// Plays a self-hosted HTML5 game build (Godot/Unity WebGL export under
// /public/games/<slug>/) inside a window. The build is first-party and
// same-origin, so we don't sandbox it - that would block fullscreen, pointer
// lock and IndexedDB caching that the engines rely on.

const GAME_SEEK_MAX_MS = 30_000;

type GamePayload = { src?: string; name?: string };

export function GamePlayer({ winId, payload }: { winId: string; payload?: unknown }) {
  const { src, name } = (payload as GamePayload | undefined) ?? {};
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const closeWin = useWindowStore((s) => s.closeWin);

  useSeek(!!src && !ready, GAME_SEEK_MAX_MS);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.source !== frameRef.current?.contentWindow) return;
      const type = (e.data as { type?: string } | null)?.type;
      if (type === "game:exit") closeWin(winId);
      if (type === "game:ready") setReady(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [closeWin, winId]);

  if (!src) {
    return (
      <div style={empty}>
        No game build found. Drop an HTML5 export into{" "}
        <code>client/public/games/&lt;slug&gt;/</code> and run{" "}
        <code>npm run games</code>.
      </div>
    );
  }

  return (
    <div style={wrap}>
      <iframe
        ref={frameRef}
        src={src}
        title={name ?? "Game"}
        allow="autoplay; fullscreen; gamepad; cross-origin-isolated"
        onLoad={() => setLoaded(true)}
        style={frame}
      />
      {!loaded && <div style={overlay}>loading {name ?? "game"}…</div>}
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: "relative",
  height: "100%",
  width: "100%",
  background: "#000",
};

const frame: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: "none",
  display: "block",
  background: "#000",
};

const overlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  color: "var(--wb-white)",
  background: "#000",
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  pointerEvents: "none",
};

const empty: React.CSSProperties = {
  height: "100%",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  padding: 16,
  fontSize: 13,
  lineHeight: 1.5,
  opacity: 0.8,
};

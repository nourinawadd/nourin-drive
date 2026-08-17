"use client";

import { useState } from "react";

// Plays a self-hosted HTML5 game build (Godot/Unity WebGL export under
// /public/games/<slug>/) inside a window. The build is first-party and
// same-origin, so we don't sandbox it - that would block fullscreen, pointer
// lock and IndexedDB caching that the engines rely on.

type GamePayload = { src?: string; name?: string };

export function GamePlayer({ payload }: { payload?: unknown }) {
  const { src, name } = (payload as GamePayload | undefined) ?? {};
  const [loaded, setLoaded] = useState(false);

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
  fontSize: 13,
  pointerEvents: "none",
};

const empty: React.CSSProperties = {
  height: "100%",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  padding: 16,
  fontSize: 12,
  lineHeight: 1.5,
  opacity: 0.8,
};

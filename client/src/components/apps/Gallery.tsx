"use client";

import { useEffect, useState } from "react";
import { PROJECTS, type Project } from "@/data/projects";

type GalleryPayload = { focusId?: string };

const designs = PROJECTS.filter((p) => p.category === "designs");

// Stable gradient per design id so placeholders stay consistent.
const GRADIENTS: string[] = [
  "linear-gradient(135deg, #ff8800, #c33)",
  "linear-gradient(135deg, #37a, #2a7)",
  "linear-gradient(135deg, #a3a, #37a)",
  "linear-gradient(135deg, #e80, #a3a)",
  "linear-gradient(135deg, #888, #2a7)",
  "linear-gradient(135deg, #c33, #e80)",
];

function gradFor(i: number) { return GRADIENTS[i % GRADIENTS.length]; }

export function Gallery({ payload }: { payload?: unknown }) {
  const initial = (payload as GalleryPayload | undefined)?.focusId ?? null;
  const [lightbox, setLightbox] = useState<string | null>(initial);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!lightbox) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((id) => step(id, 1));
      if (e.key === "ArrowLeft")  setLightbox((id) => step(id, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  function step(id: string | null, delta: number): string | null {
    if (!id) return id;
    const i = designs.findIndex((d) => d.id === id);
    if (i === -1) return id;
    const next = (i + delta + designs.length) % designs.length;
    return designs[next].id;
  }

  const focused = lightbox ? designs.find((d) => d.id === lightbox) : null;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={grid}>
        {designs.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setLightbox(p.id)}
            style={tile}
            title={p.blurb}
          >
            <div style={{ ...thumb, background: gradFor(i) }} />
            <div style={caption}>{p.name}</div>
          </button>
        ))}
      </div>

      {focused && (
        <div style={overlay} onClick={() => setLightbox(null)}>
          <div style={lightboxPanel} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...thumb, background: gradFor(designs.indexOf(focused)), aspectRatio: "4 / 3" }} />
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{focused.name}</strong>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{focused.blurb}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button style={navBtn} onClick={() => setLightbox(step(lightbox, -1))}>‹</button>
                <button style={navBtn} onClick={() => setLightbox(step(lightbox, 1))}>›</button>
                <button style={navBtn} onClick={() => setLightbox(null)}>×</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 8,
  padding: 4,
  overflow: "auto",
};
const tile: React.CSSProperties = {
  display: "flex", flexDirection: "column",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  padding: 4,
  fontFamily: "var(--wb-font)", color: "var(--wb-black)",
  cursor: "pointer", textAlign: "left",
};
const thumb: React.CSSProperties = {
  width: "100%",
  aspectRatio: "4 / 3",
  border: "1px solid var(--wb-black)",
};
const caption: React.CSSProperties = {
  fontSize: 12,
  marginTop: 4,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const overlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "grid",
  placeItems: "center",
  zIndex: 5,
};
const lightboxPanel: React.CSSProperties = {
  width: "min(420px, 90%)",
  background: "var(--wb-white)",
  border: "2px solid var(--wb-black)",
  padding: 8,
  boxShadow: "6px 6px 0 var(--wb-black)",
};
const navBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)", fontSize: 16, lineHeight: 1,
  padding: "2px 8px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  cursor: "pointer", color: "var(--wb-black)",
};

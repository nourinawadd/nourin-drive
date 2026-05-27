"use client";

import { useEffect, useMemo, useState } from "react";
import { PHOTOS, type Photo } from "@/data/gallery";

type GalleryPayload = { focusId?: string };

export function Gallery({ payload }: { payload?: unknown }) {
  const initial = (payload as GalleryPayload | undefined)?.focusId ?? null;
  const [cat, setCat] = useState<string>("All");
  const [lightbox, setLightbox] = useState<string | null>(initial);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(PHOTOS.map((p) => p.category)))],
    [],
  );
  const shown = useMemo(
    () => (cat === "All" ? PHOTOS : PHOTOS.filter((p) => p.category === cat)),
    [cat],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!lightbox) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((id) => step(id, 1));
      if (e.key === "ArrowLeft") setLightbox((id) => step(id, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function step(id: string | null, delta: number): string | null {
    if (!id) return id;
    const i = shown.findIndex((p) => p.id === id);
    if (i === -1) return id;
    const next = (i + delta + shown.length) % shown.length;
    return shown[next].id;
  }

  const focused: Photo | undefined = lightbox
    ? PHOTOS.find((p) => p.id === lightbox)
    : undefined;

  if (PHOTOS.length === 0) {
    return (
      <div style={empty}>
        No images yet — drop photos into <code>client/public/gallery/</code>
        {" "}(use subfolders for categories, e.g. <code>gallery/Photography/…</code>),
        then run <code>npm run gallery</code> (or restart the dev server) and reload.
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
      {/* category tabs */}
      <div style={tabs}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{ ...tab, ...(cat === c ? tabActive : null) }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={grid}>
        {shown.map((p) => (
          <button key={p.id} onClick={() => setLightbox(p.id)} style={tile} title={p.title}>
            <img src={p.src} alt={p.title} loading="lazy" style={thumb} />
            <div style={caption}>{p.title}</div>
          </button>
        ))}
      </div>

      {focused && (
        <div style={overlay} onClick={() => setLightbox(null)}>
          <div style={lightboxPanel} onClick={(e) => e.stopPropagation()}>
            <img src={focused.src} alt={focused.title} style={lightboxImg} />
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{focused.title}</strong>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {focused.category}
                  {focused.date ? ` · ${focused.date}` : ""}
                </div>
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

const tabs: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  flexShrink: 0,
};
const tab: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  padding: "2px 10px",
  background: "var(--wb-gray-0)",
  border: "1px solid var(--wb-black)",
  cursor: "pointer",
  color: "var(--wb-black)",
};
const tabActive: React.CSSProperties = {
  background: "var(--wb-orange)",
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 8,
  padding: 4,
  overflow: "auto",
  flex: 1,
};
const tile: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  padding: 4,
  fontFamily: "var(--wb-font)",
  color: "var(--wb-black)",
  cursor: "pointer",
  textAlign: "left",
};
const thumb: React.CSSProperties = {
  width: "100%",
  aspectRatio: "4 / 3",
  objectFit: "cover",
  border: "1px solid var(--wb-black)",
  display: "block",
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
  width: "min(460px, 92%)",
  maxHeight: "90%",
  background: "var(--wb-white)",
  border: "2px solid var(--wb-black)",
  padding: 8,
  boxShadow: "6px 6px 0 var(--wb-black)",
  display: "flex",
  flexDirection: "column",
};
const lightboxImg: React.CSSProperties = {
  width: "100%",
  maxHeight: "70vh",
  objectFit: "contain",
  border: "1px solid var(--wb-black)",
  background: "var(--wb-black)",
};
const navBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 16,
  lineHeight: 1,
  padding: "2px 8px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  cursor: "pointer",
  color: "var(--wb-black)",
};
const empty: React.CSSProperties = {
  padding: 12,
  fontSize: 12,
  opacity: 0.75,
  lineHeight: 1.6,
  fontFamily: "var(--wb-font)",
};

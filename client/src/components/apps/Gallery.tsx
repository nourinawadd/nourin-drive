"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PHOTOS, type Photo } from "@/data/gallery";
import { ShareDialog } from "@/components/os/ShareDialog";
import { useIsPhone } from "@/components/os/ShellModeProvider";
import { copyLink, shareLink, triggerDownload } from "@/lib/share";

type GalleryPayload = { focusId?: string };

// A swipe has to travel this far sideways, and further sideways than up or
// down, before it counts: anything less is a wobble or the start of a scroll.
const SWIPE_PX = 48;

export function Gallery({ payload }: { payload?: unknown }) {
  const initial = (payload as GalleryPayload | undefined)?.focusId ?? null;
  const [cat, setCat] = useState<string>("All");
  const [lightbox, setLightbox] = useState<string | null>(initial);
  const [toast, setToast] = useState<{ url: string; copied: boolean } | null>(null);
  // Phone: two-column grid, thumb-sized controls, and a lightbox that fills the
  // frame and steps through photos with a sideways swipe. The keyboard arrows
  // stay as they are for the desktop.
  const phone = useIsPhone();
  const swipe = useRef<{ id: number; x: number; y: number } | null>(null);

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
  }, [lightbox, shown]);

  function step(id: string | null, delta: number): string | null {
    if (!id) return id;
    const i = shown.findIndex((p) => p.id === id);
    if (i === -1) return id;
    const next = (i + delta + shown.length) % shown.length;
    return shown[next].id;
  }

  // Touch only, so a mouse dragging across the image on the desktop (or a
  // touchscreen laptop in desktop mode, where these aren't attached at all)
  // can't flip photos. pointercancel - the browser deciding it's a scroll -
  // simply drops the gesture.
  const swipeHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== "touch") return;
      swipe.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = swipe.current;
      swipe.current = null;
      if (!s || s.id !== e.pointerId) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return;
      // Swiping left brings the next photo in from the right.
      setLightbox((id) => step(id, dx < 0 ? 1 : -1));
    },
    onPointerCancel: () => {
      swipe.current = null;
    },
  };

  const focused: Photo | undefined = lightbox
    ? PHOTOS.find((p) => p.id === lightbox)
    : undefined;

  if (PHOTOS.length === 0) {
    return (
      <div style={empty}>
        No images yet. Drop photos into <code>client/public/gallery/</code>
        {" "}(use subfolders for categories, e.g. <code>gallery/Photography/…</code>),
        then run <code>npm run gallery</code> (or restart the dev server) and reload.
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
      {/* category tabs */}
      <div style={tabs}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{ ...tab, ...(phone ? tabPhone : null), ...(cat === c ? tabActive : null) }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ ...grid, ...(phone ? gridPhone : null) }}>
        {shown.map((p) => (
          <button key={p.id} onClick={() => setLightbox(p.id)} style={tile} title={p.title}>
            <img src={p.src} alt={p.title} loading="lazy" style={thumb} />
            <div style={{ ...caption, ...(phone ? captionPhone : null) }}>{p.title}</div>
          </button>
        ))}
      </div>

      {focused && (
        <div style={{ ...overlay, ...(phone ? overlayPhone : null) }} onClick={() => setLightbox(null)}>
          <div style={{ ...lightboxPanel, ...(phone ? lightboxPanelPhone : null) }} onClick={(e) => e.stopPropagation()}>
            <img
              src={focused.src}
              alt={focused.title}
              style={{ ...lightboxImg, ...(phone ? lightboxImgPhone : null) }}
              {...(phone ? swipeHandlers : null)}
            />
            <div style={{ marginTop: 8, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", ...(phone ? metaRowPhone : null) }}>
              <div>
                <strong>{focused.title}</strong>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  {focused.category}
                  {focused.date ? ` · ${focused.date}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, ...(phone ? controlsPhone : null) }}>
                <button
                  style={{ ...actionBtn, ...(phone ? btnPhone : null) }}
                  title="Save this image"
                  onClick={() => triggerDownload(focused.src, fileNameOf(focused.src))}
                >
                  Save
                </button>
                <button
                  style={{ ...actionBtn, ...(phone ? btnPhone : null) }}
                  title="Copy a link to this image"
                  onClick={async () => setToast(await copyLink(shareLink("photo", focused.id)))}
                >
                  Share
                </button>
                <button style={{ ...navBtn, ...(phone ? btnPhone : null) }} onClick={() => setLightbox(step(lightbox, -1))}>‹</button>
                <button style={{ ...navBtn, ...(phone ? btnPhone : null) }} onClick={() => setLightbox(step(lightbox, 1))}>›</button>
                <button style={{ ...navBtn, ...(phone ? btnPhone : null) }} onClick={() => setLightbox(null)}>×</button>
              </div>
            </div>
            {toast && (
              <ShareDialog {...toast} what="image" onClose={() => setToast(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Real filename off a public path, undoing the %20s the generator wrote. */
function fileNameOf(src: string): string {
  return decodeURIComponent(src.split("/").pop() || "image");
}

const tabs: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  flexShrink: 0,
};
const tab: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 13,
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
  gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
  gap: 8,
  padding: 4,
  overflow: "auto",
  flex: 1,
  minHeight: 0,        // let the grid scroll internally instead of growing the body
  alignContent: "start", // keep rows their natural height at the top (no vertical stretch)
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
  fontSize: 13,
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
  width: "min(460px, 100%)",
  maxHeight: "100%",     // never taller than the window body (overlay is body-sized now)
  minHeight: 0,
  background: "var(--wb-white)",
  border: "2px solid var(--wb-black)",
  padding: 8,
  boxShadow: "6px 6px 0 var(--wb-black)",
  display: "flex",
  flexDirection: "column",
  position: "relative",
};
const lightboxImg: React.CSSProperties = {
  width: "100%",
  flex: "1 1 auto",      // fill the space left by the caption row, shrink to fit
  minHeight: 0,          // required so object-fit can scale down inside the flex column
  objectFit: "contain",  // show the whole image, whatever its size/aspect ratio
  border: "1px solid var(--wb-black)",
  background: "var(--wb-black)",
};
const actionBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  lineHeight: 1,
  padding: "4px 10px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  cursor: "pointer",
  color: "var(--wb-black)",
};
const navBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 17,
  lineHeight: 1,
  padding: "2px 8px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  cursor: "pointer",
  color: "var(--wb-black)",
};
const empty: React.CSSProperties = {
  padding: 12,
  fontSize: 15,
  opacity: 0.75,
  lineHeight: 1.6,
  fontFamily: "var(--wb-font)",
};

/* ---- phone overrides: spread over the desktop objects above ----------- */
const tabPhone: React.CSSProperties = { minHeight: 44, padding: "0 14px", fontSize: 15 };
// Two columns at 360px: ~165px tiles keep the 4:3 thumbnails readable.
const gridPhone: React.CSSProperties = { gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 6, padding: 2 };
const captionPhone: React.CSSProperties = { fontSize: 14 };
// The lightbox takes the whole frame: a dark stage, the image as large as it
// fits, controls along the bottom. Vertical drags stay the browser's
// (touch-action: pan-y); sideways ones are the swipe.
const overlayPhone: React.CSSProperties = { background: "var(--wb-black)", placeItems: "stretch" };
const lightboxPanelPhone: React.CSSProperties = {
  width: "100%",
  height: "100%",
  padding: 6,
  border: "none",
  boxShadow: "none",
};
const lightboxImgPhone: React.CSSProperties = { touchAction: "pan-y", border: "none" };
const metaRowPhone: React.CSSProperties = { flexWrap: "wrap", gap: 8, fontSize: 15 };
const controlsPhone: React.CSSProperties = { gap: 6, flexWrap: "wrap" };
const btnPhone: React.CSSProperties = { minWidth: 44, minHeight: 44, fontSize: 18 };

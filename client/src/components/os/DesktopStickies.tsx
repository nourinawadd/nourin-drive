"use client";

import { useEffect } from "react";
import { Rnd } from "react-rnd";
import { useStickyStore } from "@/context/stickyStore";

// Loose sticky notes on the desktop - draggable by their top grip, editable
// in place, sit below windows (zIndex 1). Replaces the old "clippings".
export function DesktopStickies() {
  const notes = useStickyStore((s) => s.notes);
  const update = useStickyStore((s) => s.update);
  const move = useStickyStore((s) => s.move);
  const remove = useStickyStore((s) => s.remove);
  const reflow = useStickyStore((s) => s.reflow);

  // The seeds are laid out against a fallback width; snap them to the real one.
  useEffect(() => reflow(window.innerWidth), [reflow]);

  // "Clean Up" tidies notes back into the band, same as it does the drives.
  useEffect(() => {
    const onCleanup = () => reflow(window.innerWidth);
    window.addEventListener("wb:cleanup-icons", onCleanup);
    return () => window.removeEventListener("wb:cleanup-icons", onCleanup);
  }, [reflow]);

  return (
    <>
      {notes.map((n) => (
        <Rnd
          key={n.id}
          size={{ width: 156, height: 148 }}
          position={{ x: n.x, y: n.y }}
          enableResizing={false}
          bounds="parent"
          dragHandleClassName="wb-sticky-grip"
          cancel=".wb-sticky-del"
          style={{ zIndex: 1 }}
          onDragStop={(_e, d) => move(n.id, d.x, d.y)}
        >
          <div style={{ ...card, background: n.color, transform: `rotate(${n.rotate}deg)` }}>
            <div className="wb-sticky-grip" style={grip}>
              <span style={{ fontSize: 11, opacity: 0.55, letterSpacing: 2 }}>&#8226;&#8226;&#8226;</span>
              <button
                type="button"
                className="wb-sticky-del"
                aria-label="Delete note"
                title="Delete note"
                onClick={() => remove(n.id)}
                style={del}
              >
                &times;
              </button>
            </div>
            <textarea
              value={n.text}
              onChange={(e) => update(n.id, e.target.value)}
              placeholder="Type a note…"
              spellCheck={false}
              style={ta}
            />
          </div>
        </Rnd>
      ))}
    </>
  );
}

const card: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  border: "1px solid var(--wb-black)",
  boxShadow: "3px 3px 0 rgba(0, 0, 0, 0.35)",
  fontFamily: "var(--wb-font)",
};
const grip: React.CSSProperties = {
  height: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 4px",
  cursor: "grab",
  borderBottom: "1px solid rgba(0, 0, 0, 0.25)",
  color: "var(--wb-black)",
};
const del: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontFamily: "var(--wb-font)",
  fontSize: 15,
  lineHeight: 1,
  color: "var(--wb-black)",
  padding: "0 2px",
};
const ta: React.CSSProperties = {
  flex: 1,
  width: "100%",
  resize: "none",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "var(--wb-black)",
  fontFamily: "var(--wb-font)",
  fontSize: 13,
  lineHeight: 1.25,
  padding: 6,
};

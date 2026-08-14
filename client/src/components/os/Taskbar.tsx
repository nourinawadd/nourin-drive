"use client";

import { useWindowStore } from "@/context/windowStore";
import { STAND_LEFT, STAND_WIDTH } from "@/components/os/GuestbookStand";

// Shows minimized windows as restore chips, bottom-left so it doesn't
// collide with the centered dock.
export function Taskbar() {
  const windows = useWindowStore((s) => s.windows);
  const restore = useWindowStore((s) => s.restore);
  const minimized = windows.filter((w) => w.minimized);

  if (minimized.length === 0) return null;

  return (
    <div className="wb-taskbar" style={wrap}>
      {minimized.map((w) => (
        <button key={w.id} onClick={() => restore(w.id)} style={chip} title={`Restore ${w.title}`}>
          <span style={dot} />
          <span style={label}>{w.title}</span>
        </button>
      ))}
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: "fixed",
  // Starts clear of the guestbook stand, which occupies the bottom-left corner.
  // Derived from the stand's own constants so the two can't drift apart.
  left: STAND_LEFT + STAND_WIDTH + 12,
  // `bottom` deliberately lives in .wb-taskbar (workbench.css) instead of here:
  // an inline value would outrank the class and the tray could never slide it.
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  maxWidth: "45vw",
  zIndex: 900, // floats above windows (incl. a maximized one), below the menu bar
};
const chip: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  maxWidth: 240,
  minHeight: 40,
  padding: "8px 16px",
  fontFamily: "var(--wb-font)",
  fontSize: 15,
  color: "var(--wb-black)",
  background: "var(--wb-gray)",
  border: "2px solid var(--wb-black)",
  boxShadow:
    "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2), 4px 4px 0 rgba(0, 0, 0, 0.28)",
  cursor: "pointer",
};
const dot: React.CSSProperties = {
  width: 14,
  height: 14,
  background: "var(--wb-orange)",
  border: "1px solid var(--wb-black)",
  flexShrink: 0,
};
const label: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

"use client";

import { useWindowStore } from "@/context/windowStore";

// Shows minimized windows as restore chips, bottom-left so it doesn't
// collide with the centered dock.
export function Taskbar() {
  const windows = useWindowStore((s) => s.windows);
  const restore = useWindowStore((s) => s.restore);
  const minimized = windows.filter((w) => w.minimized);

  if (minimized.length === 0) return null;

  return (
    <div style={wrap}>
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
  left: 8,
  bottom: 8,
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
  maxWidth: "40vw",
  zIndex: 2,
};
const chip: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  maxWidth: 160,
  padding: "2px 8px",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
  cursor: "pointer",
};
const dot: React.CSSProperties = {
  width: 8,
  height: 8,
  background: "var(--wb-orange)",
  border: "1px solid var(--wb-black)",
  flexShrink: 0,
};
const label: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

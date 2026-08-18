"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type MenuItem =
  | { kind: "separator" }
  | {
      kind: "item";
      label: string;
      onSelect?: () => void;
      disabled?: boolean;
      /** Rendered right-aligned, e.g. a checkmark for the active view mode. */
      hint?: string;
    };

type Props = {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
};

/**
 * Right-click menu, positioned in viewport coordinates. Renders in place (not a
 * portal) with a high z-index so it escapes the window body's overflow, and
 * flips itself when it would open past the viewport edge.
 */
export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // Measure after paint so the clamp uses the real size, not a guess.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const pad = 4;
    setPos({
      x: x + width > window.innerWidth - pad ? Math.max(pad, x - width) : x,
      y: y + height > window.innerHeight - pad ? Math.max(pad, y - height) : y,
    });
  }, [x, y]);

  useEffect(() => {
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    // pointerdown beats click, so the menu closes before the click lands on
    // whatever is underneath it.
    window.addEventListener("pointerdown", close);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    // Capture phase: catches scrolling inside the window body too.
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      style={{ ...menu, left: pos.x, top: pos.y }}
      // Keep clicks inside from reaching the window-level close listener.
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item.kind === "separator" ? (
          <div key={`sep-${i}`} style={separator} />
        ) : (
          <button
            key={item.label}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => { item.onSelect?.(); onClose(); }}
            style={{ ...menuItem, opacity: item.disabled ? 0.4 : 1 }}
            onMouseEnter={(e) => {
              if (item.disabled) return;
              e.currentTarget.style.background = "var(--wb-orange)";
            }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <span>{item.label}</span>
            {item.hint && <span style={{ marginLeft: 16, opacity: 0.7 }}>{item.hint}</span>}
          </button>
        ),
      )}
    </div>
  );
}

const menu: React.CSSProperties = {
  position: "fixed",
  zIndex: 10000,
  minWidth: 140,
  padding: 1,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3), 2px 2px 0 rgba(0,0,0,0.35)",
  fontFamily: "var(--wb-font)",
  fontSize: 13,
  userSelect: "none",
};
const menuItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  padding: "3px 10px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
  fontSize: "inherit",
  color: "var(--wb-black)",
};
const separator: React.CSSProperties = {
  height: 0,
  margin: "3px 2px",
  borderTop: "1px solid var(--wb-gray-3)",
  borderBottom: "1px solid var(--wb-white)",
};

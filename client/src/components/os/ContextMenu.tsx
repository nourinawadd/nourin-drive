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
    }
  | { kind: "submenu"; label: string; items: MenuItem[]; disabled?: boolean };

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
      <MenuItems items={items} onClose={onClose} />
    </div>
  );
}

function MenuItems({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  return (
    <>
      {items.map((item, i) => {
        if (item.kind === "separator") return <div key={`sep-${i}`} style={separator} />;
        if (item.kind === "submenu") {
          return (
            <SubMenu
              key={item.label}
              label={item.label}
              items={item.items}
              disabled={item.disabled}
              onClose={onClose}
            />
          );
        }
        return (
          <MenuRow
            key={item.label}
            label={item.label}
            hint={item.hint}
            disabled={item.disabled}
            onClick={() => { item.onSelect?.(); onClose(); }}
          />
        );
      })}
    </>
  );
}

type RowProps = {
  label: string;
  hint?: string;
  disabled?: boolean;
  active?: boolean;
  expanded?: boolean;
  rowRef?: React.Ref<HTMLButtonElement>;
  onClick?: () => void;
  onMouseEnter?: () => void;
};

function MenuRow({
  label, hint, disabled, active, expanded, rowRef, onClick, onMouseEnter,
}: RowProps) {
  return (
    <button
      ref={rowRef}
      role="menuitem"
      disabled={disabled}
      aria-haspopup={expanded === undefined ? undefined : "menu"}
      aria-expanded={expanded}
      onClick={onClick}
      style={{
        ...menuItem,
        opacity: disabled ? 0.4 : 1,
        background: active ? "var(--wb-orange)" : "transparent",
      }}
      onMouseEnter={(e) => {
        onMouseEnter?.();
        if (disabled) return;
        e.currentTarget.style.background = "var(--wb-orange)";
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span>{label}</span>
      {hint && <span style={{ marginLeft: 16, opacity: 0.7 }}>{hint}</span>}
    </button>
  );
}

function SubMenu({
  label, items, disabled, onClose,
}: {
  label: string;
  items: MenuItem[];
  disabled?: boolean;
  onClose: () => void;
}) {
  const rowRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  function openAt() {
    if (disabled) return;
    const r = rowRef.current?.getBoundingClientRect();
    if (r) setPos({ x: r.right - 2, y: r.top - 1 });
    setOpen(true);
  }

  useLayoutEffect(() => {
    if (!open) return;
    const row = rowRef.current;
    const panel = panelRef.current;
    if (!row || !panel) return;
    const r = row.getBoundingClientRect();
    const { width, height } = panel.getBoundingClientRect();
    const pad = 4;
    setPos({
      x: r.right - 2 + width > window.innerWidth - pad
        ? Math.max(pad, r.left - width + 2)
        : r.right - 2,
      y: r.top - 1 + height > window.innerHeight - pad
        ? Math.max(pad, window.innerHeight - pad - height)
        : r.top - 1,
    });
  }, [open]);

  return (
    <div onMouseLeave={() => setOpen(false)}>
      <MenuRow
        label={label}
        hint="&#9656;"
        disabled={disabled}
        active={open}
        expanded={open}
        rowRef={rowRef}
        onClick={() => (open ? setOpen(false) : openAt())}
        onMouseEnter={openAt}
      />
      {open && (
        <div
          ref={panelRef}
          role="menu"
          style={{ ...menu, left: pos.x, top: pos.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <MenuItems items={items} onClose={onClose} />
        </div>
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

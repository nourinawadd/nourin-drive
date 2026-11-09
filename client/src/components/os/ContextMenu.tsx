"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useShellMode } from "@/components/os/ShellModeProvider";

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
 * The context menu, in whichever form suits the shell. Callers pass the same
 * props either way: on the desktop it floats at the pointer exactly as it always
 * has; on a phone it becomes an action sheet along the bottom, which a thumb can
 * reach and which never has to flip away from an edge. While the mode is still
 * unknown, and outside a ShellModeProvider (tests, mostly), it's the desktop
 * menu.
 */
export function ContextMenu(props: Props) {
  const mode = useShellMode();
  return mode === "phone" ? <ActionSheet {...props} /> : <FloatingMenu {...props} />;
}

/**
 * Right-click menu, positioned in viewport coordinates. Renders in place (not a
 * portal) with a high z-index so it escapes the window body's overflow, and
 * flips itself when it would open past the viewport edge.
 */
function FloatingMenu({ x, y, items, onClose }: Props) {
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

/* ------- phone: action sheet ------------------------------------------ */

/**
 * The phone presentation: the same items as a sheet pinned to the bottom over a
 * dimmed backdrop. Its close rules differ from the floating menu's on purpose:
 * on a phone the address bar collapsing fires `resize`, and scrolling a long
 * sheet fires `scroll` inside the sheet itself, so either would snatch it away
 * mid-reach. It closes on a backdrop tap, Escape, or picking an item.
 *
 * The backdrop closes on `click`, and only for a press that began on the
 * backdrop. Closing on pointerdown would let the lifting finger's click land on
 * whatever sits under the sheet (a ghost tap); and the long press that opened
 * the sheet is still down when it mounts, so its own release must not count.
 */
function ActionSheet({ items, onClose }: Props) {
  const downOnBackdrop = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={sheetBackdrop}
      onPointerDown={(e) => { downOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={(e) => {
        if (e.target !== e.currentTarget || !downOnBackdrop.current) return;
        downOnBackdrop.current = false;
        onClose();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div role="menu" style={sheet}>
        <SheetItems items={items} onClose={onClose} />
      </div>
    </div>
  );
}

function SheetItems({ items, onClose, nested = false }: {
  items: MenuItem[];
  onClose: () => void;
  nested?: boolean;
}) {
  return (
    <>
      {items.map((item, i) => {
        if (item.kind === "separator") return <div key={`sep-${i}`} style={sheetSeparator} />;
        if (item.kind === "submenu") {
          return <SheetSubMenu key={item.label} item={item} onClose={onClose} />;
        }
        return (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            style={{ ...sheetRow, ...(nested ? sheetRowNested : null), opacity: item.disabled ? 0.4 : 1 }}
            onClick={() => { item.onSelect?.(); onClose(); }}
          >
            <span>{item.label}</span>
            {item.hint && <span style={{ opacity: 0.7 }}>{item.hint}</span>}
          </button>
        );
      })}
    </>
  );
}

// No flyouts on a phone: there's no room beside the sheet and no hover to open
// them with, so a submenu folds its items open in place underneath its row.
function SheetSubMenu({ item, onClose }: {
  item: Extract<MenuItem, { kind: "submenu" }>;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={item.disabled}
        style={{ ...sheetRow, opacity: item.disabled ? 0.4 : 1 }}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{item.label}</span>
        <span style={{ opacity: 0.7 }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div role="menu">
          <SheetItems items={item.items} onClose={onClose} nested />
        </div>
      )}
    </>
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

// Phone sheet. Rows are 44px or more and 16px text: the smallest a thumb hits
// reliably, and the size iOS reads without zooming.
const sheetBackdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  background: "rgba(0,0,0,0.35)",
  touchAction: "manipulation",
};
const sheet: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  maxHeight: "70%",
  overflowY: "auto",
  overscrollBehavior: "contain",
  padding: "4px 0 calc(8px + env(safe-area-inset-bottom))",
  background: "var(--wb-gray)",
  borderTop: "1px solid var(--wb-black)",
  boxShadow: "inset 0 1px 0 var(--wb-white)",
  fontFamily: "var(--wb-font)",
  fontSize: 16,
  userSelect: "none",
};
const sheetRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  width: "100%",
  minHeight: 48,
  padding: "0 18px",
  border: "none",
  borderBottom: "1px solid var(--wb-gray-2)",
  background: "transparent",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
  fontSize: "inherit",
  color: "var(--wb-black)",
};
const sheetRowNested: React.CSSProperties = {
  paddingLeft: 36,
  background: "var(--wb-gray-0)",
};
const sheetSeparator: React.CSSProperties = {
  height: 0,
  margin: "6px 0",
  borderTop: "1px solid var(--wb-gray-3)",
  borderBottom: "1px solid var(--wb-white)",
};

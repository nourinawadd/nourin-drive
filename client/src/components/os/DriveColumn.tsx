"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentType, MouseEvent as ReactMouseEvent } from "react";
import { useWindowStore } from "@/context/windowStore";
import { useStickyStore } from "@/context/stickyStore";
import type { AppId } from "@/types/window";
import {
  IconFloppyUser,
  IconDrawer,
  IconFloppyJoystick,
  IconFloppyPhoto,
  IconFloppyNotepad,
  IconFloppyQuill,
  IconFloppyMusic,
  IconFloppyStickies,
  IconTrashcan,
} from "@/components/os/icons";

// `appId` opens an app window; a drive without one (Notes) runs a custom
// action on open instead — handled in the double-click below.
const DRIVES: { id: string; label: string; appId?: AppId; Icon: ComponentType }[] = [
  { id: "work",      label: "User:",      appId: "profile",   Icon: IconFloppyUser },
  { id: "projects",  label: "Projects:",  appId: "explorer",  Icon: IconDrawer },
  { id: "games",     label: "Games:",     appId: "games",     Icon: IconFloppyJoystick },
  { id: "photos",    label: "Photos:",    appId: "gallery",   Icon: IconFloppyPhoto },
  { id: "blog",      label: "Blog:",      appId: "blog",      Icon: IconFloppyNotepad },
  { id: "guestbook", label: "Guestbook:", appId: "guestbook", Icon: IconFloppyQuill },
  { id: "music",     label: "Music:",     appId: "music",     Icon: IconFloppyMusic },
  { id: "stickies",  label: "Notes:",     Icon: IconFloppyStickies },
  { id: "trash",     label: "Trash:",     appId: "recycle",   Icon: IconTrashcan },
];

type Pos = { x: number; y: number };

// Starting layout — a column down the RIGHT edge. x depends on viewport
// width, so render with an SSR-safe fallback and snap to the real edge in an
// effect (unconditional render — never gated, so icons can't disappear).
const ICON_W = 120;          // matches .wb-drive width
const COL_GAP = 8;
const RIGHT_MARGIN = 16;
const COL_TOP = 32;          // clears the 18px menu bar
const COL_STEP = 118;        // 80px icon + 6px gap + label, plus breathing room
const BOTTOM_RESERVE = 130;  // keeps the last icon clear of the dock
const FALLBACK_W = 1280;
const FALLBACK_H = 800;

// Lay the volumes out down the RIGHT edge, wrapping into a second column (and
// a third, etc.) once a column would run past the bottom of the screen. All
// nine drives stacked in one column overflowed any normal viewport, hiding the
// last few behind the dock.
function rightColumn(viewportW: number, viewportH: number): Record<string, Pos> {
  const usable = Math.max(COL_STEP, viewportH - COL_TOP - BOTTOM_RESERVE);
  const perCol = Math.max(1, Math.floor(usable / COL_STEP));
  return Object.fromEntries(
    DRIVES.map((d, i) => {
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      const x = Math.max(
        RIGHT_MARGIN,
        viewportW - RIGHT_MARGIN - (col + 1) * ICON_W - col * COL_GAP,
      );
      return [d.id, { x, y: COL_TOP + row * COL_STEP }];
    }),
  );
}

// Each volume is independently positioned: dragging one moves only that icon,
// the rest stay exactly where they are.
export function DriveColumn() {
  const openApp = useWindowStore((s) => s.openApp);
  const addSticky = useStickyStore((s) => s.add);
  const [selected, setSelected] = useState<string | null>(null);
  const [pos, setPos] = useState<Record<string, Pos>>(() =>
    rightColumn(FALLBACK_W, FALLBACK_H),
  );
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  // Snap the column to the real right edge once we know the viewport width.
  useEffect(() => setPos(rightColumn(window.innerWidth, window.innerHeight)), []);

  // "Clean Up" from the Icons menu re-snaps every icon to the right column.
  useEffect(() => {
    const onCleanup = () => setPos(rightColumn(window.innerWidth, window.innerHeight));
    window.addEventListener("wb:cleanup-icons", onCleanup);
    return () => window.removeEventListener("wb:cleanup-icons", onCleanup);
  }, []);

  function startDrag(e: ReactMouseEvent, id: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    drag.current = { id, dx: e.clientX - rect.left, dy: e.clientY - rect.top };

    const onMove = (ev: globalThis.MouseEvent) => {
      const d = drag.current;
      if (!d) return;
      setPos((p) => ({ ...p, [d.id]: { x: ev.clientX - d.dx, y: ev.clientY - d.dy } }));
    };
    const onUp = () => {
      drag.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <>
      {DRIVES.map((d) => (
        <div
          key={d.id}
          className={`wb-drive${selected === d.id ? " is-selected" : ""}`}
          style={{ left: pos[d.id].x, top: pos[d.id].y }}
          onMouseDown={(e) => startDrag(e, d.id)}
          onClick={() => setSelected(d.id)}
          onDoubleClick={() => (d.appId ? openApp(d.appId) : addSticky())}
        >
          <div className="wb-drive-icon">
            <d.Icon />
          </div>
          <div className="wb-drive-label">{d.label}</div>
        </div>
      ))}
    </>
  );
}

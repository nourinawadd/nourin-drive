"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentType, MouseEvent as ReactMouseEvent } from "react";
import { useWindowStore } from "@/context/windowStore";
import { useStickyStore } from "@/context/stickyStore";
import { playSfx } from "@/lib/sfx";
import { STAND_RESERVE } from "@/components/os/GuestbookStand";
import type { AppId } from "@/types/window";
import {
  IconFloppyUser,
  IconFloppySystem,
  IconDrawer,
  IconFloppyTerminal,
  IconFloppyJoystick,
  IconFloppyPhoto,
  IconFloppyNotepad,
  IconFloppyBook,
  IconFloppyQuill,
  IconFloppyMusic,
  IconFloppyGlobe,
  IconFloppyStickies,
  IconTrashcan,
} from "@/components/os/icons";

// Every app that makes sense to launch cold gets a volume. The two that
// don't: `game` and `properties` only exist once something hands them a
// payload.
//
// `appId` opens an app window; a drive without one (Sticky Notes) runs a custom
// action on open instead - handled in the double-click below.
const DRIVES: { id: string; label: string; appId?: AppId; Icon: ComponentType }[] = [
  { id: "readme",    label: "Start Here:", appId: "readme",   Icon: IconFloppySystem },
  { id: "work",      label: "User:",      appId: "profile",   Icon: IconFloppyUser },
  { id: "projects",  label: "Projects:",  appId: "explorer",  Icon: IconDrawer },
  { id: "apis",      label: "APIs:",      appId: "apis",      Icon: IconFloppyTerminal },
  { id: "games",     label: "Games:",     appId: "games",     Icon: IconFloppyJoystick },
  { id: "photos",    label: "Photos:",    appId: "gallery",   Icon: IconFloppyPhoto },
  { id: "blog",      label: "Blog:",      appId: "blog",      Icon: IconFloppyNotepad },
  { id: "library",   label: "Library:",   appId: "ereader",   Icon: IconFloppyBook },
  { id: "guestbook", label: "Guestbook:", appId: "guestbook", Icon: IconFloppyQuill },
  { id: "music",     label: "Music:",     appId: "music",     Icon: IconFloppyMusic },
  { id: "browser",   label: "Browser:",   appId: "browser",   Icon: IconFloppyGlobe },
  { id: "stickies",  label: "Sticky Notes:", Icon: IconFloppyStickies },
  // TODO(art): borrowing the drawer until Prefs gets its own volume icon.
  { id: "prefs",     label: "Prefs:",     appId: "prefs",     Icon: IconDrawer },
  { id: "trash",     label: "Trash:",     appId: "recycle",   Icon: IconTrashcan },
];

type Pos = { x: number; y: number };

// Starting layout - a column down the LEFT edge, Windows-style. x no longer
// depends on viewport width, but the snap effect stays: viewport HEIGHT still
// decides how many icons fit per column before it wraps.
const ICON_W = 120;          // matches .wb-drive width
const COL_GAP = 8;
const LEFT_MARGIN = 16;
const COL_TOP = 32;          // clears the 18px menu bar
const COL_STEP = 118;        // 80px icon + 6px gap + label, plus breathing room
const BOTTOM_RESERVE = STAND_RESERVE;  // keeps the last icon clear of the guestbook stand
const FALLBACK_W = 1280;
const FALLBACK_H = 800;

// Lay the volumes out down the LEFT edge, wrapping into a second column (and a
// third, etc.) once a column would run past the bottom of the screen. The
// bottom stop is the guestbook stand, which owns the bottom-left corner.
function leftColumn(viewportW: number, viewportH: number): Record<string, Pos> {
  const usable = Math.max(COL_STEP, viewportH - COL_TOP - BOTTOM_RESERVE);
  const perCol = Math.max(1, Math.floor(usable / COL_STEP));
  return Object.fromEntries(
    DRIVES.map((d, i) => {
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      const x = Math.min(
        LEFT_MARGIN + col * (ICON_W + COL_GAP),
        Math.max(LEFT_MARGIN, viewportW - LEFT_MARGIN - ICON_W),
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
    leftColumn(FALLBACK_W, FALLBACK_H),
  );
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  // Re-snap once the real viewport height is known: it sets the wrap point.
  useEffect(() => setPos(leftColumn(window.innerWidth, window.innerHeight)), []);

  // "Clean Up" from the Icons menu re-snaps every icon to the left column.
  useEffect(() => {
    const onCleanup = () => setPos(leftColumn(window.innerWidth, window.innerHeight));
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
          onClick={() => {
            if (selected !== d.id) playSfx("select");
            setSelected(d.id);
          }}
          onDoubleClick={() => {
            playSfx("launch");
            if (d.appId) openApp(d.appId);
            else addSticky();
          }}
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

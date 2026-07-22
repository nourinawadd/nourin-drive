"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentType, MouseEvent as ReactMouseEvent } from "react";
import { useWindowStore } from "@/context/windowStore";
import type { AppId } from "@/types/window";
import {
  IconFloppyUser,
  IconDrawer,
  IconFloppyJoystick,
  IconFloppyPhoto,
  IconFloppyNotepad,
  IconFloppyQuill,
  IconFloppyMusic,
  IconTrashcan,
} from "@/components/os/icons";

const DRIVES: { id: string; label: string; appId: AppId; Icon: ComponentType }[] = [
  { id: "work",      label: "User:",      appId: "profile",   Icon: IconFloppyUser },
  { id: "projects",  label: "Projects:",  appId: "explorer",  Icon: IconDrawer },
  { id: "games",     label: "Games:",     appId: "games",     Icon: IconFloppyJoystick },
  { id: "photos",    label: "Photos:",    appId: "gallery",   Icon: IconFloppyPhoto },
  { id: "blog",      label: "Blog:",      appId: "blog",      Icon: IconFloppyNotepad },
  { id: "guestbook", label: "Guestbook:", appId: "guestbook", Icon: IconFloppyQuill },
  { id: "music",     label: "Music:",     appId: "music",     Icon: IconFloppyMusic },
  { id: "trash",     label: "Trash:",     appId: "recycle",   Icon: IconTrashcan },
];

type Pos = { x: number; y: number };

// Starting layout — a column down the RIGHT edge. x depends on viewport
// width, so render with an SSR-safe fallback and snap to the real edge in an
// effect (unconditional render — never gated, so icons can't disappear).
const ICON_W = 104;
const RIGHT_MARGIN = 16;
const COL_TOP = 40;
const COL_STEP = 110;
const FALLBACK_W = 1280;

function rightColumn(viewportW: number): Record<string, Pos> {
  const x = Math.max(RIGHT_MARGIN, viewportW - ICON_W - RIGHT_MARGIN);
  return Object.fromEntries(
    DRIVES.map((d, i) => [d.id, { x, y: COL_TOP + i * COL_STEP }]),
  );
}

// Each volume is independently positioned: dragging one moves only that icon,
// the rest stay exactly where they are.
export function DriveColumn() {
  const openApp = useWindowStore((s) => s.openApp);
  const [selected, setSelected] = useState<string | null>(null);
  const [pos, setPos] = useState<Record<string, Pos>>(() => rightColumn(FALLBACK_W));
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  // Snap the column to the real right edge once we know the viewport width.
  useEffect(() => setPos(rightColumn(window.innerWidth)), []);

  // "Clean Up" from the Icons menu re-snaps every icon to the right column.
  useEffect(() => {
    const onCleanup = () => setPos(rightColumn(window.innerWidth));
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
          onDoubleClick={() => openApp(d.appId)}
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

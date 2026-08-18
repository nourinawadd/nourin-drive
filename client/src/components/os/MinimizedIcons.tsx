"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useWindowStore } from "@/context/windowStore";
import { APP_ICONS } from "@/data/appIcons";
import { playSfx } from "@/lib/sfx";


type Placed = { slot: number; x: number; y: number };

const CELL_W = 76;
const RIGHT_MARGIN = 16;
const BOTTOM_RESERVE = 130;
const COL_GAP = 8;
const COL_TOP = 32;
const COL_STEP = 100;

function slotPos(slot: number, viewportW: number, viewportH: number) {
  const usable = Math.max(COL_STEP, viewportH - COL_TOP - BOTTOM_RESERVE);
  const perCol = Math.max(1, Math.floor(usable / COL_STEP));
  const col = Math.floor(slot / perCol);
  const row = slot % perCol;
  return {
    x: Math.max(RIGHT_MARGIN, viewportW - RIGHT_MARGIN - (col + 1) * CELL_W - col * COL_GAP),
    y: COL_TOP + row * COL_STEP,
  };
}

export function MinimizedIcons() {
  const windows = useWindowStore((s) => s.windows);
  const restore = useWindowStore((s) => s.restore);
  const [placed, setPlaced] = useState<Record<string, Placed>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const minimized = windows.filter((w) => w.minimized);

  useEffect(() => {
    const live = windows.filter((w) => w.minimized).map((w) => w.id);
    setPlaced((prev) => {
      const unchanged =
        live.length === Object.keys(prev).length && live.every((id) => prev[id]);
      if (unchanged) return prev;

      const next: Record<string, Placed> = {};
      const taken = new Set<number>();
      for (const id of live) {
        const seat = prev[id];
        if (seat) {
          next[id] = seat;
          taken.add(seat.slot);
        }
      }
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (const id of live) {
        if (next[id]) continue;
        let slot = 0;
        while (taken.has(slot)) slot += 1;
        taken.add(slot);
        next[id] = { slot, ...slotPos(slot, w, h) };
      }
      return next;
    });
  }, [windows]);

  useEffect(() => {
    const onCleanup = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setPlaced((prev) => {
        const next: Record<string, Placed> = {};
        Object.keys(prev)
          .sort((a, b) => prev[a].slot - prev[b].slot)
          .forEach((id, i) => {
            next[id] = { slot: i, ...slotPos(i, w, h) };
          });
        return next;
      });
    };
    window.addEventListener("wb:cleanup-icons", onCleanup);
    return () => window.removeEventListener("wb:cleanup-icons", onCleanup);
  }, []);

  function startDrag(e: ReactMouseEvent, id: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    drag.current = { id, dx: e.clientX - rect.left, dy: e.clientY - rect.top };

    const onMove = (ev: globalThis.MouseEvent) => {
      const d = drag.current;
      if (!d) return;
      setPlaced((p) =>
        p[d.id]
          ? { ...p, [d.id]: { ...p[d.id], x: ev.clientX - d.dx, y: ev.clientY - d.dy } }
          : p,
      );
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
      {minimized.map((w) => {
        const seat = placed[w.id];
        if (!seat) return null;
        const Icon = APP_ICONS[w.appId];
        return (
          <div
            key={w.id}
            className={`wb-minicon${selected === w.id ? " is-selected" : ""}`}
            style={{ left: seat.x, top: seat.y }}
            title={`Restore ${w.title}`}
            onMouseDown={(e) => startDrag(e, w.id)}
            onClick={() => {
              if (selected !== w.id) playSfx("select");
              setSelected(w.id);
            }}
            onDoubleClick={() => restore(w.id)}
          >
            <div className="wb-minicon-tile">
              <Icon />
            </div>
            <div className="wb-minicon-label">{w.title}</div>
          </div>
        );
      })}
    </>
  );
}

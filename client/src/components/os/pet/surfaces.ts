import { APP_REGISTRY } from "@/data/appRegistry";
import { MENUBAR_H } from "@/lib/windowBounds";
import { SPRITE_SIZE } from "./poses";
import type { WindowInstance } from "@/types/window";

export type Surface = { id: string; top: number; bottom: number; left: number; right: number };

export type Rect = { top: number; bottom: number; left: number; right: number };

export const FLOOR_ID = "floor";
export const DOCK_ID = "dock";

const WINDOW_BORDER = 1;
const MIN_SPAN = SPRITE_SIZE;

type Input = {
  windows: WindowInstance[];
  vw: number;
  vh: number;
  dock: Rect | null;
  dragging: string | null;
};

export function buildSurfaces({ windows, vw, vh, dock, dragging }: Input): Surface[] {
  const out: Surface[] = [{ id: FLOOR_ID, top: vh, bottom: vh, left: 0, right: vw }];

  if (dock) {
    out.push({ id: DOCK_ID, top: dock.top, bottom: dock.bottom, left: dock.left, right: dock.right });
  }

  for (const win of windows) {
    if (win.minimized) continue;
    if (win.id === dragging) continue;

    if (win.maximized) {
      out.push({
        id: win.id,
        top: MENUBAR_H + WINDOW_BORDER,
        bottom: MENUBAR_H + maximizedHeight(win.appId, vh),
        left: 0,
        right: vw,
      });
      continue;
    }
    out.push({
      id: win.id,
      top: win.y + WINDOW_BORDER,
      bottom: win.y + win.height,
      left: win.x,
      right: win.x + win.width,
    });
  }

  return out
    .filter((s) => s.top < vh || s.id === FLOOR_ID)
    .filter((s) => s.right - s.left >= MIN_SPAN)
    .sort((a, b) => a.top - b.top);
}

export function maximizedHeight(appId: WindowInstance["appId"], vh: number): number {
  const def = APP_REGISTRY[appId];
  return Math.max(def.minHeight ?? 140, vh - MENUBAR_H);
}

export function findSurface(surfaces: Surface[], id: string | null): Surface | null {
  if (!id) return null;
  return surfaces.find((s) => s.id === id) ?? null;
}

export function supports(surface: Surface, x: number): boolean {
  return x >= surface.left && x <= surface.right;
}

export function landingBelow(
  surfaces: Surface[],
  x: number,
  fromY: number,
  toY: number,
  exclude: string | null = null,
): Surface | null {
  let best: Surface | null = null;
  for (const s of surfaces) {
    if (s.id === exclude) continue;
    if (!supports(s, x)) continue;
    if (s.top < fromY) continue;
    if (s.top > toY) continue;
    if (!best || s.top < best.top) best = s;
  }
  return best;
}

export function readDockRect(): Rect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(".wb-dock");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
}

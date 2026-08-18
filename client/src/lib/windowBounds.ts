import type { AppDef } from "@/types/window";

export const MENUBAR_H = 18;

const WIDTH_RATIO = 0.78;
const HEIGHT_RATIO = 0.8;
const ORIGIN_X_RATIO = 0.075;
const ORIGIN_Y_RATIO = 0.035;

const EDGE_MARGIN = 16;
const CASCADE_STEP = 20;
const CASCADE_WRAP = 5;

const FALLBACK_W = 1280;
const FALLBACK_H = 800;

const MIN_W = 240;
const MIN_H = 140;

function clamp(lo: number, value: number, hi: number) {
  return Math.min(Math.max(value, lo), Math.max(lo, hi));
}

export function viewportSize() {
  if (typeof window === "undefined") return { w: FALLBACK_W, h: FALLBACK_H };
  return { w: window.innerWidth, h: window.innerHeight };
}

export function defaultSize(def: Pick<AppDef, "minWidth" | "minHeight">) {
  const { w: vw, h: vh } = viewportSize();
  const usableH = Math.max(1, vh - MENUBAR_H);
  return {
    width: clamp(def.minWidth ?? MIN_W, Math.round(vw * WIDTH_RATIO), vw - EDGE_MARGIN * 2),
    height: clamp(def.minHeight ?? MIN_H, Math.round(usableH * HEIGHT_RATIO), usableH - EDGE_MARGIN),
  };
}

export function defaultBounds(def: Pick<AppDef, "minWidth" | "minHeight" | "fixed">, index: number) {
  const { w: vw, h: vh } = viewportSize();
  if (def.fixed) {
    const width = Math.min(def.fixed.width, vw - EDGE_MARGIN * 2);
    const height = Math.min(def.fixed.height, vh - MENUBAR_H - EDGE_MARGIN * 2);
    return {
      x: Math.max(EDGE_MARGIN, Math.round((vw - width) / 2)),
      y: Math.max(MENUBAR_H, MENUBAR_H + Math.round((vh - MENUBAR_H - height) / 2)),
      width,
      height,
    };
  }
  const { width, height } = defaultSize(def);
  const cascade = (index % CASCADE_WRAP) * CASCADE_STEP;
  return {
    x: clamp(EDGE_MARGIN, Math.round(vw * ORIGIN_X_RATIO) + cascade, vw - width - EDGE_MARGIN),
    y: clamp(MENUBAR_H, MENUBAR_H + Math.round(vh * ORIGIN_Y_RATIO) + cascade, vh - height - EDGE_MARGIN),
    width,
    height,
  };
}

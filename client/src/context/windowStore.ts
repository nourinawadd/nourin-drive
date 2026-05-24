import { create } from "zustand";
import { APP_REGISTRY } from "@/data/appRegistry";
import type { AppId, WindowInstance } from "@/types/window";

type State = {
  windows: WindowInstance[];
  focusedId: string | null;
  zCounter: number;
};

type Actions = {
  openApp: (appId: AppId, payload?: unknown) => string;
  closeWin: (id: string) => void;
  focus: (id: string) => void;
  updateBounds: (id: string, b: { x?: number; y?: number; width?: number; height?: number }) => void;
  sendToBack: (id: string) => void;
};

let nextId = 1;
const mkId = (appId: AppId) => `${appId}-${nextId++}`;

export const useWindowStore = create<State & Actions>((set, get) => ({
  windows: [],
  focusedId: null,
  zCounter: 1,

  openApp: (appId, payload) => {
    const def = APP_REGISTRY[appId];
    if (def.singleton) {
      const existing = get().windows.find((w) => w.appId === appId);
      if (existing) {
        get().focus(existing.id);
        return existing.id;
      }
    }
    const z = get().zCounter + 1;
    // Cascade new windows slightly so stacked opens don't perfectly overlap.
    const offset = get().windows.length * 20;
    const win: WindowInstance = {
      id: mkId(appId),
      appId,
      title: def.title,
      x: def.defaultX + offset,
      y: def.defaultY + offset,
      width: def.defaultWidth,
      height: def.defaultHeight,
      z,
      payload,
    };
    set({
      windows: [...get().windows, win],
      focusedId: win.id,
      zCounter: z,
    });
    return win.id;
  },

  closeWin: (id) =>
    set((s) => {
      const windows = s.windows.filter((w) => w.id !== id);
      const focusedId =
        s.focusedId === id
          ? windows.length
            ? windows[windows.length - 1].id
            : null
          : s.focusedId;
      return { windows, focusedId };
    }),

  focus: (id) =>
    set((s) => {
      const win = s.windows.find((w) => w.id === id);
      if (!win) return s;
      if (s.focusedId === id && win.z === s.zCounter) return s;
      const z = s.zCounter + 1;
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, z } : w)),
        focusedId: id,
        zCounter: z,
      };
    }),

  updateBounds: (id, b) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, ...b } : w)),
    })),

  // Amiga depth gadget: send-to-back. Sets z below every other window.
  sendToBack: (id) =>
    set((s) => {
      const minZ = Math.min(...s.windows.map((w) => w.z));
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, z: minZ - 1 } : w)),
        focusedId: s.windows.length > 1 ? s.windows.filter((w) => w.id !== id).slice(-1)[0]?.id ?? null : id,
      };
    }),
}));

/**
 * windowStore.ts
 * Single source of truth for the OS: open windows, focus, z-index,
 * boot state, and context menu.
 */
import { create } from "zustand";
import { AppId, WindowInstance, ContextMenuEntry } from "@/types/window";
import { APP_REGISTRY } from "@/data/appRegistry";

let _zCounter = 100;
let _instanceCounter = 0;

interface ContextMenuState {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuEntry[];
}

interface WindowStore {
  booted:  boolean;
  windows: WindowInstance[];
  ctx:     ContextMenuState;

  // ── Boot ──────────────────────────────────────────────────────────
  setBoot: (v: boolean) => void;

  // ── Window lifecycle ──────────────────────────────────────────────
  openApp:   (appId: AppId, payload?: Record<string, unknown>) => void;
  closeWin:  (id: string) => void;
  focusWin:  (id: string) => void;
  minimizeWin:(id: string) => void;
  maximizeWin:(id: string) => void;
  updateWin: (id: string, patch: Partial<WindowInstance>) => void;

  // ── Context menu ──────────────────────────────────────────────────
  openCtx:  (x: number, y: number, items: ContextMenuEntry[]) => void;
  closeCtx: () => void;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  booted:  false,
  windows: [],
  ctx:     { open: false, x: 0, y: 0, items: [] },

  // ── Boot ────────────────────────────────────────────────────────────
  setBoot: (v) => set({ booted: v }),

  // ── Open ────────────────────────────────────────────────────────────
  openApp: (appId, payload) => {
    const def = APP_REGISTRY[appId];
    if (!def) return;

    // Only one instance for singleton apps
    if (def.singleton) {
      const existing = get().windows.find((w) => w.appId === appId);
      if (existing) {
        get().focusWin(existing.id);
        // Un-minimize if it was hidden
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === existing.id ? { ...w, isMinimized: false } : w
          ),
        }));
        return;
      }
    }

    const id     = `win-${++_instanceCounter}`;
    const offset = get().windows.length * 24;
    const newWin: WindowInstance = {
      id,
      appId,
      title:      def.title,
      icon:       def.emoji,
      x:          Math.max(60, def.defaultX + offset),
      y:          Math.max(20, def.defaultY + offset),
      width:      def.defaultWidth,
      height:     def.defaultHeight,
      minWidth:   def.minWidth  ?? 300,
      minHeight:  def.minHeight ?? 200,
      isMinimized: false,
      isMaximized: false,
      isFocused:   true,
      zIndex:      ++_zCounter,
      payload,
    };

    set((s) => ({
      windows: [
        ...s.windows.map((w) => ({ ...w, isFocused: false })),
        newWin,
      ],
    }));
  },

  // ── Close ────────────────────────────────────────────────────────────
  closeWin: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  // ── Focus ────────────────────────────────────────────────────────────
  focusWin: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => ({
        ...w,
        isFocused: w.id === id,
        zIndex:    w.id === id ? ++_zCounter : w.zIndex,
      })),
    })),

  // ── Minimize ─────────────────────────────────────────────────────────
  minimizeWin: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: true, isFocused: false } : w
      ),
    })),

  // ── Maximize toggle ──────────────────────────────────────────────────
  maximizeWin: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    })),

  // ── Patch ────────────────────────────────────────────────────────────
  updateWin: (id, patch) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    })),

  // ── Context menu ─────────────────────────────────────────────────────
  openCtx: (x, y, items) => set({ ctx: { open: true, x, y, items } }),
  closeCtx: ()           => set((s) => ({ ctx: { ...s.ctx, open: false } })),
}));

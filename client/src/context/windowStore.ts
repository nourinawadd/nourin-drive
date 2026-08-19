import { create } from "zustand";
import { APP_REGISTRY } from "@/data/appRegistry";
import { defaultBounds } from "@/lib/windowBounds";
import type { AppId, WindowInstance } from "@/types/window";

// Default page for a fresh browser tab. Lives here (not in Browser.tsx) so the
// store can seed tabs without importing the component - avoids a circular import.
export const BROWSER_HOME = "https://en.wikipedia.org/wiki/Amiga";

export type BrowserTab = { id: string; url: string; reloadKey?: number };
export type BrowserPayload = { tabs: BrowserTab[]; activeId: string };

type State = {
  windows: WindowInstance[];
  focusedId: string | null;
  zCounter: number;
};

type OpenOpts = { payload?: unknown; title?: string };

type Actions = {
  openApp: (appId: AppId, opts?: OpenOpts) => string;
  closeWin: (id: string) => void;
  focus: (id: string) => void;
  updateBounds: (id: string, b: { x?: number; y?: number; width?: number; height?: number }) => void;
  patchPayload: (id: string, patch: Record<string, unknown>) => void;
  sendToBack: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  toggleMaximize: (id: string) => void;
  setNoMaximize: (id: string, value: boolean) => void;
};

let nextId = 1;
const mkId = (appId: AppId) => `${appId}-${nextId++}`;

let nextTabId = 1;
const mkTabId = () => `tab-${nextTabId++}`;

// Factory for a browser tab. Shared by openApp (seeding) and the Browser
// component (new-tab button) so tab ids come from one counter.
export const newBrowserTab = (url: string): BrowserTab => ({ id: mkTabId(), url });

export const useWindowStore = create<State & Actions>((set, get) => ({
  windows: [],
  focusedId: null,
  zCounter: 1,

  openApp: (appId, opts) => {
    const def = APP_REGISTRY[appId];

    // The browser is tabbed: reuse the single window and add a tab rather than
    // spawning a new window per site. Any incoming `initialUrl` becomes a tab.
    if (appId === "browser") {
      const initialUrl = (opts?.payload as { initialUrl?: string } | undefined)?.initialUrl;
      const tab = newBrowserTab(initialUrl ?? BROWSER_HOME);
      const existing = get().windows.find((w) => w.appId === "browser");
      if (existing) {
        const prev = existing.payload as BrowserPayload | undefined;
        const tabs = [...(prev?.tabs ?? []), tab];
        get().patchPayload(existing.id, { tabs, activeId: tab.id });
        get().restore(existing.id);
        return existing.id;
      }
      opts = { ...opts, payload: { tabs: [tab], activeId: tab.id } satisfies BrowserPayload };
    } else if (def.singleton) {
      const existing = get().windows.find((w) => w.appId === appId);
      if (existing) {
        get().restore(existing.id);
        return existing.id;
      }
    }
    const z = get().zCounter + 1;
    // Size and position scale with the viewport, and cascade so stacked opens
    // don't perfectly overlap.
    const bounds = defaultBounds(def, get().windows.length);
    const win: WindowInstance = {
      id: mkId(appId),
      appId,
      title: opts?.title ?? def.title,
      ...bounds,
      z,
      minimized: false,
      maximized: false,
      payload: opts?.payload,
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

  // Shallow-merge into a window's payload. Reactive, so apps (e.g. the browser's
  // tab list) can hold per-instance state in the store.
  patchPayload: (id, patch) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? { ...w, payload: { ...(w.payload as Record<string, unknown> | undefined), ...patch } }
          : w,
      ),
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

  minimize: (id) =>
    set((s) => {
      const target = s.windows.find((w) => w.id === id);
      if (!target || APP_REGISTRY[target.appId].fixed) return s;
      const rest = s.windows.filter((w) => w.id !== id && !w.minimized);
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
        focusedId: s.focusedId === id ? (rest.slice(-1)[0]?.id ?? null) : s.focusedId,
      };
    }),

  restore: (id) =>
    set((s) => {
      const win = s.windows.find((w) => w.id === id);
      if (!win) return s;
      const z = s.zCounter + 1;
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: false, z } : w)),
        focusedId: id,
        zCounter: z,
      };
    }),

  // Windows-style maximize/restore. We only flip the flag: the frame keeps its
  // stored x/y/w/h as the restore bounds and paints the maximized rect itself,
  // so toggling back needs no saved geometry. Also focuses + brings to front.
  setNoMaximize: (id, value) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, noMaximize: value, maximized: value ? false : w.maximized } : w,
      ),
    })),

  toggleMaximize: (id) =>
    set((s) => {
      const win = s.windows.find((w) => w.id === id);
      if (!win || APP_REGISTRY[win.appId].fixed || win.noMaximize) return s;
      const z = s.zCounter + 1;
      return {
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, maximized: !w.maximized, minimized: false, z } : w,
        ),
        focusedId: id,
        zCounter: z,
      };
    }),
}));

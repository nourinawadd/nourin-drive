import { create } from "zustand";
import { KEY_PREFS, clearKey, readJson, writeJson } from "@/lib/localStore";
import { DEFAULT_PALETTE, DEFAULT_PATTERN, findPalette, findPattern } from "@/data/prefs";

type Saved = { palette: string; pattern: string };

const DEFAULTS: Saved = { palette: DEFAULT_PALETTE, pattern: DEFAULT_PATTERN };

type State = Saved & { hydrated: boolean };

type Actions = {
  setPalette: (id: string) => void;
  setPattern: (id: string) => void;
  reset: () => void;
  hydrate: () => void;
};

export const usePrefsStore = create<State & Actions>((set, get) => {
  const persist = () => {
    const { palette, pattern } = get();
    writeJson(KEY_PREFS, { palette, pattern } satisfies Saved);
  };

  return {
    ...DEFAULTS,
    hydrated: false,

    hydrate: () => {
      if (get().hydrated) return;
      const saved = readJson<Partial<Saved>>(KEY_PREFS) ?? {};
      const palette =
        typeof saved.palette === "string" && findPalette(saved.palette)
          ? saved.palette
          : DEFAULTS.palette;
      const pattern =
        typeof saved.pattern === "string" && findPattern(saved.pattern)
          ? saved.pattern
          : DEFAULTS.pattern;
      set({ palette, pattern, hydrated: true });
    },

    setPalette: (id) => {
      if (!findPalette(id)) return;
      set({ palette: id });
      persist();
    },

    setPattern: (id) => {
      if (!findPattern(id)) return;
      set({ pattern: id });
      persist();
    },

    reset: () => {
      set({ ...DEFAULTS });
      clearKey(KEY_PREFS);
    },
  };
});

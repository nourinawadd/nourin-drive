import { create } from "zustand";
import { KEY_PREFS, clearKey, readJson, writeJson } from "@/lib/localStore";
import { DEFAULT_PALETTE, DEFAULT_PATTERN, findPalette, findPattern } from "@/data/prefs";
import { DEFAULT_IDLE, DEFAULT_SAVER, findIdle, findSaver } from "@/data/savers";

type Saved = { palette: string; pattern: string; saver: string; saverIdle: number };

const DEFAULTS: Saved = {
  palette: DEFAULT_PALETTE,
  pattern: DEFAULT_PATTERN,
  saver: DEFAULT_SAVER,
  saverIdle: DEFAULT_IDLE,
};

type State = Saved & { hydrated: boolean };

type Actions = {
  setPalette: (id: string) => void;
  setPattern: (id: string) => void;
  setSaver: (id: string) => void;
  setSaverIdle: (seconds: number) => void;
  reset: () => void;
  hydrate: () => void;
};

export const usePrefsStore = create<State & Actions>((set, get) => {
  const persist = () => {
    const { palette, pattern, saver, saverIdle } = get();
    writeJson(KEY_PREFS, { palette, pattern, saver, saverIdle } satisfies Saved);
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
      const saver =
        typeof saved.saver === "string" && findSaver(saved.saver) ? saved.saver : DEFAULTS.saver;
      const saverIdle =
        typeof saved.saverIdle === "number" && findIdle(saved.saverIdle)
          ? saved.saverIdle
          : DEFAULTS.saverIdle;
      set({ palette, pattern, saver, saverIdle, hydrated: true });
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

    setSaver: (id) => {
      if (!findSaver(id)) return;
      set({ saver: id });
      persist();
    },

    setSaverIdle: (seconds) => {
      if (!findIdle(seconds)) return;
      set({ saverIdle: seconds });
      persist();
    },

    reset: () => {
      set({ ...DEFAULTS });
      clearKey(KEY_PREFS);
    },
  };
});

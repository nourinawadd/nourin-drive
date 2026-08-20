import { create } from "zustand";
import { KEY_PREFS, clearKey, readJson, writeJson } from "@/lib/localStore";
import { DEFAULT_PALETTE, DEFAULT_PATTERN, findPalette, findPattern } from "@/data/prefs";
import { DEFAULT_IDLE, DEFAULT_SAVER, findIdle, findSaver } from "@/data/savers";
import { DEFAULT_DELAY, DEFAULT_PET, findDelay, findPet } from "@/data/pets";

type Saved = {
  palette: string;
  pattern: string;
  saver: string;
  saverIdle: number;
  pet: string;
  petDelay: number;
};

const DEFAULTS: Saved = {
  palette: DEFAULT_PALETTE,
  pattern: DEFAULT_PATTERN,
  saver: DEFAULT_SAVER,
  saverIdle: DEFAULT_IDLE,
  pet: DEFAULT_PET,
  petDelay: DEFAULT_DELAY,
};

type State = Saved & { hydrated: boolean };

type Actions = {
  setPalette: (id: string) => void;
  setPattern: (id: string) => void;
  setSaver: (id: string) => void;
  setSaverIdle: (seconds: number) => void;
  setPet: (id: string) => void;
  setPetDelay: (seconds: number) => void;
  reset: () => void;
  hydrate: () => void;
};

export const usePrefsStore = create<State & Actions>((set, get) => {
  const persist = () => {
    const { palette, pattern, saver, saverIdle, pet, petDelay } = get();
    writeJson(KEY_PREFS, { palette, pattern, saver, saverIdle, pet, petDelay } satisfies Saved);
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
      const pet = typeof saved.pet === "string" && findPet(saved.pet) ? saved.pet : DEFAULTS.pet;
      const petDelay =
        typeof saved.petDelay === "number" && findDelay(saved.petDelay)
          ? saved.petDelay
          : DEFAULTS.petDelay;
      set({ palette, pattern, saver, saverIdle, pet, petDelay, hydrated: true });
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

    setPet: (id) => {
      if (!findPet(id)) return;
      set({ pet: id });
      persist();
    },

    setPetDelay: (seconds) => {
      if (!findDelay(seconds)) return;
      set({ petDelay: seconds });
      persist();
    },

    reset: () => {
      set({ ...DEFAULTS });
      clearKey(KEY_PREFS);
    },
  };
});

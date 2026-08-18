import { create } from "zustand";
import { KEY_SFX, readJson, writeJson } from "@/lib/localStore";
import { setSfxEnabled, setSfxVolume } from "@/lib/sfx";

type Saved = {
  enabled: boolean;
  volume: number;
};

const DEFAULTS: Saved = { enabled: true, volume: 0.3 };

type State = Saved & {
  hydrated: boolean;
};

type Actions = {
  toggle: () => void;
  setVolume: (v: number) => void;
  hydrate: () => void;
};

export const useSfxStore = create<State & Actions>((set, get) => {
  const persist = () => {
    const { enabled, volume } = get();
    writeJson(KEY_SFX, { enabled, volume } satisfies Saved);
  };

  return {
    ...DEFAULTS,
    hydrated: false,

    hydrate: () => {
      if (get().hydrated) return;
      const saved = readJson<Partial<Saved>>(KEY_SFX) ?? {};
      const volume =
        typeof saved.volume === "number" && saved.volume >= 0 && saved.volume <= 1
          ? saved.volume
          : DEFAULTS.volume;
      const enabled = saved.enabled !== false;

      setSfxEnabled(enabled);
      setSfxVolume(volume);
      set({ enabled, volume, hydrated: true });
    },

    toggle: () => {
      const enabled = !get().enabled;
      setSfxEnabled(enabled);
      set({ enabled });
      persist();
    },

    setVolume: (v) => {
      const volume = Math.min(1, Math.max(0, v));
      setSfxVolume(volume);
      set({ volume });
      persist();
    },
  };
});

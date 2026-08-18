"use client";

import { useEffect } from "react";
import { useSfxStore } from "@/context/sfxStore";
import { useWindowStore } from "@/context/windowStore";
import { playSfx, unlockSfx } from "@/lib/sfx";

export function SfxEngine() {
  const hydrate = useSfxStore((s) => s.hydrate);

  useEffect(() => hydrate(), [hydrate]);

  useEffect(() => {
    // Autoplay policy blocks audio until the visitor interacts, so the startup
    // chime rides the first gesture rather than the boot screen appearing. It
    // fires once; playSfx awaits the buffer decode, so unlocking here is enough.
    const onGesture = () => {
      unlockSfx();
      playSfx("boot");
    };
    const opts = { capture: true } as const;
    document.addEventListener("pointerdown", onGesture, { ...opts, once: true });
    document.addEventListener("keydown", onGesture, { ...opts, once: true });
    return () => {
      document.removeEventListener("pointerdown", onGesture, opts);
      document.removeEventListener("keydown", onGesture, opts);
    };
  }, []);

  useEffect(
    () =>
      useWindowStore.subscribe((state, prev) => {
        if (state.windows === prev.windows) return;

        if (state.windows.length > prev.windows.length) {
          playSfx("open");
          return;
        }
        if (state.windows.length < prev.windows.length) {
          playSfx("close");
          return;
        }

        const hidden = state.windows.filter((w) => w.minimized).length;
        const wasHidden = prev.windows.filter((w) => w.minimized).length;
        if (hidden > wasHidden) playSfx("minimize");
        else if (hidden < wasHidden) playSfx("restore");
      }),
    [],
  );

  return null;
}

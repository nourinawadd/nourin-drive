import { useEffect, useRef } from "react";

const TICK_MS = 1000;

const ACTIVITY = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;

type Options = {
  timeoutMs: number;
  enabled: boolean;
  onIdle: () => void;
};

export function useIdle({ timeoutMs, enabled, onIdle }: Options): void {
  const last = useRef(Date.now());
  const fire = useRef(onIdle);
  fire.current = onIdle;

  useEffect(() => {
    if (!enabled) return;

    const stamp = () => {
      last.current = Date.now();
    };
    stamp();

    for (const name of ACTIVITY) {
      document.addEventListener(name, stamp, { capture: true, passive: true });
    }
    document.addEventListener("visibilitychange", stamp);

    const id = window.setInterval(() => {
      if (document.hidden || document.activeElement?.tagName === "IFRAME") {
        stamp();
        return;
      }
      if (Date.now() - last.current < timeoutMs) return;
      stamp();
      fire.current();
    }, TICK_MS);

    return () => {
      window.clearInterval(id);
      for (const name of ACTIVITY) {
        document.removeEventListener(name, stamp, { capture: true });
      }
      document.removeEventListener("visibilitychange", stamp);
    };
  }, [enabled, timeoutMs]);
}

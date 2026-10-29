import { useEffect } from "react";
import { useWindowStore } from "@/context/windowStore";
import { hasDeepLink } from "@/lib/deepLink";
import { KEY_README_SEEN, readFlag, writeFlag } from "@/lib/localStore";
import { playSfx } from "@/lib/sfx";

/**
 * The readme introduces itself a beat after the disk goes in, rather than being
 * there the instant the desktop appears - the pause reads as the machine
 * finishing its boot. Only on a first visit: once it has been shown, it stays
 * shut. Skipped entirely when something else is already open, which is what a
 * shared deep link does.
 */
export const README_DELAY_MS = 2000;

export function useReadmeAfterBoot(booted: boolean) {
  const openApp = useWindowStore((s) => s.openApp);
  useEffect(() => {
    if (!booted) return;
    if (hasDeepLink()) return;
    if (readFlag(KEY_README_SEEN)) return;
    const t = setTimeout(() => {
      if (useWindowStore.getState().windows.length > 0) return;
      writeFlag(KEY_README_SEEN, true);
      playSfx("open");
      openApp("readme");
    }, README_DELAY_MS);
    return () => clearTimeout(t);
  }, [booted, openApp]);
}

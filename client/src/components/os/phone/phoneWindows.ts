import type { WindowInstance } from "@/types/window";

/**
 * The one window the phone shell shows: the highest `z` that isn't minimised.
 * The store keeps every window it has, exactly as on the desktop; the phone
 * just renders the top of that pile. So closing the top window reveals the one
 * beneath it, which gives the shell a back stack without keeping one, and
 * opening an app that's already open (singletons refocus) brings it forward
 * because focus raises its `z`.
 */
export function topWindow(windows: readonly WindowInstance[]): WindowInstance | null {
  let top: WindowInstance | null = null;
  for (const win of windows) {
    if (win.minimized) continue;
    if (!top || win.z > top.z) top = win;
  }
  return top;
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { detectShellMode, type ShellMode } from "@/lib/shellMode";

// Holds the shell mode for the whole page so the gate, and later the phone
// shell and the apps inside it, all read the same answer instead of measuring
// the window for themselves.
//
// It wraps MobileGate rather than living inside Desktop: the gate has to know
// the mode before it can decide whether Desktop exists at all.

/** `null` while checking: the page is prerendered without a window, so the
 *  real answer only exists after the first effect. */
const ShellModeContext = createContext<ShellMode | null>(null);

export function ShellModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ShellMode | null>(null);

  // Once per load, deliberately with no resize or orientation listeners - see
  // the note at the top of lib/shellMode.ts. Rotating a phone must never swap
  // the shell underneath it.
  useEffect(() => {
    setMode(detectShellMode());
  }, []);

  return <ShellModeContext.Provider value={mode}>{children}</ShellModeContext.Provider>;
}

/**
 * The resolved mode, or `null` until it's known. Outside a ShellModeProvider it
 * stays `null` forever, which renders as a blank page rather than guessing
 * wrong - a loud failure for a wiring mistake.
 */
export function useShellMode(): ShellMode | null {
  return useContext(ShellModeContext);
}

/**
 * True only inside the phone shell. This is what apps branch their layout on,
 * and the pattern every converted app follows (Phase 3 onward): the desktop's
 * inline style objects stay exactly as they are, and phone-only overrides are
 * spread on top, e.g. `style={{ ...row, ...(phone ? rowPhone : null) }}`, with
 * the `*Phone` objects at the bottom of the file beside the originals. Spreading
 * null is a no-op, so the desktop's computed styles can't change. Inline styles
 * can't take media queries, and the shell's width isn't the question anyway:
 * a narrow desktop window must keep the desktop layout.
 */
export function useIsPhone(): boolean {
  return useShellMode() === "phone";
}

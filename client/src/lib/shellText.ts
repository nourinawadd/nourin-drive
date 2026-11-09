import { useShellMode } from "@/components/os/ShellModeProvider";
import type { ShellMode } from "@/lib/shellMode";

// Some of the site's copy describes the mouse: "double-click to open",
// "right-click for properties". On a phone those words are wrong, so each such
// string comes in a pair and the shell picks one. Known call sites still to
// convert (Phases 3 to 5): AboutSite's ITEMS lines, GETTING_AROUND and its
// "double-click to open" status; Explorer's status bar; RecycleBin's status line.

export type ShellStrings = { desktop: string; phone: string };

/**
 * The desktop string unless the page is in a phone mode. While the mode is
 * still unknown (`null`, the static prerender and the first client pass) it's
 * the desktop string, so the prerendered HTML matches what the desktop shows.
 * `lite` never renders apps, but it's a phone, so it gets the phone string.
 */
export function shellText(mode: ShellMode | null, strings: ShellStrings): string {
  return mode === "phone" || mode === "lite" ? strings.phone : strings.desktop;
}

/** `shellText` with the mode read from ShellModeProvider. */
export function useShellText(strings: ShellStrings): string {
  return shellText(useShellMode(), strings);
}

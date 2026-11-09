import { useCallback } from "react";
import { useShellMode } from "@/components/os/ShellModeProvider";

// Icons and list rows across the site follow the Workbench rule: click selects,
// double-click opens. On a touch screen a first tap has nothing useful to mean
// on its own and a double tap is awkward (and fights the browser's zoom), so on
// a phone one tap does both. This is the one place that rule lives, so the apps
// converted in Phases 3 to 5 swap their hand-wired onClick / onDoubleClick for
// it rather than each deciding what a tap should do.
//
// It keys off the shell mode, not the pointer type: the desktop keeps
// double-click even on a touchscreen laptop, where the browser already turns a
// double tap into `dblclick`. (Long press is different and checks for a finger
// itself; see useContextTrigger.)

export type ActivateOptions = {
  /** Highlight the item. Optional: some items have no selected state. */
  onSelect?: () => void;
  /** Open it. */
  onOpen: () => void;
};

export type ActivateHandlers = {
  onClick?: () => void;
  onDoubleClick?: () => void;
};

/**
 * Returns a function rather than handlers, because the items it's for are
 * rendered in `.map()` loops where a hook per item isn't allowed:
 *
 *   const activate = useActivate();
 *   items.map((it) => <div {...activate({ onSelect: ..., onOpen: ... })} />)
 *
 * Desktop, and while the mode is still unknown: exactly the handlers callers
 * wire by hand today. Phone: one tap selects then opens, and there's no
 * `onDoubleClick`, so a quick second tap can't open the thing twice over.
 */
export function useActivate(): (options: ActivateOptions) => ActivateHandlers {
  const mode = useShellMode();
  const touch = mode === "phone" || mode === "lite";

  return useCallback(
    ({ onSelect, onOpen }: ActivateOptions): ActivateHandlers =>
      touch
        ? {
            onClick: () => {
              onSelect?.();
              onOpen();
            },
          }
        : { onClick: onSelect, onDoubleClick: onOpen },
    [touch],
  );
}

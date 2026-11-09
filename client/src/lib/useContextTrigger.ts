import { useEffect, useMemo, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

// One way to ask for an item's context menu, whatever the hand on the screen:
//
// - A mouse right-click (or the keyboard's menu key) arrives as `contextmenu`,
//   exactly as every caller handles it by hand today.
// - Android Chrome turns a long finger press into a native `contextmenu` as
//   well, which is why the existing right-click menus already pop up there. We
//   take that event as the long press itself and stop the timer, so the menu
//   opens once, not twice.
// - iOS Safari sends no `contextmenu` for touch at all, so a timer does it: a
//   still finger for `ms` opens the menu. Moving past `slop`, lifting early, or
//   the browser taking the gesture over for a scroll (`pointercancel`) calls it
//   off. Nothing here prevents the default on pointerdown, so scrolling is
//   never blocked.
//
// The click a finger produces when it lifts after a long press is swallowed,
// or the item would open the moment its menu appeared.
//
// It checks `pointerType` rather than the shell mode, so a mouse on a touchscreen
// laptop in desktop mode right-clicks exactly as before.

export type ContextPoint = { clientX: number; clientY: number };

export type ContextTriggerOptions = {
  /** How long a finger has to stay still. */
  ms?: number;
  /** How far it may wander, in CSS pixels, before it counts as a scroll. */
  slop?: number;
};

export type ContextTriggerHandlers = {
  onContextMenu: (e: ReactMouseEvent) => void;
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: (e: ReactPointerEvent) => void;
  onClickCapture: (e: ReactMouseEvent) => void;
};

// Triggers nest: an Explorer file sits inside the list pane, and both have menus.
// Today the inner handler calls stopPropagation; here the innermost trigger to
// see an event claims it instead, and any outer trigger leaves it alone. A
// WeakSet so claimed events can be garbage collected with everything else.
const claimed = new WeakSet<Event>();

function claim(e: { nativeEvent: Event }): boolean {
  if (claimed.has(e.nativeEvent)) return false;
  claimed.add(e.nativeEvent);
  return true;
}

export function useContextTrigger(
  handler: (point: ContextPoint) => void,
  { ms = 500, slop = 8 }: ContextTriggerOptions = {},
): ContextTriggerHandlers {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The finger currently being timed, if any.
  const pending = useRef<{ id: number; x: number; y: number } | null>(null);
  // A long press just opened the menu; eat the click (and any late native
  // contextmenu) that the same gesture still has coming.
  const fired = useRef(false);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return useMemo(() => {
    const cancel = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      pending.current = null;
    };

    const fire = (point: ContextPoint) => {
      cancel();
      fired.current = true;
      handlerRef.current(point);
    };

    return {
      onPointerDown: (e) => {
        // A new gesture: whatever the last long press was owed has been paid.
        // Reset before the claim check, so an outer trigger that fired last
        // time can't swallow a click meant for an inner one this time.
        fired.current = false;
        if (!claim(e)) return;
        if (e.pointerType !== "touch") return;
        // A second finger means a pinch, not a press.
        if (!e.isPrimary) {
          cancel();
          return;
        }
        cancel();
        const start = { id: e.pointerId, x: e.clientX, y: e.clientY };
        pending.current = start;
        timer.current = setTimeout(() => fire({ clientX: start.x, clientY: start.y }), ms);
      },

      onPointerMove: (e) => {
        const p = pending.current;
        if (!p || e.pointerId !== p.id) return;
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > slop) cancel();
      },

      onPointerUp: () => cancel(),
      onPointerCancel: () => cancel(),

      onContextMenu: (e) => {
        if (!claim(e)) return;
        e.preventDefault();
        // Android: the native long press beat our timer. Use it, once.
        if (pending.current) {
          fire({ clientX: e.clientX, clientY: e.clientY });
          return;
        }
        // The same gesture already opened the menu via the timer.
        if (fired.current) return;
        // A mouse (or the menu key): what every caller does by hand today.
        handlerRef.current({ clientX: e.clientX, clientY: e.clientY });
      },

      onClickCapture: (e) => {
        if (!fired.current) return;
        fired.current = false;
        e.preventDefault();
        e.stopPropagation();
      },
    };
  }, [ms, slop]);
}

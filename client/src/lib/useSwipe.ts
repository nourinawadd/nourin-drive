import { useRef } from "react";

// A sideways finger swipe, for the phone views that step through things (the
// Gallery's lightbox, the Ereader's pages). It started inside the Gallery and
// moved here when the reader needed the same gesture, so the two can't drift
// apart on what counts as a swipe.
//
// Touch only, so a mouse dragging across the image on the desktop (or a
// touchscreen laptop in desktop mode, where these aren't attached at all)
// can't flip anything. pointercancel - the browser deciding it's a scroll -
// simply drops the gesture. The element it's spread on should have
// `touch-action: pan-y`, so vertical drags stay the browser's and only
// sideways ones reach us.

/**
 * A swipe has to travel this far sideways, and further sideways than up or
 * down, before it counts: anything less is a wobble or the start of a scroll.
 */
export const SWIPE_PX = 48;

export type SwipeOptions = {
  /** `1` for a swipe to the left (bring in the next one), `-1` to the right. */
  onSwipe: (dir: 1 | -1) => void;
  /** Off, the hook returns no handlers at all, so nothing is attached. */
  enabled: boolean;
};

export type SwipeHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: () => void;
};

/**
 * Pointer handlers to spread on the swipe surface, or `null` when disabled, so
 * `{...useSwipe({ enabled: phone, ... })}` adds nothing to the desktop DOM.
 */
export function useSwipe({ onSwipe, enabled }: SwipeOptions): SwipeHandlers | null {
  const start = useRef<{ id: number; x: number; y: number } | null>(null);
  if (!enabled) return null;

  return {
    onPointerDown: (e) => {
      if (e.pointerType !== "touch") return;
      start.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e) => {
      const s = start.current;
      start.current = null;
      if (!s || s.id !== e.pointerId) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return;
      // Swiping left brings the next one in from the right.
      onSwipe(dx < 0 ? 1 : -1);
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}

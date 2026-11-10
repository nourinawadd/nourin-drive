import { useEffect, useRef } from "react";
import { topWindow } from "@/components/os/phone/phoneWindows";
import { useWindowStore } from "@/context/windowStore";

// Hardware and browser Back on the phone. Without this, the whole shell is one
// history entry, so Android's back button, the browser's back button or iOS's
// edge swipe leaves the site from inside any app - and a visitor who landed on
// a shared document leaves the moment they try to get from it to the rest of
// the site. So the shell keeps one history entry per open window, and Back
// walks down the same stack the back gadget does (see phoneWindows).
//
// Only the phone shell mounts this. The desktop has overlapping windows with
// no order a Back could sensibly follow, and nothing there touches history,
// so browser Back and Forward behave on the desktop exactly as they always
// have.
//
// The entries never change the URL (each is pushed with the current one), so
// links, reloads and the cleaned deep-link address are unaffected. Each carries
// its depth ("k windows open") and an id for this page load. A popstate that
// lands on anything else - the entry the page loaded on, or one left behind by
// a reload mid-stack - counts as depth 0: such leftovers just cost a few no-op
// presses of Back before it leaves the site, which is the honest worst case.
//
// Each entry also carries whatever Next.js keeps in the current one, because
// Next's app router owns history too. It handles every popstate, and reloads
// the page for an entry without its `__NA` marker, which here would reboot the
// shell on Back. It also patches pushState: a state that already has `__NA` is
// passed straight through, while anything else gets Next's state copied in and
// a same-URL router restore dispatched. Our entries used to get the marker only
// through that copy, which works only once Next's patch is installed (an effect
// of its own). Spreading the current state in makes every entry valid by
// itself, whenever it's pushed, and skips the pointless restore. Next 16
// (node_modules/next/dist/client/components/app-router.js); re-check Back after
// a Next upgrade.

/** Tells this load's entries from a previous load's, which survive a reload. */
const LOAD = Math.random().toString(36).slice(2);

type Entry = { wbPhone: number; load: string };

function depthOf(state: unknown): number {
  const e = state as Partial<Entry> | null;
  return e && e.load === LOAD && typeof e.wbPhone === "number" ? e.wbPhone : 0;
}

export function usePhoneHistory(): void {
  // Open windows, counted the way topWindow picks them (minimised ones are
  // skipped; nothing on the phone minimises, but the store allows it).
  const open = useWindowStore((s) => s.windows.filter((w) => !w.minimized).length);
  // How many of our entries sit at or below the current one.
  const depth = useRef(0);
  // popstate events we caused ourselves and must not treat as a Back.
  const expected = useRef(0);

  // Keep the entries in step with the window count. A refocused singleton
  // doesn't change the count, so it adds nothing, and Back closes whichever
  // window is on top, as the gadget does.
  useEffect(() => {
    if (open > depth.current) {
      // An app opened (one at a time from a tap; a deep link can open several).
      for (let k = depth.current + 1; k <= open; k++) {
        window.history.pushState(
          {
            // `history.state` is `any` in the DOM types; naming it keeps the
            // `satisfies` below an actual check on our two keys.
            ...(window.history.state as Record<string, unknown> | null),
            wbPhone: k,
            load: LOAD,
          } satisfies Entry,
          "",
          window.location.href,
        );
      }
      depth.current = open;
    } else if (open < depth.current) {
      // Closed some other way (the back gadget, Close in an app): drop our
      // entries for those windows, so the next hardware Back doesn't land on a
      // stale one and seem to do nothing. One traversal, so one popstate.
      const extra = depth.current - open;
      depth.current = open;
      expected.current += 1;
      window.history.go(-extra);
    }
  }, [open]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (expected.current > 0) {
        expected.current -= 1;
        return;
      }
      const target = depthOf(e.state);
      if (target < depth.current) {
        // Back (possibly several at once, from a long-press on the back
        // button): close that many windows from the top. Depth moves first,
        // so the count effect above sees them already accounted for.
        const { closeWin } = useWindowStore.getState();
        const n = depth.current - target;
        depth.current = target;
        for (let i = 0; i < n; i++) {
          const top = topWindow(useWindowStore.getState().windows);
          if (top) closeWin(top.id);
        }
      } else if (target > depth.current) {
        // Forward into an entry whose window is already closed. There's
        // nothing to reopen, so step straight back to where the stack is.
        expected.current += 1;
        window.history.go(depth.current - target);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
}

"use client";

import { useWindowStore } from "@/context/windowStore";
import type { WindowInstance } from "@/types/window";

/**
 * What the phone shows in place of an app marked `hidden`. Hidden apps aren't
 * in the launcher, but other routes still reach them - About's tiles, Explorer
 * opening a game, a link inside another app - and rendering a desktop-sized
 * terminal or WebGL build into a phone would be worse than saying so plainly.
 *
 * It's the body of a normal PhoneFrame rather than an app of its own, so it
 * needs no AppId or registry entry, and back works exactly like it does for
 * any app: it closes this window and shows whatever was underneath.
 */
export function PhoneUnsupported({ win }: { win: WindowInstance }) {
  const close = useWindowStore((s) => s.closeWin);

  return (
    <div className="wb-phone-card">
      <h2>This one needs a computer</h2>
      <p>{win.title} is built for a mouse and a big screen.</p>
      <p>
        Open it on a computer, or <a href="/?mode=desktop">switch to the full desktop</a> here.
      </p>
      <button type="button" className="wb-phone-gadget" onClick={() => close(win.id)}>
        Back
      </button>
    </div>
  );
}

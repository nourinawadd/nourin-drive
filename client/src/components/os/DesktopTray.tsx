"use client";

import { useEffect, useRef, useState } from "react";
import { Dock } from "@/components/os/Dock";
import { GuestbookStand } from "@/components/os/GuestbookStand";
import { Taskbar } from "@/components/os/Taskbar";
import { TrayDownGlyph, TrayUpGlyph } from "@/components/os/icons";
import { useWindowStore } from "@/context/windowStore";

/**
 * The bottom tier of desktop furniture — guestbook stand, minimised-window
 * chips, dock — plus the pull-tab that hides and restores it.
 *
 * A maximised window paints all the way to the bottom edge (see the comment in
 * WindowFrame.tsx), so those three float on top of its content and the last
 * lines of whatever you're reading disappear behind them. While anything is
 * maximised the whole tier drops off-screen and leaves a small tab; pulling it
 * up is a peek, not a mode, so it goes back down as soon as you use it.
 *
 * The slide itself is CSS: this only toggles `.is-down`, which flips the
 * --wb-tray-shift custom property the three pieces add to their `bottom`.
 */
export function DesktopTray() {
  // Primitive result, so zustand's default Object.is equality is what we want.
  const anyMaximized = useWindowStore((s) =>
    s.windows.some((w) => w.maximized && !w.minimized),
  );

  const [pulledUp, setPulledUp] = useState(false);
  const down = anyMaximized && !pulledUp;

  const trayRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);

  // Nothing left to hide from — drop the peek so the next maximise starts
  // hidden again rather than inheriting a stale "pulled up".
  useEffect(() => {
    if (!anyMaximized) setPulledUp(false);
  }, [anyMaximized]);

  // Clicking into the window puts it back. Same outside-pointerdown idiom the
  // menu bar and context menu use to close themselves.
  useEffect(() => {
    if (!pulledUp) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (trayRef.current?.contains(t)) return;
      if (handleRef.current?.contains(t)) return;
      setPulledUp(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [pulledUp]);

  // Using anything in the tray retracts it too — launching from the dock,
  // restoring a chip, signing the guestbook. One handler here beats threading a
  // callback through three components that otherwise know nothing about this.
  function onTrayClick(e: React.MouseEvent) {
    // ...except the stand's own collapse gadget, which would otherwise yank the
    // tray away the instant you tried to tidy it.
    if ((e.target as HTMLElement).closest(".wb-stand-gadget")) return;
    setPulledUp(false);
  }

  return (
    <>
      <div
        id="wb-tray"
        ref={trayRef}
        className={`wb-tray${down ? " is-down" : ""}`}
        onClick={onTrayClick}
      >
        <GuestbookStand />
        <Taskbar />
        <Dock />
      </div>

      {anyMaximized && (
        <button
          type="button"
          ref={handleRef}
          className="wb-tray-handle"
          aria-controls="wb-tray"
          aria-expanded={!down}
          aria-label={down ? "Show dock" : "Hide dock"}
          title={down ? "Show dock" : "Hide dock"}
          onClick={() => setPulledUp((v) => !v)}
        >
          {down ? <TrayUpGlyph /> : <TrayDownGlyph />}
        </button>
      )}
    </>
  );
}

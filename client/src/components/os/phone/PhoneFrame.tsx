"use client";

import type { ReactNode } from "react";
import { DevCrash, PhoneErrorBoundary } from "@/components/os/phone/PhoneErrorBoundary";
import { useWindowStore } from "@/context/windowStore";
import type { WindowInstance } from "@/types/window";

type Props = {
  win: WindowInstance;
  children: ReactNode;
};

// A pixel "<" on a 5×9 grid. Drawn at 2× so it stays crisp: pixel art only
// survives integer scaling (see svg() in components/os/icons.tsx).
const BACK_PIXELS: [number, number][] = [
  [4, 0], [3, 1], [2, 2], [1, 3], [0, 4], [1, 5], [2, 6], [3, 7], [4, 8],
  [4, 1], [3, 2], [2, 3], [1, 4], [2, 5], [3, 6], [4, 7],
];

function BackGlyph() {
  const scale = 2;
  return (
    <svg
      width={5 * scale}
      height={9 * scale}
      viewBox="0 0 5 9"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {BACK_PIXELS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="var(--wb-black)" />
      ))}
    </svg>
  );
}

/**
 * The phone's stand-in for WindowFrame: one app, filling the space under the
 * bar, with a back gadget and the title. No drag, resize, maximise or minimise -
 * there's nowhere to put a second window, so the window's stored bounds are
 * simply ignored here (the desktop still owns them).
 *
 * Back closes the window rather than minimising it: the phone has nothing that
 * could restore a minimised window, apps keep their state in the window
 * payload, and music lives in AudioEngine, so closing loses nothing that
 * matters. Whatever was open underneath shows next.
 */
export function PhoneFrame({ win, children }: Props) {
  const close = useWindowStore((s) => s.closeWin);

  return (
    <section className="wb-phone-frame" aria-label={win.title}>
      <div className="wb-phone-titlebar">
        <button
          type="button"
          className="wb-phone-gadget"
          aria-label="Back"
          title="Back"
          onClick={() => close(win.id)}
        >
          <BackGlyph />
        </button>
        <h1 className="wb-phone-title" style={titleReset}>
          {win.title}
        </h1>
      </div>
      {/* Its own safety net, inside the one around the whole shell: an app that
          crashes while rendering gets a card here, and the bar, Back and the
          launcher keep working. The frame is keyed per window (PhoneShell), so
          the next app opened gets a fresh boundary instead of this one's
          failed state. */}
      <div className="wb-window-body">
        <PhoneErrorBoundary fallback={<AppProblem onBack={() => close(win.id)} />}>
          {process.env.NODE_ENV !== "production" && <DevCrash at="app" />}
          {children}
        </PhoneErrorBoundary>
      </div>
    </section>
  );
}

/** What an app's body shows after it crashed. Back does what the title bar's
 *  gadget does, so the way out is the same one the visitor already knows. */
function AppProblem({ onBack }: { onBack: () => void }) {
  return (
    <div className="wb-phone-card">
      <h2>This app hit a problem</h2>
      <p>Go back and try again, or open it on a computer.</p>
      <button type="button" className="wb-phone-gadget" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

// An h1 for screen readers (one app is the whole page), without the browser's
// default heading margins and weight fighting the bar's layout.
const titleReset: React.CSSProperties = { margin: 0, fontWeight: "normal" };

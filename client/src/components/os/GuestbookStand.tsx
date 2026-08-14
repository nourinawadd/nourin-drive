"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGuestbookStats, listGuestbook, pingGuestbookVisit } from "@/lib/api";
import {
  KEY_SIGNED,
  KEY_STAND_COLLAPSED,
  KEY_VISIT_COUNTED,
  readFlag,
  readSession,
  writeFlag,
  writeSession,
} from "@/lib/localStore";
import { useWindowStore } from "@/context/windowStore";

/** Stand width + left inset. Taskbar reads this so its chips start clear of us. */
export const STAND_WIDTH = 236;
export const STAND_LEFT = 16;

const ODO_DIGITS = 6;

/**
 * The always-there invitation to sign the guestbook.
 *
 * Lives at z-index 900 — the dock/taskbar tier — rather than down at z1 with
 * the drive icons and stickies. At z1 the first window a visitor opens buries
 * it, which defeats the entire point of a standing invitation.
 *
 * It nudges exactly twice: the counter ticks up once when the stats land, and
 * the sign button breathes on a slow 2s cycle. Once you've signed, both stop
 * for good. The [_] gadget collapses it to its title strip if it's ever in the
 * way, and that choice is remembered.
 */
export function GuestbookStand() {
  const openApp = useWindowStore((s) => s.openApp);

  // Storage is read in an effect, never during render — reading it inline would
  // make the server pass and the first client pass disagree and blow up
  // hydration. The un-nudged, expanded state is what the server renders.
  const [collapsed, setCollapsed] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    setCollapsed(readFlag(KEY_STAND_COLLAPSED));
    setSigned(readFlag(KEY_SIGNED));
  }, []);

  // Signing happens inside the guestbook window, not here, so poll the flag
  // while the app is open to flip the button over without a reload.
  useEffect(() => {
    const id = window.setInterval(() => setSigned(readFlag(KEY_SIGNED)), 1500);
    return () => window.clearInterval(id);
  }, []);

  // One increment per browser session. Without the guard a refresh would inflate
  // the count, and React's dev-mode double-effect would double it on every load.
  useEffect(() => {
    if (readSession(KEY_VISIT_COUNTED)) return;
    writeSession(KEY_VISIT_COUNTED, true);
    pingGuestbookVisit().catch(() => {
      // Counter is cosmetic. If the server is down, let the session flag stand
      // so we don't retry on every remount.
    });
  }, []);

  const statsQ = useQuery({
    queryKey: ["guestbook", "stats"],
    queryFn: getGuestbookStats,
    // The visit ping above lands around the same time; a short stale window lets
    // the count settle without hammering the endpoint.
    staleTime: 15_000,
  });

  const entriesQ = useQuery({ queryKey: ["guestbook"], queryFn: listGuestbook });
  const newest = (entriesQ.data ?? []).slice(0, 2);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    writeFlag(KEY_STAND_COLLAPSED, next);
  }

  return (
    <aside className="wb-stand" aria-label="Guestbook">
      <div className="wb-stand-title">
        <span>Guestbook</span>
        <span className="wb-stand-grip" aria-hidden>
          &#8226;&#8226;&#8226;&#8226;&#8226;&#8226;
        </span>
        <button
          type="button"
          className="wb-stand-gadget"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "+" : "–"}
        </button>
      </div>

      {!collapsed && (
        <div className="wb-stand-body">
          <Odometer value={statsQ.data?.visits} />

          {newest.length > 0 && (
            <div className="wb-stand-sigs">
              {newest.map((e) => (
                <div key={e._id} className="wb-stand-sig">
                  <span className="wb-stand-sig-name">
                    {e.emoji ? `${e.emoji} ` : ""}
                    {e.name}
                  </span>{" "}
                  <span className="wb-stand-sig-msg">&ldquo;{truncate(e.message, 26)}&rdquo;</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className={`wb-stand-btn${signed ? " is-signed" : " wb-pulse"}`}
            onClick={() => openApp("guestbook")}
          >
            {signed ? "✓ you signed it — read the book" : "✎ SIGN THE BOOK"}
          </button>
        </div>
      )}
    </aside>
  );
}

/**
 * Mechanical hit counter. Renders one digit short on the first successful load
 * and then rolls to the real value ~500ms later, so a visitor actually sees
 * their own arrival register. Fires once per mount, never loops.
 */
function Odometer({ value }: { value: number | undefined }) {
  const [shown, setShown] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const tickedRef = useRef(false);

  useEffect(() => {
    if (value == null) return;

    if (tickedRef.current) {
      setShown(value);
      return;
    }
    tickedRef.current = true;

    // Nothing to roll from on an empty counter — just show it.
    if (value <= 0) {
      setShown(value);
      return;
    }

    setShown(value - 1);
    setRolling(true);
    const toValue = window.setTimeout(() => setShown(value), 500);
    const toIdle = window.setTimeout(() => setRolling(false), 900);
    return () => {
      window.clearTimeout(toValue);
      window.clearTimeout(toIdle);
    };
  }, [value]);

  // Server unreachable, or stats still in flight — the button is the point, so
  // drop the counter rather than putting an error box on someone's desktop.
  if (shown == null) return null;

  const digits = String(Math.max(0, shown)).padStart(ODO_DIGITS, "0").slice(-ODO_DIGITS);

  return (
    <div>
      <div className="wb-stand-caption">you are visitor</div>
      <div className="wb-odometer" role="img" aria-label={`Visitor number ${shown}`}>
        {digits.split("").map((d, i) => (
          <span
            key={i}
            className={`wb-odo-digit${rolling && i === digits.length - 1 ? " is-rolling" : ""}`}
            aria-hidden
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

function truncate(s: string, max: number): string {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/** Called by the guestbook app after a successful signature. */
export function markSigned() {
  writeFlag(KEY_SIGNED, true);
}

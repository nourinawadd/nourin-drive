"use client";

import { useWindowStore } from "@/context/windowStore";
import { mobileSupport } from "@/data/appRegistry";
import { DRIVES, type Drive } from "@/data/drives";
import { playSfx } from "@/lib/sfx";
import type { AppId } from "@/types/window";

// The drives worth showing on a phone: anything whose app isn't hidden, which
// includes `fallback` apps (they hand off somewhere phone-friendly, but still
// belong in the grid). Drives with no app (Sticky Notes) are left out - their
// custom action has nothing to land on without the desktop. Both the registry
// and the drive list are static, so this is worked out once.
const PHONE_DRIVES = DRIVES.filter(
  (d): d is Drive & { appId: AppId } =>
    d.appId !== undefined && mobileSupport(d.appId) !== "hidden",
);

/**
 * The phone's home screen: the same volumes as the desktop's DriveColumn, in
 * the same order with the same art, as a grid. A single tap opens - there's no
 * selection state to give a first tap meaning on a touch screen. It plays the
 * same "launch" sound the desktop's double-click does; SfxEngine adds the
 * window-open sound itself once the store changes.
 */
export function PhoneLauncher() {
  const openApp = useWindowStore((s) => s.openApp);

  if (PHONE_DRIVES.length === 0) {
    return (
      <div className="wb-phone-card">
        <h2>Nothing mounted yet</h2>
        <p>None of the apps work on a phone so far.</p>
      </div>
    );
  }

  return (
    <nav className="wb-phone-grid" aria-label="Apps">
      {PHONE_DRIVES.map((d) => (
        <button
          key={d.id}
          type="button"
          className="wb-phone-drive"
          onClick={() => {
            playSfx("launch");
            openApp(d.appId);
          }}
        >
          <span className="wb-phone-drive-icon">
            <d.Icon />
          </span>
          <span className="wb-phone-drive-label">{d.label}</span>
        </button>
      ))}
    </nav>
  );
}

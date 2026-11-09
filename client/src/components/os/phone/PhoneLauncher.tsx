"use client";

import { useState } from "react";
import { ContextMenu, type MenuItem } from "@/components/os/ContextMenu";
import { useWindowStore } from "@/context/windowStore";
import { mobileSupport } from "@/data/appRegistry";
import { DRIVES, type Drive } from "@/data/drives";
import { playSfx } from "@/lib/sfx";
import { useContextTrigger, type ContextPoint } from "@/lib/useContextTrigger";
import type { AppId } from "@/types/window";

type PhoneDriveDef = Drive & { appId: AppId };

// The drives worth showing on a phone: anything whose app isn't hidden, which
// includes `fallback` apps (they hand off somewhere phone-friendly, but still
// belong in the grid). Drives with no app (Sticky Notes) are left out - their
// custom action has nothing to land on without the desktop. Both the registry
// and the drive list are static, so this is worked out once.
const PHONE_DRIVES = DRIVES.filter(
  (d): d is PhoneDriveDef => d.appId !== undefined && mobileSupport(d.appId) !== "hidden",
);

/**
 * The phone's home screen: the same volumes as the desktop's DriveColumn, in
 * the same order with the same art, as a grid. A single tap opens - there's no
 * selection state to give a first tap meaning on a touch screen. It plays the
 * same "launch" sound the desktop's double-click does; SfxEngine adds the
 * window-open sound itself once the store changes.
 *
 * A long press opens the drive's menu as an action sheet. It's the first real
 * user of useContextTrigger and the phone ContextMenu, and the pattern the
 * converted apps follow.
 */
export function PhoneLauncher() {
  const openApp = useWindowStore((s) => s.openApp);
  const [menu, setMenu] = useState<{ drive: PhoneDriveDef; point: ContextPoint } | null>(null);

  const open = (drive: PhoneDriveDef) => {
    playSfx("launch");
    openApp(drive.appId);
  };

  if (PHONE_DRIVES.length === 0) {
    return (
      <div className="wb-phone-card">
        <h2>Nothing mounted yet</h2>
        <p>None of the apps work on a phone so far.</p>
      </div>
    );
  }

  const menuItems: MenuItem[] = menu
    ? [
        { kind: "item", label: "Open", onSelect: () => open(menu.drive) },
        { kind: "separator" },
        // A full reload, so the override is recorded for the tab (see PhoneBar).
        { kind: "item", label: "Switch to the desktop", onSelect: () => window.location.assign("/?mode=desktop") },
      ]
    : [];

  return (
    <>
      <nav className="wb-phone-grid" aria-label="Apps">
        {PHONE_DRIVES.map((d) => (
          <PhoneDrive
            key={d.id}
            drive={d}
            onOpen={() => open(d)}
            onMenu={(point) => setMenu({ drive: d, point })}
          />
        ))}
      </nav>
      {menu && (
        <ContextMenu
          x={menu.point.clientX}
          y={menu.point.clientY}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}

// Its own component because useContextTrigger is a hook, and a hook can't be
// called once per item inside the grid's .map().
function PhoneDrive({ drive, onOpen, onMenu }: {
  drive: PhoneDriveDef;
  onOpen: () => void;
  onMenu: (point: ContextPoint) => void;
}) {
  const trigger = useContextTrigger(onMenu);
  return (
    <button
      type="button"
      className="wb-phone-drive wb-pressable"
      {...trigger}
      onClick={onOpen}
    >
      <span className="wb-phone-drive-icon">
        <drive.Icon />
      </span>
      <span className="wb-phone-drive-label">{drive.label}</span>
    </button>
  );
}

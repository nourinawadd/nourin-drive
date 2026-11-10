"use client";

import { useEffect, useState } from "react";
import { useIsPhone } from "@/components/os/ShellModeProvider";
import { hasDeepLink } from "@/lib/deepLink";

export function BootScreen({ onBoot }: { onBoot: () => void }) {
  const [visible, setVisible] = useState(true);
  // The phone shell mounts this same screen, and nobody clicks on a phone.
  // Everywhere else (the desktop) the mode isn't "phone", so it still says click.
  const phone = useIsPhone();

  function boot() {
    setVisible(false);
    onBoot();
  }

  // A shared ?doc= / ?post= / ?photo= link is a request for one specific thing,
  // so it opens straight onto it rather than making the visitor boot first.
  useEffect(() => {
    if (hasDeepLink()) boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className="wb-boot">
      <div className="wb-boot-card">
        <h1>Kickstart 3.31</h1>
        <button
          type="button"
          className="wb-boot-drive"
          onClick={boot}
          aria-label="Insert the Workbench disk and boot"
          autoFocus
        >
          <span className="wb-disk" aria-hidden />
        </button>
        <p>Insert Workbench disk</p>
        <p>in any drive</p>
        <div className="wb-boot-hint">
          {phone ? "tap the disk to continue" : "click the disk to continue"}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const AUTO_DISMISS_MS = 2200;

export function BootScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="wb-boot"
      onClick={() => setVisible(false)}
    >
      <div className="wb-boot-card">
        <h1>Kickstart 3.31</h1>
        <div className="wb-disk" aria-hidden />
        <p>Insert Workbench disk</p>
        <p>in any drive</p>
        <div className="wb-boot-hint">click anywhere to continue</div>
      </div>
    </div>
  );
}

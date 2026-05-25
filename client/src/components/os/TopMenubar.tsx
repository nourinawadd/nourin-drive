"use client";

import { useEffect, useState } from "react";

const MENU = ["Workbench", "Window", "Icons", "Tools"];

// Amiga-style "free chip / free fast" memory readout. Pure flavour.
const GRAPHICS_MEM = 782_400;
const OTHER_MEM = 2_812_768;

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function useClock(): string | null {
  // null on first render so server + client markup match (no hydration warning).
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function TopMenubar() {
  const clock = useClock();
  return (
    <div className="wb-menubar" role="menubar">
      <div className="wb-menu-items">
        {MENU.map((m) => (
          <div key={m} className="wb-menu-item" role="menuitem">
            {m}
          </div>
        ))}
      </div>
      <div className="wb-menu-spacer" />
      <div className="wb-mem">
        {fmt(GRAPHICS_MEM)} graphics mem &nbsp;·&nbsp; {fmt(OTHER_MEM)} other mem
        {clock && <> &nbsp;·&nbsp; {clock}</>}
      </div>
    </div>
  );
}

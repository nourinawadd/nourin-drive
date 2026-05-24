"use client";

const MENU = ["Workbench", "Window", "Icons", "Tools"];

// Amiga-style "free chip / free fast" memory readout. Pure flavour.
const GRAPHICS_MEM = 782_400;
const OTHER_MEM = 2_812_768;

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

export function TopMenubar() {
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
      </div>
    </div>
  );
}

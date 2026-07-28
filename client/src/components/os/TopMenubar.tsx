"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowStore } from "@/context/windowStore";

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

type Entry = { label: string; run: () => void } | "sep";
type Menu = { name: string; items: Entry[] };

// Batch helpers operate on the live store snapshot.
function minimizeAll() {
  const { windows, minimize } = useWindowStore.getState();
  windows.filter((w) => !w.minimized).forEach((w) => minimize(w.id));
}
function restoreAll() {
  const { windows, restore } = useWindowStore.getState();
  windows.filter((w) => w.minimized).forEach((w) => restore(w.id));
}
function closeAll() {
  const { windows, closeWin } = useWindowStore.getState();
  [...windows].forEach((w) => closeWin(w.id));
}
function cascade() {
  const { windows, updateBounds, focus } = useWindowStore.getState();
  windows
    .filter((w) => !w.minimized)
    .forEach((w, i) => {
      updateBounds(w.id, { x: 60 + i * 28, y: 40 + i * 28 });
      focus(w.id);
    });
}

export function TopMenubar() {
  const clock = useClock();
  const openApp = useWindowStore((s) => s.openApp);
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const menus: Menu[] = [
    {
      name: "Workbench",
      items: [
        { label: "About This Site", run: () => openApp("about") },
        { label: "Guestbook", run: () => openApp("guestbook") },
        "sep",
        { label: "Reboot", run: () => window.location.reload() },
      ],
    },
    {
      name: "Window",
      items: [
        { label: "Cascade Windows", run: cascade },
        { label: "Minimize All", run: minimizeAll },
        { label: "Restore All", run: restoreAll },
        "sep",
        { label: "Close All", run: closeAll },
      ],
    },
    {
      name: "Icons",
      items: [
        { label: "Clean Up", run: () => window.dispatchEvent(new Event("wb:cleanup-icons")) },
        { label: "Open Recycle Bin", run: () => openApp("recycle") },
      ],
    },
    {
      name: "Tools",
      items: [
        { label: "Browser", run: () => openApp("browser") },
        { label: "File Explorer", run: () => openApp("explorer") },
        { label: "Notepad", run: () => openApp("notepad") },
        { label: "Ereader", run: () => openApp("ereader") },
        { label: "API Studio", run: () => openApp("apis") },
        { label: "Music Player", run: () => openApp("music") },
      ],
    },
  ];

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="wb-menubar" role="menubar" ref={barRef}>
      <div className="wb-menu-items">
        {menus.map((m) => (
          <div
            key={m.name}
            className={`wb-menu-item${open === m.name ? " is-open" : ""}`}
            role="menuitem"
            onClick={() => setOpen((cur) => (cur === m.name ? null : m.name))}
            onMouseEnter={() => open && setOpen(m.name)}
          >
            {m.name}
            {open === m.name && (
              <div className="wb-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                {m.items.map((it, i) =>
                  it === "sep" ? (
                    <div key={i} className="wb-menu-sep" />
                  ) : (
                    <button
                      key={it.label}
                      className="wb-menu-action"
                      onClick={() => {
                        it.run();
                        setOpen(null);
                      }}
                    >
                      {it.label}
                    </button>
                  ),
                )}
              </div>
            )}
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

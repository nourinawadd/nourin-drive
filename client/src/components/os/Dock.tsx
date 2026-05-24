"use client";

import { useWindowStore } from "@/context/windowStore";
import type { AppId } from "@/types/window";

const ITEMS: { id: string; glyph: string; title: string; appId: AppId }[] = [
  { id: "browser",  glyph: "WWW", title: "Browser",            appId: "browser" },
  { id: "explorer", glyph: "DIR", title: "File Explorer",      appId: "explorer" },
  { id: "notepad",  glyph: "TXT", title: "Notepad / Guestbook", appId: "notepad" },
  { id: "apis",     glyph: "API", title: "API Studio",         appId: "apis" },
  { id: "trash",    glyph: "DEL", title: "Recycle Bin",        appId: "recycle" },
];

export function Dock() {
  const openApp = useWindowStore((s) => s.openApp);
  return (
    <div className="wb-dock" role="toolbar" aria-label="Dock">
      {ITEMS.map((it) => (
        <div
          key={it.id}
          className="wb-dock-item"
          title={it.title}
          style={{ fontSize: 10, letterSpacing: 1 }}
          onClick={() => openApp(it.appId)}
        >
          {it.glyph}
        </div>
      ))}
    </div>
  );
}

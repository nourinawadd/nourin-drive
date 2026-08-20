"use client";

import { useWindowStore } from "@/context/windowStore";
import type { AppId } from "@/types/window";
import {
  DockGlobe,
  DockDrawerMag,
  DockNote,
  DockBook,
  DockQuill,
  DockTerminal,
  DockMusic,
  DockTrash,
} from "@/components/os/icons";
import type { ComponentType } from "react";

const ITEMS: { id: string; Icon: ComponentType; title: string; appId: AppId }[] = [
  { id: "browser",  Icon: DockGlobe,     title: "Browser",             appId: "browser" },
  { id: "explorer", Icon: DockDrawerMag, title: "File Explorer",       appId: "explorer" },
  { id: "guestbook", Icon: DockNote,     title: "Guestbook",           appId: "guestbook" },
  { id: "ereader",  Icon: DockBook,      title: "Ereader",             appId: "ereader" },
  { id: "blog",     Icon: DockQuill,     title: "Blog",                appId: "blog" },
  { id: "apis",     Icon: DockTerminal,  title: "API Studio",          appId: "apis" },
  { id: "terminal", Icon: DockTerminal,  title: "Shell",               appId: "terminal" },
  { id: "music",    Icon: DockMusic,     title: "Music Player",        appId: "music" },
  { id: "trash",    Icon: DockTrash,     title: "Recycle Bin",         appId: "recycle" },
];

export function Dock() {
  const openApp = useWindowStore((s) => s.openApp);
  return (
    <div className="wb-dock" role="toolbar" aria-label="Dock">
      {ITEMS.map((it) => (
        <div
          key={it.id}
          className="wb-dock-item"
          data-label={it.title}
          onClick={() => openApp(it.appId)}
        >
          <it.Icon />
        </div>
      ))}
    </div>
  );
}

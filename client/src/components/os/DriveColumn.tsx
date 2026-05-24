"use client";

import { useState } from "react";
import { useWindowStore } from "@/context/windowStore";
import type { AppId } from "@/types/window";

const DRIVES: { id: string; label: string; appId: AppId }[] = [
  { id: "work",     label: "Work:",     appId: "about" },
  { id: "projects", label: "Projects:", appId: "explorer" },
  { id: "games",    label: "Games:",    appId: "games" },
  { id: "photos",   label: "Photos:",   appId: "gallery" },
  { id: "trash",    label: "Trash:",    appId: "recycle" },
];

export function DriveColumn() {
  const [selected, setSelected] = useState<string | null>(null);
  const openApp = useWindowStore((s) => s.openApp);

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        top: 32,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setSelected(null);
      }}
    >
      {DRIVES.map((d) => (
        <div
          key={d.id}
          className={`wb-drive${selected === d.id ? " is-selected" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelected(d.id);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            openApp(d.appId);
          }}
        >
          <div className="wb-drive-icon" />
          <div className="wb-drive-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

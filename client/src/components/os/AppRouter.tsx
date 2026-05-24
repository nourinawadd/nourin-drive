"use client";

import { APIStudio } from "@/components/apps/APIStudio";
import { Browser } from "@/components/apps/Browser";
import { Explorer } from "@/components/apps/Explorer";
import { Gallery } from "@/components/apps/Gallery";
import { Games } from "@/components/apps/Games";
import { Notepad } from "@/components/apps/Notepad";
import { RecycleBin } from "@/components/apps/RecycleBin";
import { Stub } from "@/components/apps/Stub";
import type { WindowInstance } from "@/types/window";

// Maps a window's appId to the component that renders its body.
// Stubs are replaced as later sections add real apps.
export function AppRouter({ win }: { win: WindowInstance }) {
  switch (win.appId) {
    case "about":       return <Stub name="About Me" section={7} />;
    case "apis":        return <APIStudio />;
    case "blog":        return <Stub name="Blog" section={6} />;
    case "browser":     return <Browser payload={win.payload} />;
    case "easter-egg":  return <EasterEggStub />;
    case "explorer":    return <Explorer />;
    case "gallery":     return <Gallery payload={win.payload} />;
    case "games":       return <Games />;
    case "guestbook":   return <Stub name="Guestbook" section={6} />;
    case "notepad":     return <Notepad payload={win.payload} />;
    case "recycle":     return <RecycleBin />;
    default:            return null;
  }
}

function EasterEggStub() {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
      <span style={{ fontSize: 14 }}>you found it.</span>
    </div>
  );
}

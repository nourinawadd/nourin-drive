"use client";

import { Stub } from "@/components/apps/Stub";
import type { WindowInstance } from "@/types/window";

// Maps a window's appId to the component that renders its body.
// Replace each Stub with the real app component in later sections.
export function AppRouter({ win }: { win: WindowInstance }) {
  switch (win.appId) {
    case "about":       return <Stub name="About Me" section={7} />;
    case "apis":        return <Stub name="API Studio" section={4} />;
    case "blog":        return <Stub name="Blog" section={6} />;
    case "browser":     return <Stub name="Browser" section={4} />;
    case "easter-egg":  return <EasterEggStub />;
    case "explorer":    return <Stub name="File Explorer" section={5} />;
    case "gallery":     return <Stub name="Graphic Design" section={5} />;
    case "games":       return <Stub name="Games" section={5} />;
    case "guestbook":   return <Stub name="Guestbook" section={6} />;
    case "notepad":     return <Stub name="Notepad" section={6} />;
    case "recycle":     return <Stub name="Recycle Bin" section={5} />;
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

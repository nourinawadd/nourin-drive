"use client";

import { About } from "@/components/apps/About";
import { APIStudio } from "@/components/apps/APIStudio";
import { Blog } from "@/components/apps/Blog";
import { Browser } from "@/components/apps/Browser";
import { EasterEgg } from "@/components/apps/EasterEgg";
import { Explorer } from "@/components/apps/Explorer";
import { Gallery } from "@/components/apps/Gallery";
import { GamePlayer } from "@/components/apps/GamePlayer";
import { Games } from "@/components/apps/Games";
import { Guestbook } from "@/components/apps/Guestbook";
import { Music } from "@/components/apps/Music";
import { Notepad } from "@/components/apps/Notepad";
import { Profile } from "@/components/apps/Profile";
import { RecycleBin } from "@/components/apps/RecycleBin";
import type { WindowInstance } from "@/types/window";

// Maps a window's appId to the component that renders its body.
export function AppRouter({ win }: { win: WindowInstance }) {
  switch (win.appId) {
    case "about":       return <About />;
    case "apis":        return <APIStudio />;
    case "blog":        return <Blog />;
    case "browser":     return <Browser winId={win.id} payload={win.payload} />;
    case "easter-egg":  return <EasterEgg />;
    case "explorer":    return <Explorer />;
    case "gallery":     return <Gallery payload={win.payload} />;
    case "game":        return <GamePlayer payload={win.payload} />;
    case "games":       return <Games />;
    case "guestbook":   return <Guestbook />;
    case "music":       return <Music winId={win.id} />;
    case "notepad":     return <Notepad payload={win.payload} />;
    case "profile":     return <Profile />;
    case "recycle":     return <RecycleBin />;
    default:            return null;
  }
}

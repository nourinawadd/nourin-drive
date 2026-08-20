"use client";

import { AboutSite } from "@/components/apps/AboutSite";
import { APIStudio } from "@/components/apps/APIStudio";
import { Blog } from "@/components/apps/Blog";
import { Browser } from "@/components/apps/Browser";
import { Ereader } from "@/components/apps/ereader/Ereader";
import { Explorer } from "@/components/apps/Explorer";
import { Gallery } from "@/components/apps/Gallery";
import { GamePlayer } from "@/components/apps/GamePlayer";
import { Games } from "@/components/apps/Games";
import { Guestbook } from "@/components/apps/Guestbook";
import { Music } from "@/components/apps/music/Music";
import { PaletteEditor } from "@/components/apps/prefs/PaletteEditor";
import { PatternEditor } from "@/components/apps/prefs/PatternEditor";
import { PetEditor } from "@/components/apps/prefs/PetEditor";
import { PrefsDrawer } from "@/components/apps/prefs/PrefsDrawer";
import { ScreensaverEditor } from "@/components/apps/prefs/ScreensaverEditor";
import { Profile } from "@/components/apps/Profile";
import { Properties } from "@/components/apps/Properties";
import { RecycleBin } from "@/components/apps/RecycleBin";
import { Terminal } from "@/components/apps/terminal/Terminal";
import type { WindowInstance } from "@/types/window";

// Maps a window's appId to the component that renders its body.
export function AppRouter({ win }: { win: WindowInstance }) {
  switch (win.appId) {
    case "readme":      return <AboutSite />;
    case "apis":        return <APIStudio />;
    case "blog":        return <Blog winId={win.id} payload={win.payload} />;
    case "browser":     return <Browser winId={win.id} payload={win.payload} />;
    case "ereader":     return <Ereader winId={win.id} payload={win.payload} />;
    case "explorer":    return <Explorer winId={win.id} payload={win.payload} />;
    case "gallery":     return <Gallery payload={win.payload} />;
    case "game":        return <GamePlayer winId={win.id} payload={win.payload} />;
    case "games":       return <Games />;
    case "guestbook":   return <Guestbook />;
    case "music":       return <Music winId={win.id} payload={win.payload} />;
    case "prefs":       return <PrefsDrawer />;
    case "prefs-palette": return <PaletteEditor />;
    case "prefs-pattern": return <PatternEditor />;
    case "prefs-screensaver": return <ScreensaverEditor />;
    case "prefs-pet": return <PetEditor />;
    case "profile":     return <Profile />;
    case "properties":  return <Properties winId={win.id} payload={win.payload} />;
    case "recycle":     return <RecycleBin />;
    case "terminal":    return <Terminal winId={win.id} payload={win.payload} />;
    default:            return null;
  }
}

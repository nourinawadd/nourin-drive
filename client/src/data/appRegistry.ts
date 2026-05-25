import type { AppDef, AppId } from "@/types/window";

// Defaults per app. Window manager uses singleton flag to decide whether
// opening an app twice spawns a new window or focuses the existing one.
export const APP_REGISTRY: Record<AppId, AppDef> = {
  about: {
    appId: "about", title: "About Me",
    defaultWidth: 540, defaultHeight: 460,
    defaultX: 140, defaultY: 60,
    singleton: true,
  },
  apis: {
    appId: "apis", title: "API Studio",
    defaultWidth: 620, defaultHeight: 420,
    defaultX: 120, defaultY: 70,
    singleton: true,
  },
  blog: {
    appId: "blog", title: "Blog",
    defaultWidth: 560, defaultHeight: 420,
    defaultX: 160, defaultY: 90,
    singleton: true,
  },
  browser: {
    appId: "browser", title: "Browser",
    defaultWidth: 720, defaultHeight: 460,
    defaultX: 100, defaultY: 60,
    singleton: false,
  },
  "easter-egg": {
    appId: "easter-egg", title: "???",
    defaultWidth: 320, defaultHeight: 200,
    defaultX: 240, defaultY: 140,
    singleton: true,
  },
  explorer: {
    appId: "explorer", title: "File Explorer",
    defaultWidth: 540, defaultHeight: 380,
    defaultX: 110, defaultY: 80,
    singleton: true,
  },
  gallery: {
    appId: "gallery", title: "Graphic Design",
    defaultWidth: 600, defaultHeight: 440,
    defaultX: 130, defaultY: 70,
    singleton: true,
  },
  games: {
    appId: "games", title: "Games",
    defaultWidth: 520, defaultHeight: 380,
    defaultX: 150, defaultY: 100,
    singleton: true,
  },
  guestbook: {
    appId: "guestbook", title: "Guestbook",
    defaultWidth: 460, defaultHeight: 360,
    defaultX: 200, defaultY: 110,
    singleton: true,
  },
  notepad: {
    appId: "notepad", title: "Notepad",
    defaultWidth: 420, defaultHeight: 300,
    defaultX: 180, defaultY: 120,
    singleton: false,
  },
  recycle: {
    appId: "recycle", title: "Recycle Bin",
    defaultWidth: 460, defaultHeight: 320,
    defaultX: 170, defaultY: 90,
    singleton: true,
  },
};

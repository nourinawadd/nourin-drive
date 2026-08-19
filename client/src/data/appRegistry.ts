import type { AppDef, AppId } from "@/types/window";

// Defaults per app. Window manager uses singleton flag to decide whether
// opening an app twice spawns a new window or focuses the existing one.
//
// Open size and position are derived from the viewport in lib/windowBounds.ts,
// so every app scales with the display. Per-app minWidth / minHeight are the
// floor: they constrain how far the user can shrink a window, and stop the
// viewport ratio from opening one smaller than it can usefully be.

export const APP_REGISTRY: Record<AppId, AppDef> = {
  readme: {
    appId: "readme", title: "About This Site",
    fixed: { width: 1180, height: 520 },
    singleton: true,
  },
  apis: {
    appId: "apis", title: "API Studio",
    singleton: true,
  },
  blog: {
    appId: "blog", title: "Blog",
    singleton: true,
  },
  browser: {
    appId: "browser", title: "Browser",
    singleton: true,
  },
  ereader: {
    appId: "ereader", title: "Ereader",
    minWidth: 480, minHeight: 360,
    // Not a singleton: reading two things at once is the whole point of having
    // a window manager, and each window carries its own document + page.
    singleton: false,
  },
  explorer: {
    appId: "explorer", title: "File Explorer",
    minWidth: 520, minHeight: 320,
    singleton: true,
  },
  gallery: {
    appId: "gallery", title: "Graphic Design",
    minWidth: 380, minHeight: 320,
    singleton: true,
  },
  game: {
    appId: "game", title: "Game",
    minWidth: 320, minHeight: 240,
    singleton: false,
  },
  games: {
    appId: "games", title: "Games",
    singleton: true,
  },
  guestbook: {
    appId: "guestbook", title: "Guestbook",
    singleton: true,
  },
  music: {
    appId: "music", title: "Music Player",
    minWidth: 260, minHeight: 116,
    singleton: true,
  },
  prefs: {
    appId: "prefs", title: "Prefs",
    minWidth: 260, minHeight: 200,
    preferred: { width: 360, height: 260 },
    singleton: true,
  },
  "prefs-palette": {
    appId: "prefs-palette", title: "Palette",
    minWidth: 380, minHeight: 240,
    preferred: { width: 580, height: 400 },
    singleton: true,
  },
  "prefs-pattern": {
    appId: "prefs-pattern", title: "WBPattern",
    minWidth: 380, minHeight: 240,
    preferred: { width: 580, height: 300 },
    singleton: true,
  },
  profile: {
    appId: "profile", title: "User Profile",
    minWidth: 480, minHeight: 400,
    singleton: true,
  },
  properties: {
    appId: "properties", title: "Properties",
    minWidth: 260, minHeight: 260,
    // Not a singleton: Windows lets you open properties for several items at
    // once, and each window carries its own item in its payload.
    singleton: false,
  },
  recycle: {
    appId: "recycle", title: "Recycle Bin",
    singleton: true,
  },
};

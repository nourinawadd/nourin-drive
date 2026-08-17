import type { AppDef, AppId } from "@/types/window";

// Defaults per app. Window manager uses singleton flag to decide whether
// opening an app twice spawns a new window or focuses the existing one.
//
// Windows open at a uniform size - small defaults looked cramped on a large
// display. Change WINDOW_W/H to resize every app at once; per-app minWidth /
// minHeight still constrain how far the user can shrink them.
const WINDOW_W = 940;
const WINDOW_H = 560;
// Uniform spawn point too. Every window is the same size now, so a per-app
// origin would only push the wider ones off the right edge - openApp already
// cascades stacked opens by 20px each.
const WINDOW_X = 96;
const WINDOW_Y = 46;

export const APP_REGISTRY: Record<AppId, AppDef> = {
  about: {
    appId: "about", title: "About Me",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    singleton: true,
  },
  apis: {
    appId: "apis", title: "API Studio",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    singleton: true,
  },
  blog: {
    appId: "blog", title: "Blog",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    singleton: true,
  },
  browser: {
    appId: "browser", title: "Browser",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    singleton: true,
  },
  "easter-egg": {
    appId: "easter-egg", title: "???",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    singleton: true,
  },
  ereader: {
    appId: "ereader", title: "Ereader",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    minWidth: 480, minHeight: 360,
    // Not a singleton: reading two things at once is the whole point of having
    // a window manager, and each window carries its own document + page.
    singleton: false,
  },
  explorer: {
    appId: "explorer", title: "File Explorer",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    minWidth: 520, minHeight: 320,
    singleton: true,
  },
  gallery: {
    appId: "gallery", title: "Graphic Design",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    minWidth: 380, minHeight: 320,
    singleton: true,
  },
  game: {
    appId: "game", title: "Game",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    minWidth: 320, minHeight: 240,
    singleton: false,
  },
  games: {
    appId: "games", title: "Games",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    singleton: true,
  },
  guestbook: {
    appId: "guestbook", title: "Guestbook",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    singleton: true,
  },
  music: {
    appId: "music", title: "Music Player",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    minWidth: 260, minHeight: 116,
    singleton: true,
  },
  profile: {
    appId: "profile", title: "User Profile",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    minWidth: 480, minHeight: 400,
    singleton: true,
  },
  properties: {
    appId: "properties", title: "Properties",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    minWidth: 260, minHeight: 260,
    // Not a singleton: Windows lets you open properties for several items at
    // once, and each window carries its own item in its payload.
    singleton: false,
  },
  recycle: {
    appId: "recycle", title: "Recycle Bin",
    defaultWidth: WINDOW_W, defaultHeight: WINDOW_H,
    defaultX: WINDOW_X, defaultY: WINDOW_Y,
    singleton: true,
  },
};

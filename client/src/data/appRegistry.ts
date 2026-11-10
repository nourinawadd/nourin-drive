import type { AppDef, AppId, MobileSupport } from "@/types/window";

// Defaults per app. Window manager uses singleton flag to decide whether
// opening an app twice spawns a new window or focuses the existing one.
//
// `mobile` says what the phone shell does with each app. Everything starts
// hidden; each mobile phase flips its apps once they actually work on a phone,
// so the shell never offers something half-done.
//
// Open size and position are derived from the viewport in lib/windowBounds.ts,
// so every app scales with the display. Per-app minWidth / minHeight are the
// floor: they constrain how far the user can shrink a window, and stop the
// viewport ratio from opening one smaller than it can usefully be.

export const APP_REGISTRY: Record<AppId, AppDef> = {
  readme: {
    appId: "readme", title: "About This Site",
    fixed: { width: 1180, height: 520 },
    // The phone shell's smoke test since Phase 1; laid out properly in Phase 3.
    mobile: "native",
    singleton: true,
  },
  apis: {
    appId: "apis", title: "API Studio",
    mobile: "hidden",
    singleton: true,
  },
  blog: {
    appId: "blog", title: "Blog",
    // A fallback since Phase 3: the phone hands off to the blog's own site
    // (BlogHandoff) instead of framing it.
    mobile: "fallback",
    singleton: true,
  },
  moderation: {
    appId: "moderation", title: "Moderation",
    minWidth: 460, minHeight: 320,
    mobile: "hidden",
    singleton: true,
  },
  browser: {
    appId: "browser", title: "Browser",
    mobile: "hidden",
    singleton: true,
  },
  ereader: {
    appId: "ereader", title: "Ereader",
    minWidth: 480, minHeight: 360,
    // Not a singleton: reading two things at once is the whole point of having
    // a window manager, and each window carries its own document + page.
    mobile: "native",
    singleton: false,
  },
  explorer: {
    appId: "explorer", title: "File Explorer",
    minWidth: 520, minHeight: 320,
    mobile: "native",
    singleton: true,
  },
  gallery: {
    appId: "gallery", title: "Graphic Design",
    minWidth: 380, minHeight: 320,
    mobile: "native",
    singleton: true,
  },
  game: {
    appId: "game", title: "Game",
    minWidth: 320, minHeight: 240,
    mobile: "hidden",
    singleton: false,
  },
  games: {
    appId: "games", title: "Games",
    // A fallback since Phase 5: the list works on a phone, but Play opens the
    // game's itch.io page in a tab (phoneRedirects) instead of a WebGL window.
    mobile: "fallback",
    singleton: true,
  },
  guestbook: {
    appId: "guestbook", title: "Guestbook",
    mobile: "native",
    singleton: true,
  },
  music: {
    appId: "music", title: "Music Player",
    minWidth: 260, minHeight: 116,
    mobile: "native",
    singleton: true,
  },
  prefs: {
    appId: "prefs", title: "Prefs",
    minWidth: 260, minHeight: 200,
    preferred: { width: 360, height: 260 },
    // Native since Phase 5, offering only Palette and WBPattern; ScreenSaver
    // and Pet are desktop features and stay hidden.
    mobile: "native",
    singleton: true,
  },
  "prefs-palette": {
    appId: "prefs-palette", title: "Palette",
    minWidth: 380, minHeight: 240,
    preferred: { width: 580, height: 400 },
    mobile: "native",
    singleton: true,
  },
  "prefs-pattern": {
    appId: "prefs-pattern", title: "WBPattern",
    minWidth: 380, minHeight: 240,
    preferred: { width: 580, height: 300 },
    mobile: "native",
    singleton: true,
  },
  "prefs-screensaver": {
    appId: "prefs-screensaver", title: "ScreenSaver",
    minWidth: 400, minHeight: 260,
    preferred: { width: 580, height: 330 },
    mobile: "hidden",
    singleton: true,
  },
  "prefs-pet": {
    appId: "prefs-pet", title: "Pet",
    minWidth: 400, minHeight: 280,
    preferred: { width: 580, height: 360 },
    mobile: "hidden",
    singleton: true,
  },
  profile: {
    appId: "profile", title: "User Profile",
    minWidth: 480, minHeight: 400,
    mobile: "native",
    singleton: true,
  },
  properties: {
    appId: "properties", title: "Properties",
    minWidth: 260, minHeight: 260,
    // Not a singleton: Windows lets you open properties for several items at
    // once, and each window carries its own item in its payload.
    mobile: "native",
    singleton: false,
  },
  terminal: {
    appId: "terminal", title: "Shell",
    minWidth: 420, minHeight: 260,
    preferred: { width: 760, height: 460 },
    mobile: "hidden",
    singleton: false,
  },
  recycle: {
    appId: "recycle", title: "Recycle Bin",
    mobile: "hidden",
    singleton: true,
  },
};

/**
 * What the phone shell should do with an app. Falls back to "hidden" for an id
 * that isn't registered (a stale deep link, a typo in a payload), since hiding
 * is the one answer that can't put a broken app in front of a phone.
 */
export function mobileSupport(appId: AppId): MobileSupport {
  return APP_REGISTRY[appId]?.mobile ?? "hidden";
}

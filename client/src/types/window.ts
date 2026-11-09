export type AppId =
  | "readme"
  | "apis"
  | "blog"
  | "browser"
  | "ereader"
  | "explorer"
  | "gallery"
  | "game"
  | "games"
  | "guestbook"
  | "music"
  | "prefs"
  | "prefs-palette"
  | "prefs-pattern"
  | "prefs-screensaver"
  | "prefs-pet"
  | "profile"
  | "properties"
  | "terminal"
  | "recycle"
  | "moderation";

export type WindowInstance = {
  id: string;          // unique per open window
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;  // filling the desktop (Windows-style); x/y/w/h keep the restore bounds
  noMaximize?: boolean; // set by the app itself, e.g. the music mini player
  payload?: unknown;   // arbitrary per-instance data (e.g. the ereader's page)
};

/**
 * How an app behaves in the phone shell. `native`: it opens full-screen there
 * and has been made to work at phone size. `fallback`: it stays in the
 * launcher but hands off to something that works on a phone (the blog site,
 * an itch.io page). `hidden`: it's left out of the phone shell entirely.
 */
export type MobileSupport = "native" | "fallback" | "hidden";

export type AppDef = {
  appId: AppId;
  title: string;
  minWidth?: number;
  minHeight?: number;
  fixed?: { width: number; height: number };
  preferred?: { width: number; height: number };
  singleton: boolean;  // re-opening focuses existing instance
  // Required, not optional: a new app has to state its phone story up front
  // instead of quietly inheriting a default nobody chose for it.
  mobile: MobileSupport;
};

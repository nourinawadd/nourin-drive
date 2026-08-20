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
  | "profile"
  | "properties"
  | "terminal"
  | "recycle";

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

export type AppDef = {
  appId: AppId;
  title: string;
  minWidth?: number;
  minHeight?: number;
  fixed?: { width: number; height: number };
  preferred?: { width: number; height: number };
  singleton: boolean;  // re-opening focuses existing instance
};

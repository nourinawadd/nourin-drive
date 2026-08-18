export type AppId =
  | "readme"
  | "apis"
  | "blog"
  | "browser"
  | "easter-egg"
  | "ereader"
  | "explorer"
  | "gallery"
  | "game"
  | "games"
  | "guestbook"
  | "music"
  | "profile"
  | "properties"
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
  payload?: unknown;   // arbitrary per-instance data (e.g. the ereader's page)
};

export type AppDef = {
  appId: AppId;
  title: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultX: number;
  defaultY: number;
  minWidth?: number;
  minHeight?: number;
  singleton: boolean;  // re-opening focuses existing instance
};

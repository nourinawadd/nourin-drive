export type AppId =
  | "about"
  | "apis"
  | "blog"
  | "browser"
  | "easter-egg"
  | "explorer"
  | "gallery"
  | "game"
  | "games"
  | "guestbook"
  | "music"
  | "notepad"
  | "profile"
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
  payload?: unknown;   // arbitrary per-instance data (e.g. notepad text)
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

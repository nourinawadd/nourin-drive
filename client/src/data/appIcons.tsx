import type { ComponentType } from "react";
import type { AppId } from "@/types/window";
import {
  DockBook,
  DockDrawerMag,
  DockGlobe,
  DockInfo,
  DockJoystick,
  DockMusic,
  DockNote,
  DockPhoto,
  DockQuill,
  DockTerminal,
  DockTrash,
  DockUser,
} from "@/components/os/icons";

export const APP_ICONS: Record<AppId, ComponentType> = {
  apis: DockTerminal,
  blog: DockQuill,
  browser: DockGlobe,
  ereader: DockBook,
  explorer: DockDrawerMag,
  gallery: DockPhoto,
  game: DockJoystick,
  games: DockJoystick,
  guestbook: DockNote,
  music: DockMusic,
  // TODO(art): Prefs has no icons of its own yet - these three are borrowed.
  prefs: DockDrawerMag,
  "prefs-palette": DockPhoto,
  "prefs-pattern": DockPhoto,
  profile: DockUser,
  properties: DockInfo,
  readme: DockInfo,
  recycle: DockTrash,
  terminal: DockTerminal,
};

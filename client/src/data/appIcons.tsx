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
  "easter-egg": DockTerminal,
  ereader: DockBook,
  explorer: DockDrawerMag,
  gallery: DockPhoto,
  game: DockJoystick,
  games: DockJoystick,
  guestbook: DockNote,
  music: DockMusic,
  profile: DockUser,
  properties: DockInfo,
  readme: DockInfo,
  recycle: DockTrash,
};

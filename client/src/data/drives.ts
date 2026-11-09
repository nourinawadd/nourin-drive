import type { ComponentType } from "react";
import type { AppId } from "@/types/window";
import {
  IconFloppyUser,
  IconFloppySystem,
  IconDrawer,
  IconFloppyTerminal,
  IconFloppyJoystick,
  IconFloppyPhoto,
  IconFloppyNotepad,
  IconFloppyBook,
  IconFloppyQuill,
  IconFloppyMusic,
  IconFloppyGlobe,
  IconFloppyStickies,
  IconTrashcan,
} from "@/components/os/icons";

// The volumes mounted on the desktop, in display order. Shared by the desktop's
// DriveColumn and the phone launcher so both list the same drives with the same
// labels and art; each decides for itself how to lay them out and what to do on
// open.

export type Drive = { id: string; label: string; appId?: AppId; Icon: ComponentType };

// Every app that makes sense to launch cold gets a volume. The two that
// don't: `game` and `properties` only exist once something hands them a
// payload.
//
// `appId` opens an app window; a drive without one (Sticky Notes) runs a custom
// action on open instead - handled by whoever renders the drive.
export const DRIVES: Drive[] = [
  { id: "readme",    label: "Start Here:", appId: "readme",   Icon: IconFloppySystem },
  { id: "work",      label: "User:",      appId: "profile",   Icon: IconFloppyUser },
  { id: "projects",  label: "Projects:",  appId: "explorer",  Icon: IconDrawer },
  { id: "apis",      label: "APIs:",      appId: "apis",      Icon: IconFloppyTerminal },
  { id: "shell",     label: "Shell:",     appId: "terminal",  Icon: IconFloppyTerminal },
  { id: "games",     label: "Games:",     appId: "games",     Icon: IconFloppyJoystick },
  { id: "photos",    label: "Photos:",    appId: "gallery",   Icon: IconFloppyPhoto },
  { id: "blog",      label: "Blog:",      appId: "blog",      Icon: IconFloppyNotepad },
  { id: "library",   label: "Library:",   appId: "ereader",   Icon: IconFloppyBook },
  { id: "guestbook", label: "Guestbook:", appId: "guestbook", Icon: IconFloppyQuill },
  { id: "music",     label: "Music:",     appId: "music",     Icon: IconFloppyMusic },
  { id: "browser",   label: "Browser:",   appId: "browser",   Icon: IconFloppyGlobe },
  { id: "stickies",  label: "Sticky Notes:", Icon: IconFloppyStickies },
  // TODO(art): borrowing the drawer until Prefs gets its own volume icon.
  { id: "prefs",     label: "Prefs:",     appId: "prefs",     Icon: IconDrawer },
  { id: "trash",     label: "Trash:",     appId: "recycle",   Icon: IconTrashcan },
];

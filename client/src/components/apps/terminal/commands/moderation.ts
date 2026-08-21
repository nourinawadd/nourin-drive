import { useWindowStore } from "@/context/windowStore";
import type { Command } from "../types";

export const mod: Command = {
  name: "mod",
  group: "session",
  usage: "mod",
  blurb: "open the moderation window",
  run: (ctx) => {
    useWindowStore.getState().openApp("moderation");
    ctx.print("moderation opened", "note");
  },
};

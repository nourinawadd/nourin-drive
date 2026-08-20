import { useWindowStore } from "@/context/windowStore";
import type { Command, CommandGroup } from "./types";
import { pad } from "./types";
import { FILE_COMMANDS } from "./commands/files";
import { DESKTOP_COMMANDS } from "./commands/desktop";
import { NETWORK_COMMANDS } from "./commands/network";
import { ssh } from "./commands/ssh";

const GROUP_LABELS: Record<CommandGroup, string> = {
  files: "files",
  desktop: "desktop",
  network: "network",
  session: "session",
};

export const clear: Command = {
  name: "clear",
  group: "session",
  usage: "clear",
  blurb: "wipe the scrollback",
  run: (ctx) => ctx.clear(),
};

export const exit: Command = {
  name: "exit",
  group: "session",
  usage: "exit",
  blurb: "close this terminal window",
  run: (ctx) => useWindowStore.getState().closeWin(ctx.winId),
};

export const help: Command = {
  name: "help",
  group: "session",
  usage: "help [command]",
  blurb: "list commands, or explain one",
  run: (ctx) => {
    const target = (ctx.argv[1] ?? "").toLowerCase();

    if (target) {
      const found = lookup(target);
      if (!found) {
        ctx.print(`help: no command called "${ctx.argv[1]}"`, "err");
        return;
      }
      ctx.print(found.usage, "head");
      ctx.print(found.blurb);
      const aliases = Object.entries(ALIASES).filter(([, name]) => name === found.name);
      if (aliases.length) ctx.print(`also: ${aliases.map(([a]) => a).join(", ")}`, "note");
      return;
    }

    for (const group of Object.keys(GROUP_LABELS) as CommandGroup[]) {
      const inGroup = COMMANDS.filter((c) => c.group === group);
      if (!inGroup.length) continue;
      ctx.print(GROUP_LABELS[group], "head");
      ctx.print(inGroup.map((c) => `  ${pad(c.name, 12)}${c.blurb}`));
    }
    ctx.print("tab completes, up and down walk your history", "note");
  },
};

export const COMMANDS: Command[] = [
  ...FILE_COMMANDS,
  ...DESKTOP_COMMANDS,
  ...NETWORK_COMMANDS,
  ssh,
  help,
  clear,
  exit,
];

export const ALIASES: Record<string, string> = {
  dir: "ls",
  list: "ls",
  type: "cat",
  cls: "clear",
  quit: "exit",
  logout: "exit",
  man: "help",
  "?": "help",
  ps: "windows",
  cwd: "pwd",
  connect: "ssh",
};

const BY_NAME = new Map(COMMANDS.map((c) => [c.name, c]));

export function lookup(name: string): Command | undefined {
  const key = name.toLowerCase();
  return BY_NAME.get(key) ?? BY_NAME.get(ALIASES[key] ?? "");
}

export const COMMAND_NAMES: string[] = [
  ...COMMANDS.map((c) => c.name),
  ...Object.keys(ALIASES),
].sort();

import type { Chain } from "./vfs";

export type LineKind = "out" | "err" | "echo" | "note" | "head";

export type Line = { id: number; kind: LineKind; text: string };

export type TerminalMode = "shell" | "ssh";

export type TerminalPayload = {
  mode: TerminalMode;
  cwdId: string;
  host: string;
  lines: Line[];
  history: string[];
};

export type CommandGroup = "files" | "desktop" | "network" | "session";

export type Ctx = {
  argv: string[];
  raw: string;
  chain: Chain;
  winId: string;
  print: (text: string | string[], kind?: LineKind) => void;
  clear: () => void;
  setCwd: (folderId: string) => void;
  connect: (host: string) => void;
};

export type Command = {
  name: string;
  group: CommandGroup;
  usage: string;
  blurb: string;
  run: (ctx: Ctx) => void | Promise<void>;
};

export const MAX_LINES = 600;

export function pad(text: string, width: number): string {
  return text.length >= width ? `${text} ` : text + " ".repeat(width - text.length);
}

export function tokenize(raw: string): string[] {
  const out: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let open = false;

  for (const ch of raw) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      open = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current || open) out.push(current);
      current = "";
      open = false;
      continue;
    }
    current += ch;
  }
  if (current || open) out.push(current);
  return out;
}

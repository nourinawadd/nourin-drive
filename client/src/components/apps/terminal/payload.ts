import { FS_ROOT } from "@/data/fileTree";
import { useWindowStore } from "@/context/windowStore";
import { SSH_HOST } from "./commands/ssh";
import type { Line, LineKind, TerminalPayload } from "./types";
import { MAX_LINES } from "./types";

let nextLineId = 1;

export function makeLines(text: string | string[], kind: LineKind): Line[] {
  const items = Array.isArray(text) ? text : [text];
  return items.map((t) => ({ id: nextLineId++, kind, text: t }));
}

export function normalizePayload(payload: unknown): TerminalPayload {
  const p = (payload ?? {}) as Partial<TerminalPayload>;
  return {
    mode: p.mode === "ssh" ? "ssh" : "shell",
    cwdId: typeof p.cwdId === "string" ? p.cwdId : FS_ROOT.id,
    host: typeof p.host === "string" ? p.host : SSH_HOST,
    lines: Array.isArray(p.lines) ? p.lines : [],
    history: Array.isArray(p.history) ? p.history : [],
  };
}

export function readPayload(winId: string): TerminalPayload {
  const win = useWindowStore.getState().windows.find((w) => w.id === winId);
  return normalizePayload(win?.payload);
}

export function patch(winId: string, next: Partial<TerminalPayload>): void {
  useWindowStore.getState().patchPayload(winId, next);
}

export function appendLines(winId: string, text: string | string[], kind: LineKind = "out"): void {
  const current = readPayload(winId);
  patch(winId, { lines: [...current.lines, ...makeLines(text, kind)].slice(-MAX_LINES) });
}

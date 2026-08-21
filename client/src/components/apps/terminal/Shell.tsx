"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { APP_REGISTRY } from "@/data/appRegistry";
import { HIDDEN_APPS } from "./commands/desktop";
import { playSfx } from "@/lib/sfx";
import { COMMAND_NAMES, lookup } from "./registry";
import { appendLines, patch, readPayload } from "./payload";
import type { Ctx, Line, LineKind, TerminalPayload } from "./types";
import { MAX_LINES, tokenize } from "./types";
import { chainFor, last, promptFor, resolve, sortNodes } from "./vfs";

const BANNER = [
  "NOURIN Shell",
  "",
  "help  what this shell can do",
  "ls    what is on the drive",
  "ssh   open the real terminal on the vm",
  "",
];

const KIND_STYLE: Record<LineKind, React.CSSProperties> = {
  out: { color: "var(--wb-black)" },
  err: { color: "var(--wb-red-d)" },
  echo: { color: "var(--wb-black)" },
  note: { color: "var(--wb-gray-3)" },
  head: { color: "var(--wb-black)", fontWeight: "bold" },
};

const APP_IDS = Object.keys(APP_REGISTRY).filter(
  (id) => !(HIDDEN_APPS as string[]).includes(id),
);

function commonPrefix(items: string[]): string {
  if (!items.length) return "";
  let prefix = items[0];
  for (const item of items.slice(1)) {
    while (prefix && !item.toLowerCase().startsWith(prefix.toLowerCase())) {
      prefix = prefix.slice(0, -1);
    }
  }
  return prefix;
}

function quoteIfNeeded(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

export function Shell({ winId, payload }: { winId: string; payload: TerminalPayload }) {
  const { lines, cwdId, history } = payload;

  const [input, setInput] = useState("");
  const [histIndex, setHistIndex] = useState(-1);
  const [busy, setBusy] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);

  const chain = useMemo(() => chainFor(cwdId), [cwdId]);
  const prompt = promptFor(chain);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    if (!readPayload(winId).lines.length) appendLines(winId, BANNER, "note");
  }, [winId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lines, busy]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (busy) return;
    const el = inputRef.current;
    if (el && document.activeElement === document.body) el.focus();
  }, [busy]);

  const print = useCallback(
    (text: string | string[], kind: LineKind = "out") => appendLines(winId, text, kind),
    [winId],
  );

  const makeCtx = useCallback(
    (argv: string[], raw: string): Ctx => ({
      argv,
      raw,
      chain: chainFor(readPayload(winId).cwdId),
      winId,
      print,
      clear: () => patch(winId, { lines: [] }),
      setCwd: (folderId: string) => patch(winId, { cwdId: folderId }),
      connect: (host: string) => {
        playSfx("launch");
        patch(winId, { mode: "ssh", host });
      },
    }),
    [print, winId],
  );

  const submit = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      print(`${prompt} ${raw}`, "echo");
      setInput("");
      setHistIndex(-1);
      if (!trimmed) return;

      const current = readPayload(winId);
      if (current.history[current.history.length - 1] !== trimmed) {
        patch(winId, { history: [...current.history, trimmed].slice(-MAX_LINES) });
      }

      const argv = tokenize(trimmed);
      const command = lookup(argv[0]);
      if (!command) {
        print(`${argv[0]}: unknown command, try help`, "err");
        playSfx("error");
        return;
      }

      setBusy(true);
      try {
        await command.run(makeCtx(argv, trimmed));
      } catch (err) {
        print(err instanceof Error ? err.message : String(err), "err");
      } finally {
        setBusy(false);
      }
    },
    [makeCtx, print, prompt, winId],
  );

  const complete = useCallback(() => {
    const parts = input.split(/\s+/);
    const first = parts.length <= 1;
    const word = (parts[parts.length - 1] ?? "").replace(/^"/, "");

    let base = "";
    let stem = word;
    const cut = word.lastIndexOf("/");
    if (cut >= 0 && !first) {
      base = word.slice(0, cut + 1);
      stem = word.slice(cut + 1);
    }

    let candidates: string[];
    if (first) {
      candidates = COMMAND_NAMES;
    } else {
      const found = resolve(chain, base || ".");
      const folder = found.kind === "folder" ? last(found.chain) : null;
      const entries = folder
        ? sortNodes(folder.children).map((n) => (n.kind === "folder" ? `${n.name}/` : n.name))
        : [];
      candidates = parts[0].toLowerCase() === "open" ? [...APP_IDS, ...entries] : entries;
    }

    const hits = candidates.filter((c) => c.toLowerCase().startsWith(stem.toLowerCase()));
    if (!hits.length) return;

    const replacement = hits.length === 1 ? hits[0] : commonPrefix(hits);
    if (!replacement) return;

    const filled = quoteIfNeeded(`${base}${replacement}`);
    const rest = parts.slice(0, -1);
    const trail = hits.length === 1 && !replacement.endsWith("/") ? " " : "";
    setInput([...rest, filled].join(" ") + trail);

    if (hits.length > 1) print(hits.join("   "), "note");
  }, [chain, input, print]);

  const recall = useCallback(
    (delta: number) => {
      if (!history.length) return;
      const next = histIndex === -1 ? history.length - 1 : histIndex + delta;
      if (next < 0) return;
      if (next >= history.length) {
        setHistIndex(-1);
        setInput("");
        return;
      }
      setHistIndex(next);
      setInput(history[next]);
    },
    [histIndex, history],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      complete();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      recall(-1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      recall(1);
      return;
    }
    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      patch(winId, { lines: [] });
      return;
    }
    if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      print(`${prompt} ${input}^C`, "echo");
      setInput("");
      setHistIndex(-1);
    }
  }

  function focusInput() {
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus();
  }

  return (
    <div style={wrap} onClick={focusInput}>
      <div style={scroll}>
        {lines.map((line: Line) => (
          <div key={line.id} style={{ ...row, ...KIND_STYLE[line.kind] }}>
            {line.text || " "}
          </div>
        ))}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void submit(input);
          }}
          style={inputRow}
        >
          <span style={promptStyle}>{busy ? "..." : prompt}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Shell input"
            style={field}
          />
        </form>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  height: "100%",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  cursor: "text",
  overflow: "hidden",
};

const scroll: React.CSSProperties = {
  height: "100%",
  overflowY: "auto",
  padding: "6px 8px",
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  lineHeight: 1.45,
};

const row: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const inputRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 6,
};

const promptStyle: React.CSSProperties = {
  color: "var(--wb-black)",
  fontWeight: "bold",
  whiteSpace: "pre",
  flexShrink: 0,
};

const field: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: "transparent",
  border: "none",
  outline: "none",
  padding: 0,
  color: "var(--wb-black)",
  caretColor: "var(--wb-black)",
  fontFamily: "inherit",
  fontSize: "inherit",
  lineHeight: "inherit",
};

"use client";

import { useState } from "react";
import { useWindowStore } from "@/context/windowStore";

export type NotepadPayload = {
  content?: string;
  readOnly?: boolean;
};

export function Notepad({ winId, payload }: { winId?: string; payload?: unknown }) {
  const p = (payload ?? {}) as NotepadPayload;
  const patchPayload = useWindowStore((s) => s.patchPayload);
  const [text, setText] = useState(p.content ?? "");

  // Mirror edits into the window's store payload so text survives minimise /
  // restore (a minimised window unmounts). Still in-memory, so wiped on refresh.
  function onChange(value: string) {
    setText(value);
    if (winId && !p.readOnly) patchPayload(winId, { content: value });
  }

  return (
    <textarea
      value={text}
      onChange={(e) => onChange(e.target.value)}
      readOnly={p.readOnly}
      spellCheck={false}
      style={{
        width: "100%",
        height: "100%",
        resize: "none",
        background: "var(--wb-white)",
        color: "var(--wb-black)",
        border: "1px solid var(--wb-black)",
        padding: 6,
        fontFamily: "var(--wb-font)",
        fontSize: 14,
        lineHeight: 1.15,
        outline: "none",
      }}
    />
  );
}

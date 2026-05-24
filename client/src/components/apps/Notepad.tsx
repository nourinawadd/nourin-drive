"use client";

import { useState } from "react";

export type NotepadPayload = {
  content?: string;
  readOnly?: boolean;
};

export function Notepad({ payload }: { payload?: unknown }) {
  const p = (payload ?? {}) as NotepadPayload;
  const [text, setText] = useState(p.content ?? "");

  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
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

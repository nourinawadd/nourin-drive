"use client";

import { useState } from "react";
import { useWindowStore } from "@/context/windowStore";

type Junk = { name: string; size: string; deleted: string; content: string };

const FILES: Junk[] = [
  {
    name: "final_final_v3_REAL.mp4",
    size: "0.3 GB",
    deleted: "yesterday",
    content:
`this is not a video.
you knew that.
i knew that.
but here we are.`,
  },
  {
    name: "passwords.txt",
    size: "412 B",
    deleted: "2024-08-14",
    content:
`gmail:        please no
bank:         also no
spotify:      definitely not
the one i use everywhere: nope`,
  },
  {
    name: "todo_2019.txt",
    size: "1.2 KB",
    deleted: "2019-12-31",
    content:
`[ ] learn rust
[ ] start a podcast
[ ] go to bed before 2am
[ ] reply to that email
[ ] reply to that other email
[ ] stop opening random files`,
  },
  {
    name: "ex.jpg",
    size: "0 B",
    deleted: "(forever)",
    content:
`(empty file. as it should be.)`,
  },
  {
    name: "do_not_delete.zip",
    size: "9.4 MB",
    deleted: "this morning",
    content:
`you deleted it.
you absolutely deleted it.`,
  },
  {
    name: "screenshot_2027-09-12_at_4.41.07_AM.png",
    size: "812 KB",
    deleted: "minutes ago",
    content:
`probably a meme.
probably for a group chat.
probably never sent.`,
  },
  {
    name: "secrets.env",
    size: "94 B",
    deleted: "well caught",
    content:
`OPENAI_API_KEY=sk-just-kidding
DATABASE_URL=mongodb://nice-try
ADMIN_TOKEN=please-go-away`,
  },
];

export function RecycleBin() {
  const [selected, setSelected] = useState<string | null>(null);
  const openApp = useWindowStore((s) => s.openApp);

  // Reading, not editing — so it opens in the Ereader like every other text
  // on the desktop. There's no file behind these, hence the inline payload.
  function open(f: Junk) {
    openApp("ereader", {
      title: f.name,
      payload: {
        view: "read",
        inline: { title: f.name, format: "txt" as const, body: f.content },
      },
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={listHeader}>
        <span style={{ flex: 3 }}>Name</span>
        <span style={{ width: 70 }}>Size</span>
        <span style={{ width: 100 }}>Deleted</span>
      </div>
      <div style={{ flex: 1, overflow: "auto", background: "var(--wb-white)", border: "1px solid var(--wb-black)" }}>
        {FILES.map((f) => (
          <div
            key={f.name}
            onClick={() => setSelected(f.name)}
            onDoubleClick={() => open(f)}
            style={{
              ...row,
              background: selected === f.name ? "var(--wb-orange)" : undefined,
            }}
          >
            <span style={{ flex: 3, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12 }}>📄</span>
              {f.name}
            </span>
            <span style={{ width: 70, opacity: 0.7, fontSize: 12 }}>{f.size}</span>
            <span style={{ width: 100, opacity: 0.7, fontSize: 12 }}>{f.deleted}</span>
          </div>
        ))}
      </div>
      <div style={statusBar}>
        {FILES.length} files · double-click to "restore" · nothing here actually deletes
      </div>
    </div>
  );
}

const listHeader: React.CSSProperties = {
  display: "flex",
  background: "var(--wb-black)",
  color: "var(--wb-white)",
  fontSize: 12,
  padding: "2px 6px",
  gap: 6,
};
const row: React.CSSProperties = {
  display: "flex",
  gap: 6,
  padding: "1px 6px",
  fontSize: 13,
  borderBottom: "1px solid #eee",
  cursor: "pointer",
  userSelect: "none",
};
const statusBar: React.CSSProperties = {
  fontSize: 11,
  padding: "2px 6px",
  background: "var(--wb-gray)",
  borderTop: "1px solid var(--wb-black)",
};

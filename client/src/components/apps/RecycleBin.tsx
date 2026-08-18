"use client";

import { useState } from "react";
import { useWindowStore } from "@/context/windowStore";
import { FileIcon } from "@/components/os/icons";

type Junk = { name: string; size: string; deleted: string; content: string };

type ViewMode = "list" | "icons";

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
[ ] reply to that other email`,
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
  const [view, setView] = useState<ViewMode>("list");
  const openApp = useWindowStore((s) => s.openApp);

  // Reading, not editing - so it opens in the Ereader like every other text
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
      <div style={toolbar}>
        <ToolButton active={view === "list"} onClick={() => setView("list")}>▤ List</ToolButton>
        <ToolButton active={view === "icons"} onClick={() => setView("icons")}>▦ Icons</ToolButton>
      </div>

      {view === "list" ? (
        <>
          <div style={listHeader}>
            <span style={{ flex: 3 }}>Name</span>
            <span style={{ width: 70 }}>Size</span>
            <span style={{ width: 100 }}>Deleted</span>
          </div>
          <div style={listPane}>
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
                  <FileIcon category="document" scale={1} />
                  {f.name}
                </span>
                <span style={{ width: 70, opacity: 0.7, fontSize: 13 }}>{f.size}</span>
                <span style={{ width: 100, opacity: 0.7, fontSize: 13 }}>{f.deleted}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={iconGrid}>
          {FILES.map((f) => (
            <div
              key={f.name}
              onClick={() => setSelected(f.name)}
              onDoubleClick={() => open(f)}
              style={iconCell}
              title={`${f.size} · deleted ${f.deleted}`}
            >
              <FileIcon category="document" scale={3} />
              <span
                style={{
                  ...iconLabel,
                  ...(selected === f.name
                    ? { background: "var(--wb-orange)", outline: "1px dotted var(--wb-black)" }
                    : null),
                }}
              >
                {f.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={statusBar}>
        {FILES.length} files · double-click to &quot;restore&quot; · nothing here actually deletes
      </div>
    </div>
  );
}

function ToolButton({
  children, onClick, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{ ...toolButton, ...(active ? toolButtonActive : null), cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

const toolbar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 4px",
  background: "var(--wb-gray)",
  borderBottom: "1px solid var(--wb-black)",
  flexShrink: 0,
};
const toolButton: React.CSSProperties = {
  padding: "2px 8px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
};
const toolButtonActive: React.CSSProperties = {
  background: "var(--wb-gray-0)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-3), inset -1px -1px 0 var(--wb-white)",
};
const listPane: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
};
const iconGrid: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))",
  gap: 6,
  padding: 10,
  alignContent: "start",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
};
const iconCell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "8px 2px",
  fontFamily: "var(--wb-font)",
  fontSize: 13,
  color: "var(--wb-black)",
  cursor: "pointer",
  userSelect: "none",
};
const iconLabel: React.CSSProperties = {
  maxWidth: "100%",
  padding: "0 3px",
  textAlign: "center",
  wordBreak: "break-word",
  lineHeight: 1.25,
};
const listHeader: React.CSSProperties = {
  display: "flex",
  background: "var(--wb-black)",
  color: "var(--wb-white)",
  fontSize: 13,
  padding: "2px 6px",
  gap: 6,
};
const row: React.CSSProperties = {
  display: "flex",
  gap: 6,
  padding: "1px 6px",
  fontSize: 14,
  borderBottom: "1px solid #eee",
  cursor: "pointer",
  userSelect: "none",
};
const statusBar: React.CSSProperties = {
  fontSize: 12,
  padding: "2px 6px",
  background: "var(--wb-gray)",
  borderTop: "1px solid var(--wb-black)",
};

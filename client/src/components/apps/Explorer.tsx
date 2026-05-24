"use client";

import { useState } from "react";
import { CATEGORIES, PROJECTS, type Project, type ProjectCategory } from "@/data/projects";
import { useWindowStore } from "@/context/windowStore";

export function Explorer() {
  const [active, setActive] = useState<ProjectCategory>("websites");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const openApp = useWindowStore((s) => s.openApp);

  const items = PROJECTS.filter((p) => p.category === active);

  function openItem(p: Project) {
    switch (p.category) {
      case "websites":
        if (p.url) openApp("browser", { payload: { initialUrl: p.url } });
        break;
      case "games":
        if (p.url) window.open(p.url, "_blank", "noopener,noreferrer");
        break;
      case "designs":
        openApp("gallery", { payload: { focusId: p.id } });
        break;
      case "photos":
        if (p.url) window.open(p.url, "_blank", "noopener,noreferrer");
        else openApp("gallery");
        break;
      case "blog":
        openApp("blog");
        break;
      case "apis":
        openApp("apis");
        break;
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: 4 }}>
      {/* sidebar */}
      <aside style={sidebar}>
        <div style={sidebarHeader}>Volumes</div>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => { setActive(c.id); setSelectedId(null); }}
            style={{
              ...folderRow,
              background: active === c.id ? "var(--wb-orange)" : "transparent",
            }}
          >
            <FolderGlyph />
            {c.label}
          </button>
        ))}
      </aside>

      {/* list pane */}
      <section style={listPane}>
        <div style={listHeader}>
          <span style={{ flex: 2 }}>Name</span>
          <span style={{ flex: 3 }}>Description</span>
          <span style={{ width: 80, textAlign: "right" }}>Date</span>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: 12, fontSize: 12, opacity: 0.6 }}>(empty)</div>
        ) : (
          items.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              onDoubleClick={() => openItem(p)}
              style={{
                ...listRow,
                background: selectedId === p.id ? "var(--wb-orange)" : undefined,
              }}
            >
              <span style={{ flex: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <FileGlyph kind={p.category} />
                {p.name}
              </span>
              <span style={{ flex: 3, opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.blurb ?? ""}
              </span>
              <span style={{ width: 80, textAlign: "right", opacity: 0.7 }}>
                {p.date ?? ""}
              </span>
            </div>
          ))
        )}

        <div style={statusBar}>
          {items.length} item{items.length === 1 ? "" : "s"} · double-click to open
        </div>
      </section>
    </div>
  );
}

function FolderGlyph() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden>
      <path d="M0 1 H5 L6 2 H14 V10 H0 Z" fill="var(--wb-orange)" stroke="black" strokeWidth="1" />
    </svg>
  );
}

function FileGlyph({ kind }: { kind: ProjectCategory }) {
  const color: Record<ProjectCategory, string> = {
    websites: "#37a", apis: "#2a7", games: "#c33",
    designs: "#a3a", photos: "#e80", blog: "#888",
  };
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
      <path d="M0 0 H7 L10 3 V12 H0 Z" fill={color[kind]} stroke="black" strokeWidth="1" />
      <path d="M7 0 V3 H10" fill="none" stroke="black" strokeWidth="1" />
    </svg>
  );
}

const sidebar: React.CSSProperties = {
  width: 130,
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  display: "flex",
  flexDirection: "column",
  overflow: "auto",
  flexShrink: 0,
};
const sidebarHeader: React.CSSProperties = {
  fontSize: 12, fontWeight: "bold", padding: "2px 6px",
  background: "var(--wb-black)", color: "var(--wb-white)",
};
const folderRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "2px 6px",
  border: "none",
  borderBottom: "1px solid var(--wb-gray)",
  cursor: "pointer",
  fontFamily: "var(--wb-font)", fontSize: 13, color: "var(--wb-black)",
  textAlign: "left",
};
const listPane: React.CSSProperties = {
  flex: 1,
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  display: "flex",
  flexDirection: "column",
  overflow: "auto",
  minWidth: 0,
};
const listHeader: React.CSSProperties = {
  display: "flex",
  background: "var(--wb-black)",
  color: "var(--wb-white)",
  fontSize: 12,
  padding: "2px 6px",
  gap: 6,
};
const listRow: React.CSSProperties = {
  display: "flex",
  gap: 6,
  padding: "1px 6px",
  fontSize: 13,
  borderBottom: "1px solid #eee",
  cursor: "pointer",
  userSelect: "none",
};
const statusBar: React.CSSProperties = {
  marginTop: "auto",
  fontSize: 11,
  padding: "2px 6px",
  background: "var(--wb-gray)",
  borderTop: "1px solid var(--wb-black)",
};

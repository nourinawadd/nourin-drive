"use client";

import { useState } from "react";
import { CATEGORIES, PROJECTS, type Project, type ProjectCategory } from "@/data/projects";
import { PHOTOS } from "@/data/gallery";
import { useWindowStore } from "@/context/windowStore";
import { MiniFolder, FileIcon } from "@/components/os/icons";

// A volume is either a project category (from projects.ts) or a real gallery
// category (derived from the images dropped in public/gallery/). The image
// volumes replace the old placeholder "Designs"/"Photos" project categories.
type Volume =
  | { key: string; label: string; kind: "project"; cat: ProjectCategory }
  | { key: string; label: string; kind: "photos"; cat: string };

type Row = {
  id: string;
  name: string;
  blurb: string;
  date: string;
  iconCat: ProjectCategory;
  open: () => void;
};

const photoCategories = Array.from(new Set(PHOTOS.map((p) => p.category)));

export function Explorer() {
  const openApp = useWindowStore((s) => s.openApp);

  const volumes: Volume[] = [
    ...CATEGORIES.filter((c) => c.id !== "designs" && c.id !== "photos").map(
      (c): Volume => ({ key: `p:${c.id}`, label: c.label, kind: "project", cat: c.id }),
    ),
    ...photoCategories.map(
      (c): Volume => ({ key: `g:${c}`, label: c, kind: "photos", cat: c }),
    ),
  ];

  const [active, setActive] = useState<string>(volumes[0]?.key ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function openProject(p: Project) {
    switch (p.category) {
      case "websites":
        if (p.url) openApp("browser", { payload: { initialUrl: p.url } });
        break;
      case "games":
      case "photos":
        if (p.url) window.open(p.url, "_blank", "noopener,noreferrer");
        break;
      case "blog":
        openApp("blog");
        break;
      case "apis":
        openApp("apis");
        break;
      default:
        break;
    }
  }

  const vol = volumes.find((v) => v.key === active);
  const rows: Row[] =
    vol?.kind === "project"
      ? PROJECTS.filter((p) => p.category === vol.cat).map((p) => ({
          id: p.id,
          name: p.name,
          blurb: p.blurb ?? "",
          date: p.date ?? "",
          iconCat: p.category,
          open: () => openProject(p),
        }))
      : vol?.kind === "photos"
        ? PHOTOS.filter((p) => p.category === vol.cat).map((p) => ({
            id: p.id,
            name: p.title,
            blurb: "",
            date: p.date ?? "",
            iconCat: "photos" as ProjectCategory,
            open: () => openApp("gallery", { payload: { focusId: p.id } }),
          }))
        : [];

  return (
    <div style={{ display: "flex", height: "100%", gap: 4 }}>
      {/* sidebar */}
      <aside style={sidebar}>
        <div style={sidebarHeader}>Volumes</div>
        {volumes.map((v) => (
          <button
            key={v.key}
            onClick={() => { setActive(v.key); setSelectedId(null); }}
            style={{
              ...folderRow,
              background: active === v.key ? "var(--wb-orange)" : "transparent",
            }}
          >
            <MiniFolder highlight={active === v.key} />
            {v.label}
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

        {rows.length === 0 ? (
          <div style={{ padding: 12, fontSize: 12, opacity: 0.6 }}>(empty)</div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              onDoubleClick={r.open}
              style={{
                ...listRow,
                background: selectedId === r.id ? "var(--wb-orange)" : undefined,
              }}
            >
              <span style={{ flex: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <FileIcon category={r.iconCat} />
                {r.name}
              </span>
              <span style={{ flex: 3, opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.blurb}
              </span>
              <span style={{ width: 80, textAlign: "right", opacity: 0.7 }}>
                {r.date}
              </span>
            </div>
          ))
        )}

        <div style={statusBar}>
          {rows.length} item{rows.length === 1 ? "" : "s"} · double-click to open
        </div>
      </section>
    </div>
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

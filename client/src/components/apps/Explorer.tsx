"use client";

import { useCallback, useMemo, useState } from "react";
import {
  FS_ROOT, countItems, findFolder, pathTo,
  type FileAction, type FsFolder, type FsNode,
} from "@/data/fileTree";
import { LOCAL_GAMES } from "@/data/games.generated";
import { docById } from "@/data/library";
import { findPost } from "@/data/blog";
import { useWindowStore } from "@/context/windowStore";
import { FileIcon, FolderIcon } from "@/components/os/icons";
import { ContextMenu, type MenuItem } from "@/components/os/ContextMenu";
import type { PropertiesPayload } from "@/components/apps/Properties";

type ViewMode = "list" | "icons";
type SortKey = "name" | "type" | "date";

// Persisted in the window payload so the view survives minimize/restore, the
// same way the Ereader keeps its page.
type ExplorerState = {
  folderId: string;
  expanded: string[];
  view: ViewMode;
  sortKey: SortKey;
  sortAsc: boolean;
};

const DEFAULTS: ExplorerState = {
  folderId: FS_ROOT.id,
  expanded: [FS_ROOT.id],
  view: "list",
  sortKey: "name",
  sortAsc: true,
};

type Menu = { x: number; y: number; node: FsNode | null };

export function Explorer({ winId, payload }: { winId: string; payload: unknown }) {
  const openApp = useWindowStore((s) => s.openApp);
  const patchPayload = useWindowStore((s) => s.patchPayload);

  const saved = (payload ?? {}) as Partial<ExplorerState>;
  const state: ExplorerState = { ...DEFAULTS, ...saved };
  const { view, sortKey, sortAsc } = state;

  const setState = useCallback(
    (patch: Partial<ExplorerState>) => patchPayload(winId, patch),
    [patchPayload, winId],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);

  const folder = findFolder(state.folderId) ?? FS_ROOT;
  const trail = pathTo(folder.id) ?? [FS_ROOT];
  const expanded = useMemo(() => new Set(state.expanded), [state.expanded]);

  function navigate(id: string) {
    // Opening a folder reveals its branch in the tree, like Explorer does.
    const chain = pathTo(id)?.map((f) => f.id) ?? [];
    setState({ folderId: id, expanded: Array.from(new Set([...state.expanded, ...chain])) });
    setSelectedId(null);
  }

  function toggle(id: string) {
    const next = new Set(state.expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setState({ expanded: Array.from(next) });
  }

  const runAction = useCallback((action: FileAction) => {
    switch (action.type) {
      case "browser":
        openApp("browser", { payload: { initialUrl: action.url } });
        break;
      case "game": {
        const build = LOCAL_GAMES[action.projectId];
        if (build?.src) openApp("game", { payload: { src: build.src, name: action.name }, title: action.name });
        else if (action.url) window.open(action.url, "_blank", "noopener,noreferrer");
        break;
      }
      case "gallery":
        openApp("gallery", { payload: { focusId: action.photoId } });
        break;
      case "ereader": {
        const doc = docById(action.docId);
        openApp("ereader", {
          payload: { docId: action.docId, view: "read" },
          title: doc ? doc.title : "Ereader",
        });
        break;
      }
      case "blog": {
        const post = findPost(action.slug);
        openApp("blog", {
          payload: { slug: action.slug },
          title: post ? post.title : "Blog",
        });
        break;
      }
      case "app":
        openApp(action.appId);
        break;
      case "external":
        window.open(action.url, "_blank", "noopener,noreferrer");
        break;
      case "none":
        break;
    }
  }, [openApp]);

  function openNode(node: FsNode) {
    if (node.kind === "folder") navigate(node.id);
    else runAction(node.action);
  }

  function openProperties(node: FsNode) {
    const data: PropertiesPayload =
      node.kind === "folder"
        ? {
            kind: "folder",
            name: node.name,
            typeLabel: "File Folder",
            location: parentOf(node.path),
            contains: describeContents(node),
          }
        : {
            kind: "file",
            name: node.name,
            typeLabel: node.typeLabel,
            location: node.path,
            date: node.date,
            blurb: node.blurb,
            iconCat: node.iconCat,
          };
    openApp("properties", { payload: data, title: `${node.name} Properties` });
  }

  const items = useMemo(
    () => sortNodes(folder.children, sortKey, sortAsc),
    [folder, sortKey, sortAsc],
  );

  function sortBy(key: SortKey) {
    if (key === sortKey) setState({ sortAsc: !sortAsc });
    else setState({ sortKey: key, sortAsc: true });
  }

  const parent = trail.length > 1 ? trail[trail.length - 2] : null;

  function onNodeContextMenu(e: React.MouseEvent, node: FsNode) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(node.id);
    setMenu({ x: e.clientX, y: e.clientY, node });
  }

  function onBackgroundContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, node: null });
  }

  const menuItems: MenuItem[] = menu?.node
    ? [
        { kind: "item", label: "Open", onSelect: () => openNode(menu.node!) },
        { kind: "separator" },
        { kind: "item", label: "Properties", onSelect: () => openProperties(menu.node!) },
      ]
    : [
        { kind: "item", label: "View as List", hint: view === "list" ? "•" : undefined, onSelect: () => setState({ view: "list" }) },
        { kind: "item", label: "View as Icons", hint: view === "icons" ? "•" : undefined, onSelect: () => setState({ view: "icons" }) },
        { kind: "separator" },
        { kind: "item", label: "Up One Level", disabled: !parent, onSelect: () => parent && navigate(parent.id) },
        { kind: "separator" },
        { kind: "item", label: "Properties", onSelect: () => openProperties(folder) },
      ];

  return (
    <div style={shell}>
      <MenuBar
        view={view}
        canGoUp={!!parent}
        onUp={() => parent && navigate(parent.id)}
        onView={(v) => setState({ view: v })}
        onProperties={() => openProperties(folder)}
      />

      <div style={toolbar}>
        <ToolButton disabled={!parent} onClick={() => parent && navigate(parent.id)}>
          ↑ Up
        </ToolButton>
        <span style={toolDivider} />
        <ToolButton active={view === "list"} onClick={() => setState({ view: "list" })}>
          ▤ List
        </ToolButton>
        <ToolButton active={view === "icons"} onClick={() => setState({ view: "icons" })}>
          ▦ Icons
        </ToolButton>
        <span style={{ ...toolDivider, marginLeft: "auto" }} />
        <span style={addressLabel}>Address:</span>
        <span style={address} title={folder.path}>{folder.path}</span>
      </div>

      <div style={panes}>
        <aside style={treePane}>
          <div style={paneHeader}>All Folders</div>
          <div style={{ padding: "2px 0" }}>
            <TreeBranch
              node={FS_ROOT}
              rails={[]}
              isLast
              currentId={folder.id}
              expanded={expanded}
              onToggle={toggle}
              onSelect={navigate}
            />
          </div>
        </aside>

        <section style={listPane} onContextMenu={onBackgroundContextMenu}>
          <div style={paneHeader}>Contents of &apos;{folder.name}&apos;</div>

          {view === "list" ? (
            <ListView
              items={items}
              selectedId={selectedId}
              sortKey={sortKey}
              sortAsc={sortAsc}
              onSort={sortBy}
              onSelect={setSelectedId}
              onOpen={openNode}
              onContext={onNodeContextMenu}
            />
          ) : (
            <IconView
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpen={openNode}
              onContext={onNodeContextMenu}
            />
          )}
        </section>
      </div>

      <div style={statusBar}>
        <span>{items.length} object(s)</span>
        <span style={{ marginLeft: "auto", opacity: 0.7 }}>
          double-click to open · right-click for properties
        </span>
      </div>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}
    </div>
  );
}

/* ── tree ──────────────────────────────────────────────────────────────── */

/**
 * `rails` carries one flag per ancestor level: true when that ancestor still
 * has siblings below it, so the dotted vertical line should continue through
 * this row. That is what makes the connectors line up like Windows.
 */
function TreeBranch({
  node, rails, isLast, currentId, expanded, onToggle, onSelect,
}: {
  node: FsFolder;
  rails: boolean[];
  isLast: boolean;
  currentId: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const subFolders = node.children.filter((c): c is FsFolder => c.kind === "folder");
  const hasKids = subFolders.length > 0;
  const isOpen = expanded.has(node.id);
  const isCurrent = node.id === currentId;
  const depth = rails.length;

  return (
    <div>
      {/* row height tracks the icon: pixel art only scales in integer steps,
          so 2x means 32px art and the row has to make room for it */}
      <div style={{ display: "flex", alignItems: "center", height: 34 }}>
        {rails.map((draw, i) => (
          <span key={i} style={draw ? indentRail : indentBlank} />
        ))}

        {depth > 0 && <Elbow last={isLast} />}

        {hasKids ? (
          <button
            aria-label={isOpen ? "Collapse" : "Expand"}
            onClick={() => onToggle(node.id)}
            style={expander}
          >
            {isOpen ? "−" : "+"}
          </button>
        ) : (
          <span style={{ width: 13, flexShrink: 0 }} />
        )}

        <button
          onClick={() => onSelect(node.id)}
          onDoubleClick={() => hasKids && onToggle(node.id)}
          style={{
            ...treeLabel,
            background: isCurrent ? "var(--wb-orange)" : "transparent",
          }}
        >
          <span style={{ display: "inline-flex", flexShrink: 0 }}>
            <FolderIcon open={isOpen && hasKids} scale={2} />
          </span>
          <span style={ellipsis}>{node.name}</span>
        </button>
      </div>

      {isOpen && subFolders.map((child, i) => (
        <TreeBranch
          key={child.id}
          node={child}
          // This node's rail continues past its children only if it has a
          // sibling of its own still to come.
          rails={depth === 0 ? [] : [...rails, !isLast]}
          isLast={i === subFolders.length - 1}
          currentId={currentId}
          expanded={expanded}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

/** Win95 connector: dotted vertical into the row, dotted tick out to the node. */
function Elbow({ last }: { last: boolean }) {
  return (
    <span style={{ position: "relative", width: 13, alignSelf: "stretch", flexShrink: 0 }}>
      <span
        style={{
          position: "absolute", left: 6, top: 0, width: 1,
          height: last ? "50%" : "100%",
          backgroundImage: "linear-gradient(var(--wb-gray-2) 50%, transparent 50%)",
          backgroundSize: "1px 2px",
        }}
      />
      <span
        style={{
          position: "absolute", left: 6, top: "50%", width: 7, height: 1,
          backgroundImage: "linear-gradient(to right, var(--wb-gray-2) 50%, transparent 50%)",
          backgroundSize: "2px 1px",
        }}
      />
    </span>
  );
}

/* ── list view ─────────────────────────────────────────────────────────── */

function ListView({
  items, selectedId, sortKey, sortAsc, onSort, onSelect, onOpen, onContext,
}: {
  items: FsNode[];
  selectedId: string | null;
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (k: SortKey) => void;
  onSelect: (id: string) => void;
  onOpen: (n: FsNode) => void;
  onContext: (e: React.MouseEvent, n: FsNode) => void;
}) {
  const arrow = (k: SortKey) => (k === sortKey ? (sortAsc ? " ▲" : " ▼") : "");
  return (
    <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      <div style={listHeader}>
        <button style={{ ...colButton, flex: 3 }} onClick={() => onSort("name")}>Name{arrow("name")}</button>
        <button style={{ ...colButton, flex: 2 }} onClick={() => onSort("type")}>Type{arrow("type")}</button>
        <button style={{ ...colButton, width: 84, flex: "0 0 84px", justifyContent: "flex-end" }} onClick={() => onSort("date")}>
          Modified{arrow("date")}
        </button>
      </div>

      {items.length === 0 ? (
        <div style={emptyNote}>This folder is empty.</div>
      ) : (
        items.map((n) => {
          const selected = selectedId === n.id;
          return (
            <div
              key={n.id}
              onClick={() => onSelect(n.id)}
              onDoubleClick={() => onOpen(n)}
              onContextMenu={(e) => onContext(e, n)}
              style={{ ...listRow, background: selected ? "var(--wb-orange)" : undefined }}
            >
              <span style={{ flex: 3, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{ display: "inline-flex", flexShrink: 0 }}>
                  {n.kind === "folder"
                    ? <FolderIcon scale={2} />
                    : <FileIcon category={n.iconCat} scale={2} />}
                </span>
                <span style={ellipsis}>{n.name}</span>
              </span>
              <span style={{ flex: 2, minWidth: 0, ...ellipsis }}>
                {n.kind === "folder" ? "File Folder" : n.typeLabel}
              </span>
              <span style={{ width: 84, flex: "0 0 84px", textAlign: "right", opacity: 0.75 }}>
                {n.kind === "file" ? n.date ?? "" : ""}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── icon view ─────────────────────────────────────────────────────────── */

function IconView({
  items, selectedId, onSelect, onOpen, onContext,
}: {
  items: FsNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (n: FsNode) => void;
  onContext: (e: React.MouseEvent, n: FsNode) => void;
}) {
  if (items.length === 0) return <div style={emptyNote}>This folder is empty.</div>;
  return (
    <div style={iconGrid}>
      {items.map((n) => {
        const selected = selectedId === n.id;
        return (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            onDoubleClick={() => onOpen(n)}
            onContextMenu={(e) => onContext(e, n)}
            style={iconCell}
          >
            <span style={{ display: "inline-flex" }}>
              {n.kind === "folder"
                ? <FolderIcon scale={3} />
                : <FileIcon category={n.iconCat} scale={3} />}
            </span>
            <span
              style={{
                ...iconLabel,
                background: selected ? "var(--wb-orange)" : "transparent",
                outline: selected ? "1px dotted var(--wb-black)" : "none",
              }}
            >
              {n.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── menu bar ──────────────────────────────────────────────────────────── */

function MenuBar({
  view, canGoUp, onUp, onView, onProperties,
}: {
  view: ViewMode;
  canGoUp: boolean;
  onUp: () => void;
  onView: (v: ViewMode) => void;
  onProperties: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  const menus: Record<string, MenuItem[]> = {
    File: [
      { kind: "item", label: "Properties", onSelect: onProperties },
      { kind: "separator" },
      { kind: "item", label: "Close", disabled: true },
    ],
    View: [
      { kind: "item", label: "List", hint: view === "list" ? "•" : undefined, onSelect: () => onView("list") },
      { kind: "item", label: "Icons", hint: view === "icons" ? "•" : undefined, onSelect: () => onView("icons") },
      { kind: "separator" },
      { kind: "item", label: "Up One Level", disabled: !canGoUp, onSelect: onUp },
    ],
    Help: [{ kind: "item", label: "About File Explorer", disabled: true }],
  };

  return (
    <div style={menuBar}>
      {Object.keys(menus).map((name) => (
        <div key={name} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen(open === name ? null : name)}
            style={{
              ...menuBarItem,
              background: open === name ? "var(--wb-orange)" : "transparent",
            }}
          >
            {name}
          </button>
          {open === name && (
            <DropDown items={menus[name]} onClose={() => setOpen(null)} />
          )}
        </div>
      ))}
    </div>
  );
}

function DropDown({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  return (
    <>
      {/* click-catcher so the menu closes on any outside click */}
      <div style={backdrop} onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div style={dropdown}>
        {items.map((item, i) =>
          item.kind === "separator" ? (
            <div key={`sep-${i}`} style={dropSeparator} />
          ) : (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => { item.onSelect?.(); onClose(); }}
              style={{ ...dropItem, opacity: item.disabled ? 0.4 : 1 }}
              onMouseEnter={(e) => {
                if (item.disabled) return;
                e.currentTarget.style.background = "var(--wb-orange)";
              }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span>{item.label}</span>
              {item.hint && <span style={{ marginLeft: 16 }}>{item.hint}</span>}
            </button>
          ),
        )}
      </div>
    </>
  );
}

/* ── helpers ───────────────────────────────────────────────────────────── */

function ToolButton({
  children, onClick, disabled, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...toolButton,
        ...(active ? toolButtonActive : null),
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

/** Folders first, then the chosen key - the ordering Explorer has always used. */
function sortNodes(nodes: FsNode[], key: SortKey, asc: boolean): FsNode[] {
  const dir = asc ? 1 : -1;
  return [...nodes].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
    switch (key) {
      case "type": {
        const at = a.kind === "folder" ? "File Folder" : a.typeLabel;
        const bt = b.kind === "folder" ? "File Folder" : b.typeLabel;
        return at.localeCompare(bt) * dir || a.name.localeCompare(b.name);
      }
      case "date": {
        const ad = a.kind === "file" ? a.date ?? "" : "";
        const bd = b.kind === "file" ? b.date ?? "" : "";
        return ad.localeCompare(bd) * dir || a.name.localeCompare(b.name);
      }
      default:
        return a.name.localeCompare(b.name) * dir;
    }
  });
}

function parentOf(path: string): string {
  const i = path.lastIndexOf("\\");
  return i === -1 ? path : path.slice(0, i);
}

function describeContents(folder: FsFolder): string {
  const { files, folders } = countItems(folder);
  const parts: string[] = [];
  if (files) parts.push(`${files} File${files === 1 ? "" : "s"}`);
  if (folders) parts.push(`${folders} Folder${folders === 1 ? "" : "s"}`);
  return parts.join(", ") || "Empty";
}

/* ── styles ────────────────────────────────────────────────────────────── */

const shell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  fontSize: 12,
};
const menuBar: React.CSSProperties = {
  display: "flex",
  gap: 2,
  padding: "1px 2px",
  background: "var(--wb-gray)",
  borderBottom: "1px solid var(--wb-gray-3)",
  flexShrink: 0,
};
const menuBarItem: React.CSSProperties = {
  padding: "1px 8px",
  border: "none",
  background: "transparent",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
  cursor: "pointer",
};
const backdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 40,
};
const dropdown: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  zIndex: 50,
  minWidth: 150,
  padding: 1,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), 2px 2px 0 rgba(0,0,0,0.35)",
};
const dropItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  padding: "3px 10px",
  border: "none",
  background: "transparent",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
  textAlign: "left",
  cursor: "pointer",
};
const dropSeparator: React.CSSProperties = {
  height: 0,
  margin: "3px 2px",
  borderTop: "1px solid var(--wb-gray-3)",
  borderBottom: "1px solid var(--wb-white)",
};
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
  fontSize: 11,
  color: "var(--wb-black)",
};
const toolButtonActive: React.CSSProperties = {
  background: "var(--wb-gray-0)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-3), inset -1px -1px 0 var(--wb-white)",
};
const toolDivider: React.CSSProperties = {
  width: 1,
  alignSelf: "stretch",
  margin: "0 2px",
  background: "var(--wb-gray-3)",
  borderRight: "1px solid var(--wb-white)",
  flexShrink: 0,
};
const addressLabel: React.CSSProperties = { fontSize: 11, opacity: 0.7, flexShrink: 0 };
const address: React.CSSProperties = {
  maxWidth: 260,
  padding: "1px 6px",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-3)",
  fontSize: 11,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const panes: React.CSSProperties = {
  display: "flex",
  flex: 1,
  minHeight: 0,
  gap: 3,
  padding: 3,
  background: "var(--wb-gray)",
};
const paneHeader: React.CSSProperties = {
  padding: "2px 6px",
  background: "var(--wb-black)",
  color: "var(--wb-white)",
  fontSize: 11,
  fontWeight: "bold",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  flexShrink: 0,
};
const treePane: React.CSSProperties = {
  width: 190,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-3)",
  overflow: "auto",
};
const listPane: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-3)",
  overflow: "hidden",
};
const indentRail: React.CSSProperties = {
  width: 13,
  alignSelf: "stretch",
  flexShrink: 0,
  // Dotted vertical rail, drawn as a 1px repeating gradient so it stays crisp.
  backgroundImage: "linear-gradient(var(--wb-gray-2) 50%, transparent 50%)",
  backgroundSize: "1px 2px",
  backgroundRepeat: "repeat-y",
  backgroundPosition: "6px 0",
};
const indentBlank: React.CSSProperties = { width: 13, flexShrink: 0 };
const expander: React.CSSProperties = {
  width: 11,
  height: 11,
  marginRight: 2,
  flexShrink: 0,
  display: "grid",
  placeItems: "center",
  padding: 0,
  lineHeight: 1,
  background: "var(--wb-white)",
  border: "1px solid var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 10,
  color: "var(--wb-black)",
  cursor: "pointer",
};
const treeLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  flex: 1,
  minWidth: 0,
  padding: "1px 4px 1px 2px",
  border: "none",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
  textAlign: "left",
  cursor: "pointer",
};
const listHeader: React.CSSProperties = {
  display: "flex",
  position: "sticky",
  top: 0,
  zIndex: 1,
  background: "var(--wb-gray)",
  borderBottom: "1px solid var(--wb-black)",
};
const colButton: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "2px 6px",
  minWidth: 0,
  background: "var(--wb-gray)",
  border: "none",
  borderRight: "1px solid var(--wb-gray-3)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 11,
  fontWeight: "bold",
  color: "var(--wb-black)",
  cursor: "pointer",
};
const listRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "3px 6px",
  fontSize: 12,
  cursor: "default",
  userSelect: "none",
};
const iconGrid: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
  gap: 6,
  padding: 8,
  alignContent: "start",
};
const iconCell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "6px 2px",
  border: "none",
  background: "transparent",
  fontFamily: "var(--wb-font)",
  fontSize: 11,
  color: "var(--wb-black)",
  cursor: "default",
  userSelect: "none",
};
const iconLabel: React.CSSProperties = {
  maxWidth: "100%",
  padding: "0 3px",
  textAlign: "center",
  wordBreak: "break-word",
  lineHeight: 1.25,
};
const emptyNote: React.CSSProperties = {
  padding: 12,
  fontSize: 14,
  opacity: 0.6,
};
const statusBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "2px 6px",
  fontSize: 11,
  background: "var(--wb-gray)",
  borderTop: "1px solid var(--wb-white)",
  flexShrink: 0,
};
const ellipsis: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
};

"use client";

import { useCallback, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { LIBRARY, docById, searchDocs, type LibraryDoc } from "@/data/library";
import { useWindowStore } from "@/context/windowStore";
import { RailBook, RailHome, RailInfo, RailShelves } from "@/components/os/icons";
import { ALL_SHELVES, DocGrid, HomeView, InfoView, ShelfChips, ShelvesView } from "./LibraryView";
import { ReaderView } from "./ReaderView";
import { shareDoc, type InlineDoc, type ReadableDoc } from "./actions";
import { ShareDialog } from "@/components/os/ShareDialog";

export type EreaderPayload = {
  /** Open straight into a library document (Explorer, deep links, Share). */
  docId?: string;
  /** Text with no file behind it - the Recycle Bin's deleted "files". */
  inline?: InlineDoc;
  view?: RailView | "read";
  shelf?: string;
  page?: number;
  zoom?: number;
  spread?: boolean;
};

type RailView = "home" | "library" | "shelves" | "info";

const RAIL: { id: RailView; label: string; Icon: ComponentType }[] = [
  { id: "home",    label: "Home",     Icon: RailHome },
  { id: "library", label: "Library",  Icon: RailBook },
  { id: "shelves", label: "Shelves",  Icon: RailShelves },
  { id: "info",    label: "Info",     Icon: RailInfo },
];

export function Ereader({ winId, payload }: { winId: string; payload: unknown }) {
  const patchPayload = useWindowStore((s) => s.patchPayload);
  const saved = (payload ?? {}) as EreaderPayload;

  // Search is deliberately NOT persisted - a filter you can't see the cause of
  // after restoring a window is worse than losing a half-typed query.
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ url: string; copied: boolean } | null>(null);

  const setState = useCallback(
    (patch: EreaderPayload) => patchPayload(winId, patch),
    [patchPayload, winId],
  );

  // An explicit view wins; otherwise a docId/inline in the payload means the
  // window was opened to read something specific.
  const view = saved.view ?? (saved.docId || saved.inline ? "read" : "home");
  const shelf = saved.shelf ?? ALL_SHELVES;
  const page = saved.page ?? 0;
  const zoom = saved.zoom ?? 1;
  const spread = saved.spread ?? true;

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of LIBRARY) m.set(d.shelf, (m.get(d.shelf) ?? 0) + 1);
    return m;
  }, []);

  const visible = useMemo(() => {
    const byShelf = shelf === ALL_SHELVES ? LIBRARY : LIBRARY.filter((d) => d.shelf === shelf);
    return searchDocs(byShelf, query);
  }, [shelf, query]);

  const openDoc = useCallback(
    (doc: LibraryDoc) => setState({ view: "read", docId: doc.id, inline: undefined, page: 0 }),
    [setState],
  );

  const openShelf = useCallback(
    (name: string) => setState({ view: "library", shelf: name }),
    [setState],
  );

  const onShare = useCallback(async (doc: LibraryDoc) => {
    setToast(await shareDoc(doc));
  }, []);

  // Resolve what the reader should show. A docId that no longer matches a file
  // (a renamed poem in an old share link) falls through to a message rather
  // than a blank pane.
  const item: ReadableDoc | null = useMemo(() => {
    if (saved.inline) return { kind: "inline", doc: saved.inline };
    if (saved.docId) {
      const doc = docById(saved.docId);
      return doc ? { kind: "library", doc } : null;
    }
    return null;
  }, [saved.inline, saved.docId]);

  const readerOpen = view === "read";

  return (
    <div style={shell}>
      {/* ── left rail ── */}
      <nav style={rail} aria-label="Library sections">
        {RAIL.map((it) => {
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setState({ view: it.id })}
              style={{ ...railItem, ...(active ? railItemActive : null) }}
              title={it.label}
            >
              <it.Icon />
              <span>{it.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── main column ── */}
      <div style={main}>
        {!readerOpen && (
          <div style={searchBand}>
            <span aria-hidden style={{ fontSize: 14, opacity: 0.6 }}>⌕</span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                // Typing is a library action; jump out of Home/Info so the
                // results are actually on screen.
                if (view !== "library") setState({ view: "library" });
              }}
              placeholder="Title, author, shelf, or topic"
              style={searchInput}
              aria-label="Search the library"
            />
            {query && (
              <button onClick={() => setQuery("")} style={clearButton} title="Clear search">
                ×
              </button>
            )}
          </div>
        )}

        <div style={readerOpen ? readerBody : body}>
          {readerOpen ? (
            item ? (
              <ReaderView
                item={item}
                page={page}
                zoom={zoom}
                spread={spread}
                onPage={(p) => setState({ page: p })}
                onZoom={(z) => setState({ zoom: z })}
                onSpread={(s) => setState({ spread: s })}
                onBack={() => setState({ view: "library", docId: undefined, inline: undefined, page: 0 })}
                onShare={onShare}
              />
            ) : (
              <div style={{ padding: 16, fontSize: 13, lineHeight: 1.6 }}>
                <div style={{ fontWeight: "bold", marginBottom: 6 }}>That document isn&apos;t here.</div>
                It may have been renamed or removed since the link was made.
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => setState({ view: "library" })} style={backButton}>
                    Back to the library
                  </button>
                </div>
              </div>
            )
          ) : view === "home" ? (
            <HomeView onRead={openDoc} onShare={onShare} onOpenShelf={openShelf} />
          ) : view === "shelves" ? (
            <ShelvesView counts={counts} onOpenShelf={openShelf} />
          ) : view === "info" ? (
            <InfoView />
          ) : (
            <>
              <ShelfChips shelf={shelf} onSelect={(s) => setState({ shelf: s })} counts={counts} />
              <DocGrid
                docs={visible}
                onRead={openDoc}
                onShare={onShare}
                empty={
                  query
                    ? `Nothing matches “${query}”.`
                    : LIBRARY.length
                      ? `Nothing on the ${shelf} shelf yet.`
                      : "The library is empty. Drop a file into client/public/library/ and run npm run library."
                }
              />
            </>
          )}
        </div>
      </div>

      {toast && <ShareDialog {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────────────────────── */

const shell: React.CSSProperties = {
  position: "relative",
  display: "flex",
  height: "100%",
  minHeight: 0,
  fontSize: 13,
  background: "var(--wb-gray)",
};
const rail: React.CSSProperties = {
  width: 74,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: 4,
  background: "var(--wb-gray)",
  borderRight: "1px solid var(--wb-black)",
  boxShadow: "inset -1px 0 0 var(--wb-white)",
};
const railItem: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
  padding: "6px 2px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
  cursor: "pointer",
};
const railItemActive: React.CSSProperties = {
  background: "var(--wb-orange)",
  boxShadow: "inset 1px 1px 0 var(--wb-yellow), inset -1px -1px 0 var(--wb-orange-d)",
};
const main: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};
const searchBand: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 8px",
  background: "var(--wb-yellow)",
  borderBottom: "1px solid var(--wb-black)",
  boxShadow: "inset 0 1px 0 var(--wb-white)",
  flexShrink: 0,
};
const searchInput: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "3px 8px",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  color: "var(--wb-black)",
  outline: "none",
};
const clearButton: React.CSSProperties = {
  width: 20,
  height: 20,
  padding: 0,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  lineHeight: 1,
  color: "var(--wb-black)",
  cursor: "pointer",
  flexShrink: 0,
};
const body: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  padding: 10,
  background: "var(--wb-white)",
};
const readerBody: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
};
const backButton: React.CSSProperties = {
  padding: "2px 10px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
  cursor: "pointer",
};

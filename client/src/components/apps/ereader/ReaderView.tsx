"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { isShortForm, type LibraryDoc } from "@/data/library";
import { TextPane } from "./TextPane";
import { downloadDoc, fetchBody, type InlineDoc, type ReadableDoc } from "./actions";

// pdf.js lives in its own chunk — see pdfjs.ts for why. ssr:false because it
// touches window/canvas on mount.
const PdfPane = dynamic(() => import("./PdfPane").then((m) => m.PdfPane), {
  ssr: false,
  loading: () => (
    <div className="wb-paper" style={{ flex: 1, display: "grid", placeItems: "center" }}>
      <span style={{ color: "var(--wb-paper-dim)", fontSize: 15 }}>Loading reader…</span>
    </div>
  ),
});

// Below this the spread collapses to a single page — two columns in a 500px
// window gives you two very tall, very narrow strips of text.
const SPREAD_MIN_WIDTH = 900;
const ZOOM_STEPS = [0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2];

export type ReaderViewProps = {
  item: ReadableDoc;
  page: number;
  zoom: number;
  spread: boolean;
  onPage: (page: number) => void;
  onZoom: (zoom: number) => void;
  onSpread: (spread: boolean) => void;
  onBack: () => void;
  onShare: (doc: LibraryDoc) => void;
};

export function ReaderView({
  item, page, zoom, spread, onPage, onZoom, onSpread, onBack, onShare,
}: ReaderViewProps) {
  const isLibrary = item.kind === "library";
  const doc = item.doc as LibraryDoc | InlineDoc;
  const format = doc.format;

  const [pageCount, setPageCount] = useState(1);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [body, setBody] = useState<string | null>(
    item.kind === "inline" ? item.doc.body : item.doc.body ?? null,
  );
  const [bodyError, setBodyError] = useState<string | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const [paneWidth, setPaneWidth] = useState(0);

  const shortForm = item.kind === "inline"
    ? true                                   // deleted-file text is always brief
    : isShortForm(item.doc);

  // ── oversized text: not inlined at build time, so fetch it ────────────
  useEffect(() => {
    if (item.kind !== "library" || format === "pdf" || item.doc.body != null) return;
    let cancelled = false;
    setBody(null);
    setBodyError(null);
    fetchBody(item.doc)
      .then((text) => { if (!cancelled) setBody(text); })
      .catch((e: unknown) => {
        if (!cancelled) setBodyError(e instanceof Error ? e.message : "Could not load this document.");
      });
    return () => { cancelled = true; };
  }, [item, format]);

  // Reset the inlined body when the document changes under us.
  useEffect(() => {
    if (item.kind === "inline") setBody(item.doc.body);
    else if (item.doc.body != null) setBody(item.doc.body);
  }, [item]);

  // ── width drives the spread ──────────────────────────────────────────
  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;
    const read = () => setPaneWidth(el.clientWidth);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const canSpread = paneWidth >= SPREAD_MIN_WIDTH;
  const columns: 1 | 2 = spread && canSpread && !shortForm ? 2 : 1;
  const paged = !shortForm;
  const isPdf = format === "pdf";

  // `page` means different things per format. For a PDF it is a page index, so
  // a spread advances by two. For text it is a scroll position in container
  // widths — one width already IS the spread, so it always advances by one.
  const step = isPdf ? columns : 1;
  const lastPage = Math.max(0, pageCount - (isPdf ? columns : 1));

  const goto = useCallback(
    (next: number) => onPage(Math.min(Math.max(next, 0), Math.max(0, lastPage))),
    [onPage, lastPage],
  );

  // Clamp when the page count shrinks (resize, zoom, column change).
  useEffect(() => {
    if (paged && page > lastPage) onPage(Math.max(0, lastPage));
  }, [paged, page, lastPage, onPage]);

  // ── keyboard ─────────────────────────────────────────────────────────
  const shell = useRef<HTMLDivElement>(null);

  // Arrow keys are the natural way to turn a page, but the listener is scoped
  // to this window rather than the document — two open books must not both
  // respond to one keypress. That means it needs focus, so take it on open.
  useEffect(() => {
    shell.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const el = shell.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!paged) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); goto(page + step); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goto(page - step); }
      else if (e.key === "Home") { e.preventDefault(); goto(0); }
      else if (e.key === "End") { e.preventDefault(); goto(lastPage); }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [paged, page, step, goto, lastPage]);

  const zoomIndex = useMemo(() => {
    const i = ZOOM_STEPS.indexOf(zoom);
    return i === -1 ? ZOOM_STEPS.indexOf(1) : i;
  }, [zoom]);

  const title = doc.title;
  const author = isLibrary ? (item.doc as LibraryDoc).author : undefined;

  return (
    <div ref={shell} tabIndex={-1} style={readerShell}>
      {/* ── toolbar ── */}
      <div style={toolbar}>
        <button onClick={onBack} style={toolButton}>&lsaquo; Library</button>
        <div style={toolDivider} />
        <div style={{ ...titleStrip, minWidth: 0 }}>
          <strong style={ellipsis}>{title}</strong>
          {author && <span style={{ opacity: 0.7, flexShrink: 0 }}>· {author}</span>}
        </div>
        <div style={{ flex: 1 }} />

        <button
          onClick={() => onZoom(ZOOM_STEPS[Math.max(0, zoomIndex - 1)])}
          disabled={zoomIndex === 0}
          style={{ ...toolButton, opacity: zoomIndex === 0 ? 0.4 : 1 }}
          title="Smaller"
        >
          −
        </button>
        <span style={{ fontSize: 11, minWidth: 34, textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => onZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, zoomIndex + 1)])}
          disabled={zoomIndex === ZOOM_STEPS.length - 1}
          style={{ ...toolButton, opacity: zoomIndex === ZOOM_STEPS.length - 1 ? 0.4 : 1 }}
          title="Larger"
        >
          +
        </button>

        <div style={toolDivider} />
        <button
          onClick={() => onSpread(!spread)}
          disabled={shortForm || !canSpread}
          style={{
            ...toolButton,
            ...(columns === 2 ? toolButtonActive : null),
            opacity: shortForm || !canSpread ? 0.4 : 1,
          }}
          title={
            shortForm ? "Short pieces are read in one column"
              : canSpread ? "Two-page spread"
              : "Widen the window for a two-page spread"
          }
        >
          Spread
        </button>

        <div style={toolDivider} />
        <button onClick={() => downloadDoc(item)} style={toolButton}>Download</button>
        <button
          onClick={() => isLibrary && onShare(item.doc as LibraryDoc)}
          disabled={!isLibrary}
          style={{ ...toolButton, opacity: isLibrary ? 1 : 0.4 }}
          title={isLibrary ? "Copy a link to this document" : "This one only exists in the Recycle Bin"}
        >
          Share
        </button>
      </div>

      {/* ── page ── */}
      <div ref={paneRef} style={paneWrap}>
        {format === "pdf" && isLibrary ? (
          <PdfPane
            src={(item.doc as LibraryDoc).src}
            page={page}
            columns={columns}
            zoom={zoom}
            onPageCount={setPageCount}
          />
        ) : bodyError ? (
          <div className="wb-paper" style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}>
            <span style={{ color: "var(--wb-paper-dim)", fontSize: 15 }}>{bodyError}</span>
          </div>
        ) : body == null ? (
          <div className="wb-paper" style={{ flex: 1, display: "grid", placeItems: "center" }}>
            <span style={{ color: "var(--wb-paper-dim)", fontSize: 15 }}>Opening…</span>
          </div>
        ) : (
          <TextPane
            body={body}
            markdown={format === "md"}
            shortForm={shortForm}
            zoom={zoom}
            columns={columns}
            page={page}
            onPageCount={setPageCount}
            onProgress={setScrollPercent}
          />
        )}

        {/* Floating page turners, riding the edges of the page like the
            reference layout. Hidden for short pieces, which just scroll. */}
        {paged && (
          <>
            <EdgeButton side="left" onClick={() => goto(page - step)} disabled={page <= 0} />
            <EdgeButton side="right" onClick={() => goto(page + step)} disabled={page >= lastPage} />
          </>
        )}
      </div>

      {/* ── status bar ── */}
      <StatusBar
        paged={paged}
        page={page}
        pageCount={pageCount}
        spanned={isPdf ? columns : 1}
        percent={shortForm ? scrollPercent : undefined}
        shelf={isLibrary ? (item.doc as LibraryDoc).shelf : "Recycle Bin"}
      />
    </div>
  );
}

function EdgeButton({
  side, onClick, disabled,
}: {
  side: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Previous page" : "Next page"}
      style={{
        ...edgeButton,
        [side]: 6,
        opacity: disabled ? 0.25 : 0.85,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}

function StatusBar({
  paged, page, pageCount, spanned, percent: scrollPercent, shelf,
}: {
  paged: boolean;
  page: number;
  pageCount: number;
  /** How many numbered pages the current view covers — 2 only for a PDF spread. */
  spanned: 1 | 2;
  /** Short-form only: scroll progress, since there are no pages to count. */
  percent?: number;
  shelf: string;
}) {
  const percent = paged
    ? Math.round((Math.min(page + spanned, pageCount) / Math.max(1, pageCount)) * 100)
    : Math.min(100, Math.max(0, scrollPercent ?? 0));

  return (
    <div style={statusBar}>
      <span style={{ minWidth: 132 }}>
        {paged
          ? spanned === 2
            ? `Pages ${page + 1}–${Math.min(page + 2, pageCount)} of ${pageCount}`
            : `Page ${page + 1} of ${pageCount}`
          : "Continuous"}
      </span>
      <div style={progressTrack}>
        <div style={{ ...progressFill, width: `${percent}%` }} />
      </div>
      <span style={{ minWidth: 36, textAlign: "right" }}>{percent}%</span>
      <span style={{ opacity: 0.7 }}>· {shelf}</span>
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────────────────────── */

const readerShell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  outline: "none",
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
  cursor: "pointer",
  whiteSpace: "nowrap",
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
const titleStrip: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  maxWidth: 420,
};
const ellipsis: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
};
const paneWrap: React.CSSProperties = {
  position: "relative",
  flex: 1,
  minHeight: 0,
  display: "flex",
  background: "var(--wb-gray-3)",
  padding: 3,
};
const edgeButton: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 26,
  height: 46,
  display: "grid",
  placeItems: "center",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3), 2px 2px 0 rgba(0,0,0,0.3)",
  fontFamily: "var(--wb-font)",
  fontSize: 20,
  lineHeight: 1,
  color: "var(--wb-black)",
  padding: 0,
};
const statusBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "3px 8px",
  fontSize: 11,
  background: "var(--wb-gray)",
  borderTop: "1px solid var(--wb-white)",
  flexShrink: 0,
};
const progressTrack: React.CSSProperties = {
  flex: 1,
  height: 8,
  minWidth: 60,
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-3)",
};
const progressFill: React.CSSProperties = {
  height: "100%",
  background: "var(--wb-orange)",
  boxShadow: "inset 0 1px 0 var(--wb-yellow)",
};

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type TextPaneProps = {
  body: string;
  /** Markdown gets rendered; plain text keeps its own line breaks. */
  markdown: boolean;
  /** Short pieces scroll as one column - see isShortForm() in data/library. */
  shortForm: boolean;
  /** 1 = the page's natural size; the reader's zoom control drives this. */
  zoom: number;
  columns: 1 | 2;
  page: number;
  onPageCount: (count: number) => void;
  /** Short-form only: how far down the piece we are, 0–100. */
  onProgress: (percent: number) => void;
  /** Running head on the recto, as a printed book would carry it. */
  title: string;
  /** Running head on the verso. Absent for your own work. */
  author?: string;
};

// Monospace sets larger than a serif at the same size, so the page runs a
// little smaller than the 17px a proportional face wanted.
const BASE_FONT_PX = 15;

/** Folios are zero-padded, like the reference. */
const folio = (n: number) => String(n).padStart(2, "0");

export function TextPane({
  body, markdown, shortForm, zoom, columns, page, onPageCount, onProgress, title, author,
}: TextPaneProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  const content = markdown ? (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
  ) : (
    <pre className="wb-paper-verse">{body}</pre>
  );

  const fontSize = BASE_FONT_PX * zoom;

  // ── short form: one column, plain vertical scroll ────────────────────
  // Progress is reported as a percentage instead of pages, so the status bar
  // still has something true to say. Deliberately NOT written to the window
  // payload - that would put a store write on every scroll frame.
  const reportScrollProgress = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    onProgress(max <= 0 ? 100 : Math.round((el.scrollTop / max) * 100));
  }, [onProgress]);

  // ── long form: multicol pagination ───────────────────────────────────
  // The container is a fixed height, so the columns spill sideways and
  // scrollWidth/clientWidth is the page count. Measured after layout (and on
  // every resize) because both change with window size, zoom and column count.
  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el || shortForm) return;
    const count = Math.max(1, Math.round(el.scrollWidth / Math.max(1, el.clientWidth)));
    setPageCount(count);
    onPageCount(count);
  }, [shortForm, onPageCount]);

  useLayoutEffect(() => {
    if (shortForm) {
      setPageCount(1);
      onPageCount(1);
      return;
    }
    measure();
  }, [measure, shortForm, onPageCount, body, zoom, columns]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || shortForm) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, shortForm]);

  // Fonts land after first paint and reflow the columns under us, which
  // changes the page count. Re-measure once they're ready.
  useEffect(() => {
    if (shortForm) return;
    let cancelled = false;
    document.fonts?.ready.then(() => { if (!cancelled) measure(); });
    return () => { cancelled = true; };
  }, [measure, shortForm]);

  // Drive the scroll position from the page prop. Clamped, because a resize
  // can shrink the page count out from under the current page.
  useEffect(() => {
    const el = scroller.current;
    if (!el || shortForm) return;
    const target = Math.min(Math.max(page, 0), pageCount - 1);
    el.scrollLeft = target * el.clientWidth;
  }, [page, pageCount, shortForm, zoom, columns]);

  if (shortForm) {
    // Same page furniture as a spread, minus the folio - there are no pages to
    // number here. A poem still wants to look like it's printed on something.
    return (
      <div
        className="wb-paper wb-paper-sheet"
        style={{ ...surface, overflow: "hidden", fontSize }}
      >
        <div className="wb-paper-run" style={{ padding: "1.5em 2.6em 1.1em" }}>
          <span>{author ? `${author} · ${title}` : title}</span>
        </div>
        <div
          ref={scroller}
          onScroll={reportScrollProgress}
          style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 2.6em 2.6em" }}
        >
          <div style={{ maxWidth: "34em", margin: "0 auto" }}>{content}</div>
        </div>
      </div>
    );
  }

  // Each screen shows `columns` numbered pages, so the folios run from the
  // scroll position rather than tracking anything of their own.
  const firstFolio = page * columns + 1;

  return (
    <div
      className="wb-paper wb-paper-sheet"
      style={{ ...surface, overflow: "hidden", fontSize }}
    >
      <div className="wb-paper-run" style={{ padding: "1.5em 2.6em 1.1em" }}>
        {/* Verso carries the author, recto the title - the convention a printed
            book uses. Your own work has no author, so the verso sits empty. */}
        {columns === 2 ? (
          <>
            <span>{author ?? ""}</span>
            <span>{title}</span>
          </>
        ) : (
          <span>{title}</span>
        )}
      </div>

      <div ref={scroller} className="wb-paper-cols" style={{ padding: "0 2.6em" }}>
        <div
          style={{
            columnCount: columns,
            columnGap: "4.5em",
            columnFill: "auto",
          }}
        >
          {content}
        </div>
      </div>

      <div className="wb-paper-run" style={{ padding: "1.1em 2.6em 1.5em" }}>
        <span>{folio(firstFolio)}</span>
        {columns === 2 && <span>{folio(firstFolio + 1)}</span>}
      </div>

      {columns === 2 && <div className="wb-paper-spine" />}
    </div>
  );
}

const surface: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
};

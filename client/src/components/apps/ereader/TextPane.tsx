"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type TextPaneProps = {
  body: string;
  /** Markdown gets rendered; plain text keeps its own line breaks. */
  markdown: boolean;
  /** Short pieces scroll as one column — see isShortForm() in data/library. */
  shortForm: boolean;
  /** 1 = the page's natural size; the reader's zoom control drives this. */
  zoom: number;
  columns: 1 | 2;
  page: number;
  onPageCount: (count: number) => void;
  /** Short-form only: how far down the piece we are, 0–100. */
  onProgress: (percent: number) => void;
};

const BASE_FONT_PX = 17;

export function TextPane({
  body, markdown, shortForm, zoom, columns, page, onPageCount, onProgress,
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
  // payload — that would put a store write on every scroll frame.
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
    return (
      <div
        ref={scroller}
        onScroll={reportScrollProgress}
        className="wb-paper"
        style={{ ...surface, overflowY: "auto", fontSize }}
      >
        <div style={{ maxWidth: "34em", margin: "0 auto", padding: "2.6em 1.5em 3.5em" }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="wb-paper" style={{ ...surface, overflow: "hidden", fontSize }}>
      <div ref={scroller} className="wb-paper-cols" style={{ padding: "2.2em 2.4em" }}>
        <div
          style={{
            columnCount: columns,
            columnGap: "3em",
            columnFill: "auto",
            // Gutter rule between the two pages of a spread — the closest thing
            // to a book's inner margin without faking a page fold.
            columnRule: columns === 2 ? "1px solid var(--wb-paper-edge)" : undefined,
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}

const surface: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
};

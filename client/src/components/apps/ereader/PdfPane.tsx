"use client";

import { useEffect, useRef, useState } from "react";
import { useSeek } from "@/lib/useSeek";
import { loadPdfjs, renderPageToCanvas } from "./pdfjs";

export type PdfPaneProps = {
  src: string;
  /** 0-based index of the leftmost visible page. */
  page: number;
  /** Two canvases side by side when the window is wide enough. */
  columns: 1 | 2;
  zoom: number;
  onPageCount: (count: number) => void;
};

type Doc = {
  numPages: number;
  getPage: (n: number) => Promise<never>;
  destroy: () => Promise<void>;
};

export function PdfPane({ src, page, columns, zoom, onPageCount }: PdfPaneProps) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useSeek(loading && !error);

  // Measured on the scrolling surface, not the row inside it: measuring the row
  // would feed its own overflow back in and never settle.
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [doc]);

  // ── open the document ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let opened: Doc | null = null;

    setLoading(true);
    setError(null);
    setDoc(null);

    loadPdfjs()
      .then((pdfjs) => pdfjs.getDocument({ url: src }).promise)
      .then((loaded) => {
        if (cancelled) {
          void (loaded as unknown as Doc).destroy();
          return;
        }
        opened = loaded as unknown as Doc;
        setDoc(opened);
        setLoading(false);
        onPageCount(opened.numPages);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoading(false);
        setError(e instanceof Error ? e.message : "Could not open this PDF.");
      });

    return () => {
      cancelled = true;
      // Tear the worker task down, or minimising a few books leaks them.
      if (opened) void opened.destroy();
    };
  }, [src, onPageCount]);

  if (error) {
    return (
      <div className="wb-paper" style={{ ...surface, ...centered }}>
        <div style={{ maxWidth: 380, textAlign: "center", fontSize: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Couldn&apos;t open this PDF</div>
          <div style={{ color: "var(--wb-paper-dim)" }}>{error}</div>
        </div>
      </div>
    );
  }

  if (loading || !doc) {
    return (
      <div className="wb-paper" style={{ ...surface, ...centered }}>
        <span style={{ color: "var(--wb-paper-dim)", fontSize: 16 }}>Opening…</span>
      </div>
    );
  }

  const pages = columns === 2 ? [page, page + 1] : [page];
  const availWidth = Math.max(
    120,
    (box.w - PAD * 2 - (columns === 2 ? GAP : 0)) / columns,
  );
  const availHeight = Math.max(120, box.h - PAD * 2);

  return (
    <div ref={surfaceRef} className="wb-paper" style={{ ...surface, overflow: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: GAP,
          padding: PAD,
          minHeight: "100%",
        }}
      >
        {pages.map((p) =>
          p < doc.numPages ? (
            <PdfPage
              key={p}
              doc={doc}
              index={p}
              maxWidth={availWidth * zoom}
              maxHeight={availHeight * zoom}
            />
          ) : (
            // Keeps the left page from sliding to the middle on the last odd
            // page of a spread.
            <div key={`blank-${p}`} style={{ flex: "0 1 auto", width: 0 }} />
          ),
        )}
      </div>
    </div>
  );
}

/** One rendered page, scaled to fit the box it is given. */
function PdfPage({
  doc, index, maxWidth, maxHeight,
}: {
  doc: Doc;
  index: number;
  maxWidth: number;
  maxHeight: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!maxWidth || !maxHeight) return;
    let cancelled = false;
    doc
      .getPage(index + 1)
      .then(async (pdfPage) => {
        if (cancelled || !canvas.current) return;
        await renderPageToCanvas(pdfPage, canvas.current, maxWidth, maxHeight);
      })
      .catch(() => {
        // A cancelled render (page turn mid-paint) rejects; nothing to do.
      });
    return () => { cancelled = true; };
  }, [doc, index, maxWidth, maxHeight]);

  return (
    <div style={{ flex: "0 0 auto" }}>
      <canvas
        ref={canvas}
        style={{
          display: "block",
          background: "#fff",
          boxShadow: "0 0 0 1px var(--wb-paper-edge), 2px 2px 0 rgba(0,0,0,0.18)",
        }}
      />
    </div>
  );
}

const PAD = 16;
const GAP = 16;
const surface: React.CSSProperties = { flex: 1, minHeight: 0, minWidth: 0 };
const centered: React.CSSProperties = { display: "grid", placeItems: "center" };

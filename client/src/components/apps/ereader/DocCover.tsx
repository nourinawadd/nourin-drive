"use client";

import { useEffect, useRef, useState } from "react";
import type { LibraryDoc } from "@/data/library";
import { loadPdfjs, renderPageToCanvas } from "./pdfjs";

/**
 * Card art for a document, in three tiers:
 *   1. a real cover image, if one was dropped next to the file;
 *   2. for PDFs, page one rendered to a canvas — but only once the card is
 *      actually on screen, so opening the library doesn't pull the pdf.js
 *      chunk (and render fifty first pages) before you've asked for a book;
 *   3. otherwise a drawn placeholder — the title set on paper, which is what a
 *      poem with no cover should look like anyway.
 */
export function DocCover({ doc, width = 96 }: { doc: LibraryDoc; width?: number }) {
  const height = Math.round(width * 1.42);   // roughly a paperback's proportions

  if (doc.cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- public/ asset of
      // unknown intrinsic size; next/image would need width+height per file.
      <img
        src={doc.cover}
        alt=""
        style={{ ...frame, width, height, objectFit: "cover", imageRendering: "auto" }}
      />
    );
  }

  if (doc.format === "pdf") {
    return <PdfThumb doc={doc} width={width} height={height} />;
  }

  return <PlaceholderCover doc={doc} width={width} height={height} />;
}

function PdfThumb({ doc, width, height }: { doc: LibraryDoc; width: number; height: number }) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let pdf: { getPage: (n: number) => Promise<never>; destroy: () => Promise<void> } | null = null;

    loadPdfjs()
      .then((pdfjs) => pdfjs.getDocument({ url: doc.src }).promise)
      .then(async (loaded) => {
        pdf = loaded as unknown as typeof pdf;
        if (cancelled || !pdf || !canvas.current) return;
        const page = await pdf.getPage(1);
        if (cancelled || !canvas.current) return;
        await renderPageToCanvas(page, canvas.current, width);
        if (!cancelled) setRendered(true);
      })
      .catch(() => {
        // A book that won't open still gets a card — the placeholder stays.
      })
      .finally(() => {
        if (pdf) void pdf.destroy();
      });

    return () => { cancelled = true; };
  }, [visible, doc.src, width]);

  return (
    <div ref={holder} style={{ ...frame, width, height, position: "relative", background: "var(--wb-paper)" }}>
      <canvas
        ref={canvas}
        style={{ display: "block", width, opacity: rendered ? 1 : 0 }}
      />
      {!rendered && <PlaceholderFace doc={doc} width={width} height={height} />}
    </div>
  );
}

function PlaceholderCover({ doc, width, height }: { doc: LibraryDoc; width: number; height: number }) {
  return (
    <div style={{ ...frame, width, height, position: "relative", background: "var(--wb-paper)" }}>
      <PlaceholderFace doc={doc} width={width} height={height} />
    </div>
  );
}

/** The drawn face: a spine stripe, the title, and the author if there is one. */
function PlaceholderFace({ doc, width, height }: { doc: LibraryDoc; width: number; height: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 4,
        padding: `${Math.round(height * 0.1)}px ${Math.round(width * 0.12)}px`,
        borderLeft: `${Math.max(3, Math.round(width * 0.05))}px solid ${spineColor(doc.shelf)}`,
        fontFamily: "var(--wb-paper-font)",
        color: "var(--wb-paper-ink)",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontSize: Math.max(9, Math.round(width * 0.13)),
          lineHeight: 1.25,
          fontWeight: 600,
          // Long titles get clipped rather than pushing the author out.
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {doc.title}
      </span>
      {doc.author && (
        <span
          style={{
            fontSize: Math.max(8, Math.round(width * 0.1)),
            color: "var(--wb-paper-dim)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {doc.author}
        </span>
      )}
    </div>
  );
}

/** Stable per-shelf accent, so a shelf reads as a set at a glance. */
function spineColor(shelf: string): string {
  const palette = [
    "var(--wb-orange)", "var(--wb-teal)", "var(--wb-red)",
    "var(--wb-purple)", "var(--wb-steel)", "var(--wb-tan-d)",
  ];
  let hash = 0;
  for (let i = 0; i < shelf.length; i++) hash = (hash * 31 + shelf.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

const frame: React.CSSProperties = {
  flexShrink: 0,
  border: "1px solid var(--wb-black)",
  boxShadow: "2px 2px 0 rgba(0,0,0,0.25)",
  overflow: "hidden",
};

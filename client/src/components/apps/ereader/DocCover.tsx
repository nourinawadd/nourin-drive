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

/** Below this a cover is a colour swatch; type would be unreadable anyway. */
const MIN_TEXT_WIDTH = 56;
/** Monospace advance width as a fraction of font size, near enough for IBM Plex Mono. */
const CHAR_RATIO = 0.6;
const LINE_RATIO = 1.3;
const MIN_SIZE = 6;

/** Lines needed at `perLine` characters, wrapping on spaces only. */
function countLines(words: string[], perLine: number): number {
  let lines = 1;
  let col = 0;
  for (const word of words) {
    if (col === 0) col = word.length;
    else if (col + 1 + word.length <= perLine) col += 1 + word.length;
    else {
      lines += 1;
      col = word.length;
    }
  }
  return lines;
}

/**
 * Largest type size at which the text fits the cover with every word intact.
 *
 * Two constraints: the longest word must sit on one line, so nothing is ever
 * split down the middle, and the wrapped result must fit the height. Nothing
 * is truncated either — the type shrinks until it fits. A fixed advance width
 * makes both computable, which is the one place the monospace page font earns
 * its keep outside the reader.
 */
function fitSize(text: string, boxW: number, boxH: number, max: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return max;
  const longest = Math.max(...words.map((w) => w.length));
  for (let size = max; size >= MIN_SIZE; size--) {
    const perLine = Math.floor(boxW / (size * CHAR_RATIO));
    if (perLine < longest) continue;   // this size would have to break a word
    if (countLines(words, perLine) * size * LINE_RATIO <= boxH) return size;
  }
  return MIN_SIZE;
}

/** The drawn face: a spine stripe, the title, and the author if there is one. */
function PlaceholderFace({ doc, width, height }: { doc: LibraryDoc; width: number; height: number }) {
  const spine = Math.max(3, Math.round(width * 0.05));
  const padX = Math.round(width * 0.1);
  const padY = Math.round(height * 0.08);

  if (width < MIN_TEXT_WIDTH) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderLeft: `${spine}px solid ${spineColor(doc.shelf)}`,
        }}
      />
    );
  }

  const boxW = width - spine - padX * 2;
  const boxH = height - padY * 2;
  // The author takes roughly a third of the height when there is one.
  const titleH = doc.author ? boxH * 0.62 : boxH;
  const titleSize = fitSize(doc.title, boxW, titleH, Math.round(width * 0.12));
  const authorSize = doc.author
    ? fitSize(doc.author, boxW, boxH * 0.3, Math.max(MIN_SIZE, Math.round(titleSize * 0.85)))
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: Math.round(height * 0.05),
        padding: `${padY}px ${padX}px`,
        borderLeft: `${spine}px solid ${spineColor(doc.shelf)}`,
        fontFamily: "var(--wb-paper-font)",
        color: "var(--wb-paper-ink)",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontSize: titleSize,
          lineHeight: LINE_RATIO,
          // Backstop only. fitSize picks a size where no word needs breaking,
          // so this fires solely for a word too long to fit at any legible
          // size, where breaking still beats spilling outside the cover.
          fontWeight: 600,
          overflowWrap: "break-word",
        }}
      >
        {doc.title}
      </span>
      {doc.author && (
        <span
          style={{
            fontSize: authorSize,
            lineHeight: LINE_RATIO,
          // Backstop only. fitSize picks a size where no word needs breaking,
          // so this fires solely for a word too long to fit at any legible
          // size, where breaking still beats spilling outside the cover.
            color: "var(--wb-paper-dim)",
            overflowWrap: "break-word",
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

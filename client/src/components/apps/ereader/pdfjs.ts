"use client";

// Lazy loader for pdf.js.
//
// pdfjs-dist is about a megabyte. AppRouter imports every app statically, so a
// top-level `import "pdfjs-dist"` anywhere in the Ereader would land the whole
// parser in the desktop's initial bundle — paid for by every visitor, including
// the ones who never open a book. Going through a dynamic import() puts it in
// its own chunk that only loads when a PDF is actually opened (or when a PDF
// card without cover art scrolls into view and wants a page-1 thumbnail).
//
// The worker is copied to /vendor/ by scripts/copy-pdf-worker.mjs. pdf.js
// refuses to start a worker from another origin, and letting the bundler trace
// it is more trouble than it's worth — it's a standalone script, not a module.

type PdfjsModule = typeof import("pdfjs-dist");

let pending: Promise<PdfjsModule> | null = null;

export function loadPdfjs(): Promise<PdfjsModule> {
  if (!pending) {
    pending = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
      return mod;
    });
  }
  return pending;
}

/**
 * Render one page into a canvas at the requested CSS width.
 *
 * Backing store is sized to the device pixel ratio so pages stay sharp on a
 * HiDPI screen, while the CSS box stays at `cssWidth` — otherwise the canvas
 * would double in size on those displays.
 */
export async function renderPageToCanvas(
  page: { getViewport: (o: { scale: number }) => { width: number; height: number } } & Record<string, unknown>,
  canvas: HTMLCanvasElement,
  cssWidth: number,
): Promise<void> {
  const base = page.getViewport({ scale: 1 });
  const scale = cssWidth / base.width;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale: scale * dpr });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.floor(cssWidth)}px`;
  canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // pdf.js types the render task loosely across versions; the shape we need
  // (a `promise` on the returned task) has been stable throughout v3/v4.
  const task = (page as unknown as {
    render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown; canvas: HTMLCanvasElement }) => { promise: Promise<void> };
  }).render({ canvasContext: ctx, viewport, canvas });
  await task.promise;
}

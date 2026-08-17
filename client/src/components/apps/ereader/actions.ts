"use client";

import type { LibraryDoc } from "@/data/library";

/** A document that only exists in memory - the Recycle Bin's deleted text. */
export type InlineDoc = {
  title: string;
  format: LibraryDoc["format"];
  body: string;
};

export type ReadableDoc =
  | { kind: "library"; doc: LibraryDoc }
  | { kind: "inline"; doc: InlineDoc };

function triggerDownload(href: string, fileName: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Characters Windows and macOS refuse in a filename. */
const ILLEGAL = /[\\/:*?"<>|]/g;

/** A trailing ".txt" / ".jpg" / ".mp4" - a letter then up to four more. */
const HAS_EXTENSION = /\.[A-Za-z][A-Za-z0-9]{0,4}$/;

/**
 * Filename for a document that only exists in memory.
 *
 * The title is often already a filename - the Recycle Bin's entries are called
 * things like "passwords.txt" - so appending the format unconditionally saved
 * them as "passwords.txt.txt". Only add an extension when the name doesn't
 * already end in one, and keep whatever extension is there: an entry called
 * "ex.jpg" should save as "ex.jpg", matching what the window said it was.
 */
function inlineFileName(doc: InlineDoc): string {
  const safe = doc.title.replace(ILLEGAL, "_").trim() || "document";
  return HAS_EXTENSION.test(safe) ? safe : `${safe}.${doc.format}`;
}

/**
 * Save the original file, byte for byte - the PDF you found, the .md you wrote.
 * Inline documents have no file behind them, so they're packaged into a Blob on
 * the way out.
 */
export function downloadDoc(item: ReadableDoc): void {
  if (item.kind === "library") {
    // A library document keeps the real name off disk, extension included.
    triggerDownload(item.doc.src, item.doc.fileName);
    return;
  }
  const blob = new Blob([item.doc.body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, inlineFileName(item.doc));
  // Revoke on the next frame - revoking synchronously can race the download in
  // Firefox and leave the user with a zero-byte file.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

/** The link Share hands out, and the one `?doc=` on the desktop resolves. */
export function shareUrl(doc: LibraryDoc): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/?doc=${encodeURIComponent(doc.id)}`;
}

/**
 * Copy a deep link to the clipboard. Falls back to a hidden textarea +
 * execCommand where the async clipboard API isn't available or is blocked
 * (it needs a secure context, so plain-http localhost aside, it can fail).
 * Returns the URL so the caller can show it if copying didn't work.
 */
export async function shareDoc(doc: LibraryDoc): Promise<{ url: string; copied: boolean }> {
  const url = shareUrl(doc);
  try {
    await navigator.clipboard.writeText(url);
    return { url, copied: true };
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return { url, copied: ok };
    } catch {
      return { url, copied: false };
    }
  }
}

/** Body text for a document, fetching it when it was too large to inline. */
export async function fetchBody(doc: LibraryDoc): Promise<string> {
  if (doc.body != null) return doc.body;
  const res = await fetch(doc.src);
  if (!res.ok) throw new Error(`Could not read ${doc.fileName} (HTTP ${res.status})`);
  return res.text();
}

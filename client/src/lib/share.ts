"use client";

// Download and clipboard plumbing shared by the apps that hand out files and
// links - the Ereader's documents and the Gallery's images.

export function triggerDownload(href: string, fileName: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Copy a link to the clipboard. Falls back to a hidden textarea +
 * execCommand where the async clipboard API isn't available or is blocked
 * (it needs a secure context, so plain-http localhost aside, it can fail).
 * Returns the URL so the caller can show it if copying didn't work.
 */
export async function copyLink(url: string): Promise<{ url: string; copied: boolean }> {
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

/** Origin-qualified deep link, e.g. shareLink("photo", "gallery-clancy"). */
export function shareLink(param: string, value: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/?${param}=${encodeURIComponent(value)}`;
}

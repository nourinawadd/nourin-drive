import type { AppId } from "@/types/window";

export const DEEP_LINK_KEYS = ["doc", "post", "photo"] as const;

/** The app each param opens (see useDeepLink). MobileGate checks these against
 *  the phone registry to decide whether the shell can show the link. */
export const DEEP_LINK_APPS: Record<(typeof DEEP_LINK_KEYS)[number], AppId> = {
  doc: "ereader",
  post: "blog",
  photo: "gallery",
};

// Captured on first read and never re-read: useDeepLink strips these params
// from the URL once it has opened the window, so anything asking later would
// see a clean query and conclude there was no deep link.
let capturedSearch: string | null = null;

function search(): string {
  if (capturedSearch === null) {
    capturedSearch = typeof window === "undefined" ? "" : window.location.search;
  }
  return capturedSearch;
}

export function deepLinkParams(): URLSearchParams {
  return new URLSearchParams(search());
}

export function hasDeepLink(): boolean {
  const params = deepLinkParams();
  return DEEP_LINK_KEYS.some((key) => params.get(key));
}

/** The apps the captured link will open, in DEEP_LINK_KEYS order. */
export function deepLinkApps(): AppId[] {
  const params = deepLinkParams();
  return DEEP_LINK_KEYS.filter((key) => params.get(key)).map((key) => DEEP_LINK_APPS[key]);
}

/** Tests only: forget the captured query so the next read takes the current
 *  URL. The app never calls this; one page load has exactly one link. */
export function resetDeepLinkCapture(): void {
  capturedSearch = null;
}

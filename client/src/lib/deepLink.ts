export const DEEP_LINK_KEYS = ["doc", "post", "photo"] as const;

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

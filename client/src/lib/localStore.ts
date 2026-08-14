// The one place in the client that touches browser storage.
//
// Both zustand stores (windowStore, stickyStore) are deliberately in-memory —
// windows and notes are meant to vanish on refresh. Only a couple of guestbook
// flags need to outlive the tab, so this is a narrow helper rather than
// `persist` middleware, which would drag whole stores into storage.
//
// Every read is guarded for SSR (`window` is undefined during the server pass)
// and every access is wrapped: Safari in private mode throws on write, and a
// visitor with storage disabled should get a working desktop, not a crash.

/** Signed the guestbook. Silences the desktop stand's nudge, permanently. */
export const KEY_SIGNED = "wb:guestbook-signed";
/** Collapsed the desktop stand to its title strip. */
export const KEY_STAND_COLLAPSED = "wb:guestbook-collapsed";
/** Hit counter already incremented for this tab session. */
export const KEY_VISIT_COUNTED = "wb:guestbook-counted";

function store(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readFlag(key: string): boolean {
  try {
    return store("local")?.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeFlag(key: string, value: boolean): void {
  try {
    const s = store("local");
    if (!s) return;
    if (value) s.setItem(key, "1");
    else s.removeItem(key);
  } catch {
    /* storage full or blocked — the flag is a nicety, not worth throwing over */
  }
}

export function readSession(key: string): boolean {
  try {
    return store("session")?.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeSession(key: string, value: boolean): void {
  try {
    const s = store("session");
    if (!s) return;
    if (value) s.setItem(key, "1");
    else s.removeItem(key);
  } catch {
    /* see writeFlag */
  }
}

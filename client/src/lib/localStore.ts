// The one place in the client that touches browser storage.
//
// The window and sticky stores are deliberately in-memory — windows and notes
// are meant to vanish on refresh. Only a couple of guestbook flags and the music
// player's settings need to outlive the tab, so this is a narrow helper rather
// than `persist` middleware, which would drag whole stores into storage.
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
/** Music player settings that should outlive the tab — volume, shuffle, repeat,
 *  and the last track, so the player comes back how you left it. */
export const KEY_PLAYER = "wb:player";

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

/**
 * The one non-boolean pair, for the music player's settings blob. Anything
 * unparseable (hand-edited, or written by an older version of the shape) is
 * treated as absent rather than thrown — the caller's defaults are always fine.
 */
export function readJson<T>(key: string): T | null {
  try {
    const raw = store("local")?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    store("local")?.setItem(key, JSON.stringify(value));
  } catch {
    /* see writeFlag */
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

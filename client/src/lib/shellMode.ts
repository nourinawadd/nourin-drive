import { KEY_SHELL_MODE, readSessionString, writeSessionString } from "@/lib/localStore";

// Which shell a visitor gets: today's desktop, the phone shell (Phase 1 onward),
// or the lite landing page that phones have had all along. Everything that
// branches on "is this a phone" should ask here rather than measuring the
// window itself, so there is exactly one rule and one override to test with.
//
// The decision is made once per page load. Re-checking on resize used to swap a
// large phone in landscape (wider than NARROW_PX) to the full desktop and back,
// throwing away whatever it had open; a shell that can change under you is worse
// than one that is occasionally the wrong size until a reload.

export type ShellMode = "desktop" | "phone" | "lite";
/** What `?mode=` can force. `auto` isn't one of these: it clears the override. */
export type ShellOverride = ShellMode;
/**
 * How far the phone shell is rolled out. `off`: nobody gets it and a phone
 * override is ignored. `preview`: only `?mode=phone` gets it. `on`: narrow touch
 * screens get it by default.
 */
export type ShellFlag = "off" | "preview" | "on";

/** Moves to `preview` in Phase 1 and to `on` at launch (Phase 6). */
export const PHONE_SHELL: ShellFlag = "off";

/** Below this width, with a coarse pointer, it's a phone. Unchanged from the
 *  original MobileGate rule. */
export const NARROW_PX = 820;

const MODES: readonly ShellMode[] = ["desktop", "phone", "lite"];

function isMode(value: string | null): value is ShellMode {
  return value !== null && (MODES as readonly string[]).includes(value);
}

/**
 * Reads `mode` from a query string. Anything that isn't a mode or `auto` comes
 * back as null, the same as no param at all, so a typo can't wipe a working
 * override.
 */
export function parseModeParam(search: string): ShellOverride | "auto" | null {
  const value = new URLSearchParams(search).get("mode");
  if (value === "auto") return "auto";
  return isMode(value) ? value : null;
}

/**
 * The override to hold for the tab after this load: a fresh param wins, `auto`
 * clears it, and no param keeps whatever was stored (if it's still a valid mode -
 * a stale or hand-edited value counts as nothing).
 */
export function nextOverride(
  param: ShellOverride | "auto" | null,
  stored: string | null,
): ShellOverride | null {
  if (param === "auto") return null;
  if (param !== null) return param;
  return isMode(stored) ? stored : null;
}

export type ShellInputs = {
  width: number;
  coarse: boolean;
  override: ShellOverride | null;
  flag: ShellFlag;
};

/**
 * The modes table from the roadmap, as a pure function. Desktop and lite
 * overrides always win; a phone override only means something once the shell
 * exists (`preview` or `on`) and is otherwise ignored, leaving detection to
 * decide. Without an override, a narrow touch screen gets the phone shell when
 * it's switched on for everyone, and the lite page until then.
 */
export function resolveShellMode({ width, coarse, override, flag }: ShellInputs): ShellMode {
  if (override === "desktop" || override === "lite") return override;
  if (override === "phone" && flag !== "off") return "phone";

  const phoneSized = width < NARROW_PX && coarse;
  if (!phoneSized) return "desktop";
  return flag === "on" ? "phone" : "lite";
}

// Captured on first read and never re-read, for the same reason as in
// deepLink.ts: the URL gets rewritten after mount, and anything asking again
// (React's dev double-invoked effects, for one) must see the query the page
// actually loaded with.
let capturedSearch: string | null = null;

function initialSearch(): string {
  if (capturedSearch === null) {
    capturedSearch = typeof window === "undefined" ? "" : window.location.search;
  }
  return capturedSearch;
}

/**
 * Takes `mode` out of the address bar, keeping every other param and the hash.
 * A shared or bookmarked link shouldn't carry someone's testing override, and
 * sessionStorage already remembers it for this tab. Works from the live URL
 * rather than the captured one so it can't resurrect params something else has
 * already stripped; with no `mode` present it doesn't touch history at all.
 */
function stripModeParam(): void {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("mode")) return;
  params.delete("mode");
  const query = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + (query ? `?${query}` : "") + window.location.hash,
  );
}

/**
 * The browser-side wrapper: reads the query and the held override, stores the
 * new one, strips the param from the URL, measures the screen, and resolves.
 * Only call it from an effect - during the static prerender there is no window
 * and the answer would be wrong. `search` is a parameter so tests can feed a
 * query without fighting the capture.
 */
export function detectShellMode(search: string = initialSearch()): ShellMode {
  const override = nextOverride(parseModeParam(search), readSessionString(KEY_SHELL_MODE));
  writeSessionString(KEY_SHELL_MODE, override);
  stripModeParam();

  const coarse =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  return resolveShellMode({ width: window.innerWidth, coarse, override, flag: PHONE_SHELL });
}

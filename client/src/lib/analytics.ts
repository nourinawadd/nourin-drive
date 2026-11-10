import type { ShellMode } from "@/lib/shellMode";
import type { AppId } from "@/types/window";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

type GtagCommand = "config" | "event" | "js";
type GtagParams = Record<string, string | number | boolean | undefined>;
/** Clarity's global, either the real tag or the queueing stub its snippet installs. */
type Clarity = ((command: "event" | "set", ...args: string[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: GtagCommand, target: string | Date, params?: GtagParams) => void;
    clarity?: Clarity;
  }
}

function getGtag() {
  if (typeof window === "undefined") return undefined;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag(...args) {
      window.dataLayer?.push(args);
    };

  return window.gtag;
}

// The same stub Clarity's own snippet installs (Analytics.tsx): calls queue up
// until the real tag loads and replays them. The snippet keeps an existing
// stub, queue and all, so whichever of the two runs first, nothing is lost.
// Needed because the snippet loads afterInteractive, which is usually after
// the shell mode is detected.
function getClarity() {
  if (typeof window === "undefined") return undefined;

  if (!window.clarity) {
    const stub: Clarity = (...args) => {
      (stub.q = stub.q ?? []).push(args);
    };
    window.clarity = stub;
  }

  return window.clarity;
}

// Which shell the visitor got, so phone usage shows up in the reports. Set once
// per load by ShellModeProvider, before anything can open an app.
let shellMode: ShellMode | undefined;

/**
 * Records the shell for this load: a Clarity tag (filterable across a whole
 * session) and, through trackAppOpen, a param on every GA `app_open`. With
 * neither analytics ID set it only remembers the mode, so it costs nothing.
 */
export function setShellMode(mode: ShellMode) {
  shellMode = mode;
  if (CLARITY_PROJECT_ID) getClarity()?.("set", "shell_mode", mode);
}

export function pageview(path: string) {
  if (!GA_MEASUREMENT_ID) return;

  getGtag()?.("config", GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: document.title,
    send_page_view: true,
  });
}

export function trackAppOpen(appId: AppId, reusedWindow: boolean) {
  if (typeof window === "undefined") return;

  const gtag = GA_MEASUREMENT_ID ? getGtag() : undefined;

  if (GA_MEASUREMENT_ID && gtag) {
    gtag("event", "app_open", {
      app_id: appId,
      reused_window: reusedWindow,
      shell_mode: shellMode,
    });
  }

  if (CLARITY_PROJECT_ID && window.clarity) {
    window.clarity("event", `app_open_${appId}`);
  }
}
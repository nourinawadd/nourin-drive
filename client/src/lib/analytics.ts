import type { AppId } from "@/types/window";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

type GtagCommand = "config" | "event" | "js";
type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: GtagCommand, target: string | Date, params?: GtagParams) => void;
    clarity?: (command: "event", name: string) => void;
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
    });
  }

  if (CLARITY_PROJECT_ID && window.clarity) {
    window.clarity("event", `app_open_${appId}`);
  }
}
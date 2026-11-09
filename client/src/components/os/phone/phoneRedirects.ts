import type { OpenInterceptor } from "@/context/windowStore";

// Opens that mean something else on a phone, answered before any window
// appears (see setOpenInterceptor in windowStore). One place, so Explorer, the
// Shell app and anything later all behave the same without each checking the
// shell mode itself.
//
// The in-site Browser stays hidden on phones: a browser inside a phone's
// browser is the worst of both. When something asks it to show a particular
// site, the phone opens that site in a real tab instead. A bare "open the
// Browser" (About's tile, say) isn't a link to anywhere, so it falls through to
// the shell's "needs a computer" screen like any other hidden app.
//
// window.open runs here, synchronously inside openApp, which is itself inside
// the tap (or the action sheet's item click). That keeps it a user-initiated
// open, which is all popup blockers ask; an open after an await would be
// blocked.
//
// Phase 5 adds `game` (a WebGL build) -> its itch.io page here.

export const phoneOpenInterceptor: OpenInterceptor = (appId, opts) => {
  if (appId === "browser") {
    const url = (opts?.payload as { initialUrl?: string } | undefined)?.initialUrl;
    if (!url) return false;
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }
  return false;
};

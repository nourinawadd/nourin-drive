import type { OpenInterceptor } from "@/context/windowStore";
import { trackAppOpen } from "@/lib/analytics";
import { LOCAL_GAMES } from "@/data/games.generated";
import { PROJECTS } from "@/data/projects";

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
// A `game` window is a 10-40 MB WebGL build that expects a keyboard, so on a
// phone it opens the game's itch.io page in a tab instead, which has its own
// mobile handling (or says plainly that the game is desktop only). The three
// places that start a game (Games, Explorer, the Shell app) only pass the
// build's `src`, so the itch URL is found from that: the build's slug in
// LOCAL_GAMES, then that project's `url`. A build with no itch page falls
// through to "needs a computer", because linking a phone straight at the raw
// build would download all of it to show a game it can't play.
//
// A redirected open still counts as an app_open (never a reused window, since
// none is involved). openApp tracks only the opens it handles, and returns
// before that for these, so without this a phone's game and website taps would
// never show up in analytics at all.

/** The itch.io page for a local game build, found by the build's `src`. */
function itchUrlFor(src: string | undefined): string | undefined {
  if (!src) return undefined;
  const slug = Object.keys(LOCAL_GAMES).find((id) => LOCAL_GAMES[id].src === src);
  return slug ? PROJECTS.find((p) => p.id === slug)?.url : undefined;
}

export const phoneOpenInterceptor: OpenInterceptor = (appId, opts) => {
  if (appId === "browser") {
    const url = (opts?.payload as { initialUrl?: string } | undefined)?.initialUrl;
    if (!url) return false;
    window.open(url, "_blank", "noopener,noreferrer");
    trackAppOpen(appId, false);
    return true;
  }
  if (appId === "game") {
    const url = itchUrlFor((opts?.payload as { src?: string } | undefined)?.src);
    if (!url) return false;
    window.open(url, "_blank", "noopener,noreferrer");
    trackAppOpen(appId, false);
    return true;
  }
  return false;
};

"use client";

import { useEffect } from "react";
import { AudioEngine } from "@/components/os/AudioEngine";
import { BootScreen } from "@/components/os/BootScreen";
import { DesktopStickies } from "@/components/os/DesktopStickies";
import { DesktopTray } from "@/components/os/DesktopTray";
import { DriveColumn } from "@/components/os/DriveColumn";
import { MinimizedIcons } from "@/components/os/MinimizedIcons";
import { MobileGate } from "@/components/os/MobileGate";
import { KonamiListener } from "@/components/os/KonamiListener";
import { SessionGate } from "@/components/os/SessionGate";
import { SfxEngine } from "@/components/os/SfxEngine";
import { TopMenubar } from "@/components/os/TopMenubar";
import { WindowLayer } from "@/components/os/WindowLayer";
import { useWindowStore } from "@/context/windowStore";
import { findPost } from "@/data/blog";
import { KEY_README_SEEN, readFlag, writeFlag } from "@/lib/localStore";

/**
 * `?doc=<id>` opens the Ereader on that document - the link the reader's Share
 * button hands out. `?post=<slug>` does the same for a blog post, and
 * `?photo=<id>` opens the Gallery lightbox. The param is
 * stripped afterwards so a reload doesn't reopen the window (and so the URL
 * stays clean once you're in the desktop).
 */
function useDeepLink() {
  const openApp = useWindowStore((s) => s.openApp);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get("doc");
    const postSlug = params.get("post");
    const photoId = params.get("photo");
    if (!docId && !postSlug && !photoId) return;

    if (docId) openApp("ereader", { payload: { docId, view: "read" } });
    if (photoId) openApp("gallery", { payload: { focusId: photoId } });
    if (postSlug) {
      const post = findPost(postSlug);
      openApp("blog", { payload: { slug: postSlug }, title: post ? post.title : "Blog" });
    }

    params.delete("doc");
    params.delete("post");
    params.delete("photo");
    const query = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""));
  }, [openApp]);
}

/**
 * First visit gets the readme opened for them - a desktop nobody has seen
 * before doesn't explain itself. Declared after useDeepLink so its effect runs
 * second: a shared ?doc= / ?post= link has already opened its window by then,
 * and the windows check below leaves that visitor alone.
 */
function useFirstRun() {
  const openApp = useWindowStore((s) => s.openApp);
  useEffect(() => {
    if (readFlag(KEY_README_SEEN)) return;
    if (useWindowStore.getState().windows.length > 0) return;
    writeFlag(KEY_README_SEEN, true);
    openApp("readme");
  }, [openApp]);
}

function Desktop() {
  const openApp = useWindowStore((s) => s.openApp);
  useDeepLink();
  useFirstRun();

  return (
    <main
      className="wb-desktop-bg"
      style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}
    >
      <TopMenubar />
      <DriveColumn />
      <DesktopStickies />
      <MinimizedIcons />
      <WindowLayer />
      <DesktopTray />

      <BootScreen />
      {/* Outside WindowLayer on purpose: a minimized window unmounts, and the
          music should not stop just because you put the player away. */}
      <AudioEngine />
      <SfxEngine />
      <KonamiListener onTrigger={() => openApp("easter-egg")} />
    </main>
  );
}

export default function Home() {
  return (
    <MobileGate>
      <SessionGate>
        <Desktop />
      </SessionGate>
    </MobileGate>
  );
}

"use client";

import { useEffect } from "react";
import { AudioEngine } from "@/components/os/AudioEngine";
import { BootScreen } from "@/components/os/BootScreen";
import { DesktopStickies } from "@/components/os/DesktopStickies";
import { DesktopTray } from "@/components/os/DesktopTray";
import { DriveColumn } from "@/components/os/DriveColumn";
import { KonamiListener } from "@/components/os/KonamiListener";
import { TopMenubar } from "@/components/os/TopMenubar";
import { WindowLayer } from "@/components/os/WindowLayer";
import { useWindowStore } from "@/context/windowStore";
import { findPost } from "@/data/blog";

/**
 * `?doc=<id>` opens the Ereader on that document — the link the reader's Share
 * button hands out. `?post=<slug>` does the same for a blog post. The param is
 * stripped afterwards so a reload doesn't reopen the window (and so the URL
 * stays clean once you're in the desktop).
 */
function useDeepLink() {
  const openApp = useWindowStore((s) => s.openApp);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get("doc");
    const postSlug = params.get("post");
    if (!docId && !postSlug) return;

    if (docId) openApp("ereader", { payload: { docId, view: "read" } });
    if (postSlug) {
      const post = findPost(postSlug);
      openApp("blog", { payload: { slug: postSlug }, title: post ? post.title : "Blog" });
    }

    params.delete("doc");
    params.delete("post");
    const query = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""));
  }, [openApp]);
}

export default function Home() {
  const openApp = useWindowStore((s) => s.openApp);
  useDeepLink();

  return (
    <main
      className="wb-desktop-bg"
      style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}
    >
      <TopMenubar />
      <DriveColumn />
      <DesktopStickies />
      <WindowLayer />
      <DesktopTray />

      <BootScreen />
      {/* Outside WindowLayer on purpose: a minimized window unmounts, and the
          music should not stop just because you put the player away. */}
      <AudioEngine />
      <KonamiListener onTrigger={() => openApp("easter-egg")} />
    </main>
  );
}

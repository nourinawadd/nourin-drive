"use client";

import { useEffect, useState } from "react";
import { AudioEngine } from "@/components/os/AudioEngine";
import { BootScreen } from "@/components/os/BootScreen";
import { DesktopStickies } from "@/components/os/DesktopStickies";
import { DesktopTray } from "@/components/os/DesktopTray";
import { DriveColumn } from "@/components/os/DriveColumn";
import { MinimizedIcons } from "@/components/os/MinimizedIcons";
import { MobileGate } from "@/components/os/MobileGate";
import { PrefsEngine } from "@/components/os/PrefsEngine";
import { KonamiListener } from "@/components/os/KonamiListener";
import { SessionGate } from "@/components/os/SessionGate";
import { SfxEngine } from "@/components/os/SfxEngine";
import { SignalReveal } from "@/components/os/SignalReveal";
import { TopMenubar } from "@/components/os/TopMenubar";
import { WindowLayer } from "@/components/os/WindowLayer";
import { useWindowStore } from "@/context/windowStore";
import { findPost } from "@/data/blog";
import { playSfx } from "@/lib/sfx";
import { deepLinkParams, hasDeepLink } from "@/lib/deepLink";

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
    const params = deepLinkParams();
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
 * The readme introduces itself a beat after the disk goes in, rather than being
 * there the instant the desktop appears - the pause reads as the machine
 * finishing its boot. Skipped entirely when something else is already open,
 * which is what a shared deep link does.
 */
const README_DELAY_MS = 2000;

function useReadmeAfterBoot(booted: boolean) {
  const openApp = useWindowStore((s) => s.openApp);
  useEffect(() => {
    if (!booted) return;
    if (hasDeepLink()) return;
    const t = setTimeout(() => {
      if (useWindowStore.getState().windows.length > 0) return;
      playSfx("open");
      openApp("readme");
    }, README_DELAY_MS);
    return () => clearTimeout(t);
  }, [booted, openApp]);
}

function Desktop() {
  const [booted, setBooted] = useState(false);
  const [signal, setSignal] = useState(false);
  useDeepLink();
  useReadmeAfterBoot(booted);

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

      <BootScreen onBoot={() => setBooted(true)} />
      {/* Outside WindowLayer on purpose: a minimized window unmounts, and the
          music should not stop just because you put the player away. */}
      <AudioEngine />
      <SfxEngine />
      <PrefsEngine />
      {!signal && <KonamiListener onTrigger={() => setSignal(true)} />}
      <SignalReveal open={signal} onClose={() => setSignal(false)} />
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

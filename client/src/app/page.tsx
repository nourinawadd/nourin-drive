"use client";

import { useEffect } from "react";
import { BootScreen } from "@/components/os/BootScreen";
import { DesktopStickies } from "@/components/os/DesktopStickies";
import { Dock } from "@/components/os/Dock";
import { DriveColumn } from "@/components/os/DriveColumn";
import { GuestbookStand } from "@/components/os/GuestbookStand";
import { KonamiListener } from "@/components/os/KonamiListener";
import { Taskbar } from "@/components/os/Taskbar";
import { TopMenubar } from "@/components/os/TopMenubar";
import { WindowLayer } from "@/components/os/WindowLayer";
import { useWindowStore } from "@/context/windowStore";

/**
 * `?doc=<id>` opens the Ereader on that document — the link the reader's Share
 * button hands out. The param is stripped afterwards so a reload doesn't
 * reopen the window (and so the URL stays clean once you're in the desktop).
 */
function useDeepLink() {
  const openApp = useWindowStore((s) => s.openApp);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get("doc");
    if (!docId) return;
    openApp("ereader", { payload: { docId, view: "read" } });
    params.delete("doc");
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
      <GuestbookStand />
      <Taskbar />
      <Dock />

      <BootScreen />
      <KonamiListener onTrigger={() => openApp("easter-egg")} />
    </main>
  );
}

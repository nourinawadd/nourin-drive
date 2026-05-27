"use client";

import { BootScreen } from "@/components/os/BootScreen";
import { CursorLayer } from "@/components/os/CursorLayer";
import { DesktopClippings } from "@/components/os/DesktopClippings";
import { Dock } from "@/components/os/Dock";
import { DriveColumn } from "@/components/os/DriveColumn";
import { KonamiListener } from "@/components/os/KonamiListener";
import { Taskbar } from "@/components/os/Taskbar";
import { TopMenubar } from "@/components/os/TopMenubar";
import { WindowLayer } from "@/components/os/WindowLayer";
import { useWindowStore } from "@/context/windowStore";

export default function Home() {
  const openApp = useWindowStore((s) => s.openApp);

  return (
    <main
      className="wb-desktop-bg"
      style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}
    >
      <TopMenubar />
      <DriveColumn />
      <DesktopClippings />
      <WindowLayer />
      <Taskbar />
      <Dock />

      <BootScreen />
      <KonamiListener onTrigger={() => openApp("easter-egg")} />
      <CursorLayer />
    </main>
  );
}

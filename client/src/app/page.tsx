"use client";

import { BootScreen } from "@/components/os/BootScreen";
import { Dock } from "@/components/os/Dock";
import { DriveColumn } from "@/components/os/DriveColumn";
import { KonamiListener } from "@/components/os/KonamiListener";
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
      <WindowLayer />
      <Dock />

      <BootScreen />
      <KonamiListener onTrigger={() => openApp("easter-egg")} />
    </main>
  );
}

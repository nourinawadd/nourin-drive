"use client";

import { useEffect, useState } from "react";
import { AudioEngine } from "@/components/os/AudioEngine";
import { BootScreen } from "@/components/os/BootScreen";
import { DesktopStickies } from "@/components/os/DesktopStickies";
import { DesktopMenu } from "@/components/os/DesktopMenu";
import { DesktopTray } from "@/components/os/DesktopTray";
import { DriveColumn } from "@/components/os/DriveColumn";
import { MinimizedIcons } from "@/components/os/MinimizedIcons";
import { MobileGate } from "@/components/os/MobileGate";
import { PrefsEngine } from "@/components/os/PrefsEngine";
import { KonamiListener } from "@/components/os/KonamiListener";
import { SfxEngine } from "@/components/os/SfxEngine";
import { ShellModeProvider } from "@/components/os/ShellModeProvider";
import { PixelPet } from "@/components/os/pet/PixelPet";
import { PhoneShell } from "@/components/os/phone/PhoneShell";
import { Screensaver } from "@/components/os/Screensaver";
import { SignalReveal } from "@/components/os/SignalReveal";
import { TopMenubar } from "@/components/os/TopMenubar";
import { WindowLayer } from "@/components/os/WindowLayer";
import { WindowSwitcher } from "@/components/os/WindowSwitcher";
import { usePrefsStore } from "@/context/prefsStore";
import { DEFAULT_SAVER, SAVER_OFF } from "@/data/savers";
import { useDeepLink } from "@/lib/useDeepLink";
import { useIdle } from "@/lib/idle";
import { useReadmeAfterBoot } from "@/lib/readmeIntro";

function Desktop() {
  const [booted, setBooted] = useState(false);
  const [signal, setSignal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const saver = usePrefsStore((s) => s.saver);
  const saverIdle = usePrefsStore((s) => s.saverIdle);
  useDeepLink();
  useReadmeAfterBoot(booted);

  useIdle({
    timeoutMs: saverIdle * 1000,
    enabled: booted && !signal && !saving && saver !== SAVER_OFF,
    onIdle: () => setSaving(true),
  });

  useEffect(() => {
    const onBlank = () => setSaving(true);
    window.addEventListener("wb:blank-screen", onBlank);
    return () => window.removeEventListener("wb:blank-screen", onBlank);
  }, []);

  return (
    <main
      className="wb-desktop-bg"
      style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}
      onContextMenu={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <TopMenubar />
      <DriveColumn />
      <DesktopStickies />
      <MinimizedIcons />
      <WindowLayer />
      <DesktopTray />
      {menu && <DesktopMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}

      <BootScreen onBoot={() => setBooted(true)} />
      {/* Outside WindowLayer on purpose: a minimized window unmounts, and the
          music should not stop just because you put the player away. */}
      <AudioEngine />
      <SfxEngine />
      <WindowSwitcher />
      <PrefsEngine />
      {!signal && <KonamiListener onTrigger={() => setSignal(true)} />}
      <SignalReveal open={signal} onClose={() => setSignal(false)} />
      <Screensaver
        open={saving}
        saverId={saver === SAVER_OFF ? DEFAULT_SAVER : saver}
        onWake={() => setSaving(false)}
      />
      <PixelPet enabled={booted} />
    </main>
  );
}

export default function Home() {
  return (
    <ShellModeProvider>
      <MobileGate phone={<PhoneShell />}>
        <Desktop />
      </MobileGate>
    </ShellModeProvider>
  );
}

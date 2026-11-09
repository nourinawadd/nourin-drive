"use client";

import { AppRouter } from "@/components/os/AppRouter";
import { AudioEngine } from "@/components/os/AudioEngine";
import { BootScreen } from "@/components/os/BootScreen";
import { PrefsEngine } from "@/components/os/PrefsEngine";
import { SfxEngine } from "@/components/os/SfxEngine";
import { PhoneBar } from "@/components/os/phone/PhoneBar";
import { PhoneFrame } from "@/components/os/phone/PhoneFrame";
import { PhoneLauncher } from "@/components/os/phone/PhoneLauncher";
import { PhoneUnsupported } from "@/components/os/phone/PhoneUnsupported";
import { topWindow } from "@/components/os/phone/phoneWindows";
import { useWindowStore } from "@/context/windowStore";
import { mobileSupport } from "@/data/appRegistry";

// Nothing on the phone waits for the disk to go in: the readme intro, the
// screensaver and the pet are desktop features and aren't mounted here. The
// boot screen stays for the ceremony (and its tap is what plays the chime).
const noop = () => {};

/**
 * The whole page in phone mode, mounted by MobileGate instead of the desktop.
 * It is deliberately a sibling of Desktop rather than a branch inside it, so
 * the desktop's JSX, WindowFrame and WindowLayer don't have to know phones
 * exist.
 *
 * It shares the desktop's stores and apps but none of its furniture: a bar,
 * then either the launcher or the single top window. Only that one window is
 * mounted. The rest stay in the store untouched; unmounting is lossless because
 * apps keep their state in the window payload, and music keeps playing because
 * AudioEngine, not the Music window, owns the <audio> element. The three
 * engines are mounted here for the same reasons the desktop mounts them.
 */
export function PhoneShell() {
  const top = useWindowStore((s) => topWindow(s.windows));

  return (
    <div className="wb-phone wb-desktop-bg">
      <PhoneBar />
      <main className="wb-phone-main">
        {top ? (
          // Keyed by window so switching windows remounts the frame, which also
          // resets the body's scroll position instead of carrying it over.
          <PhoneFrame key={top.id} win={top}>
            {mobileSupport(top.appId) === "hidden" ? (
              <PhoneUnsupported win={top} />
            ) : (
              <AppRouter win={top} />
            )}
          </PhoneFrame>
        ) : (
          <PhoneLauncher />
        )}
      </main>

      <BootScreen onBoot={noop} />
      <AudioEngine />
      <SfxEngine />
      <PrefsEngine />
    </div>
  );
}

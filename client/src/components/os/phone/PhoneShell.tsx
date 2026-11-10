"use client";

import { useEffect } from "react";
import { AppRouter } from "@/components/os/AppRouter";
import { AudioEngine } from "@/components/os/AudioEngine";
import { BootScreen } from "@/components/os/BootScreen";
import { useCountVisit } from "@/components/os/GuestbookStand";
import { PrefsEngine } from "@/components/os/PrefsEngine";
import { SfxEngine } from "@/components/os/SfxEngine";
import { PhoneBar } from "@/components/os/phone/PhoneBar";
import { PhoneFrame } from "@/components/os/phone/PhoneFrame";
import { PhoneLauncher } from "@/components/os/phone/PhoneLauncher";
import { PhoneNowPlaying } from "@/components/os/phone/PhoneNowPlaying";
import { PhoneUnsupported } from "@/components/os/phone/PhoneUnsupported";
import { phoneOpenInterceptor } from "@/components/os/phone/phoneRedirects";
import { topWindow } from "@/components/os/phone/phoneWindows";
import { usePhoneHistory } from "@/components/os/phone/usePhoneHistory";
import { setOpenInterceptor, useWindowStore } from "@/context/windowStore";
import { mobileSupport } from "@/data/appRegistry";
import { useDeepLink } from "@/lib/useDeepLink";

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

  // While the shell is up, some opens become something other than a window
  // (a website link opens a real tab). Unregistered on unmount so nothing of
  // the phone's policy can outlive it.
  useEffect(() => {
    setOpenInterceptor(phoneOpenInterceptor);
    return () => setOpenInterceptor(null);
  }, []);

  // A shared link opens its app here the same way it does on the desktop
  // (MobileGate only lets one through when the shell can show its app). Called
  // after the interceptor so the opens go through the same phone policy as a
  // tap would. The boot screen skips itself for a deep link, so the visitor
  // lands on the document, with the launcher one Back away.
  useDeepLink();

  // The guestbook's visitor counter. On the desktop the stand counts the visit;
  // the phone has no stand, so the shell does it, with the same one-per-session
  // guard.
  useCountVisit();

  // Hardware and browser Back close the top app, like the back gadget. Its
  // first entry is pushed on the render after the deep link's windows open,
  // so it carries the URL useDeepLink has already cleaned.
  usePhoneHistory();

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

      {/* Under the content, not over it: <main> shrinks to make room, so the bar
          never covers the bottom of an app. */}
      <PhoneNowPlaying hidden={top?.appId === "music"} />

      <BootScreen onBoot={noop} />
      <AudioEngine />
      <SfxEngine />
      <PrefsEngine />
    </div>
  );
}

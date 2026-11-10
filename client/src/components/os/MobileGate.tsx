"use client";

import type { ReactNode } from "react";
import { MobileReader } from "@/components/os/mobile/MobileReader";
import { MobileScreen } from "@/components/os/mobile/MobileScreen";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { DevCrash, PhoneErrorBoundary } from "@/components/os/phone/PhoneErrorBoundary";
import { mobileSupport } from "@/data/appRegistry";
import { deepLinkApps, hasDeepLink } from "@/lib/deepLink";

// Chooses what the page is once the shell mode is known. Detection itself
// lives in lib/shellMode.ts; this only maps the answer to a screen.

type Props = {
  /** The desktop. */
  children: ReactNode;
  /** The phone shell, rendered instead of the desktop in `phone` mode. Passed
   *  in rather than imported so the desktop and the phone stay siblings, and
   *  neither has to know the other exists. */
  phone: ReactNode;
};

/** The line the lite page shows when it's standing in for a crashed shell. */
export const SHELL_CRASH_NOTICE = "The phone version hit a problem, so here's the simple one.";

export function MobileGate({ children, phone }: Props) {
  const mode = useShellMode();

  // Nothing at all while checking: rendering the desktop as a default would
  // flash it on every phone before the landing page replaced it.
  if (mode === null) return null;
  if (mode === "desktop") return <>{children}</>;

  // Every path into the phone shell goes through here, so a render crash
  // anywhere in it lands on the lite page with a notice instead of a blank
  // screen. The lite page is `position: fixed` over the whole viewport, so it
  // covers anything the shell left behind (the phone bar is unmounted with
  // the rest, and the shell's effects clean up as they would on any unmount).
  const shell = (
    <PhoneErrorBoundary fallback={<MobileScreen notice={SHELL_CRASH_NOTICE} />}>
      {process.env.NODE_ENV !== "production" && <DevCrash at="shell" />}
      {phone}
    </PhoneErrorBoundary>
  );

  // A shared ?doc= / ?photo= / ?post= link. Lite mode keeps the lite reader,
  // its safety net. The phone shell opens the link itself (useDeepLink), as
  // long as every app the link opens is one the phone offers; a link into an
  // app the shell hides would only land on "needs a computer", so the lite
  // reader, which can show any of them as a page, takes it instead.
  if (hasDeepLink()) {
    const shellCanShow =
      mode === "phone" && deepLinkApps().every((appId) => mobileSupport(appId) !== "hidden");
    return shellCanShow ? shell : <MobileReader />;
  }
  return mode === "phone" ? shell : <MobileScreen />;
}

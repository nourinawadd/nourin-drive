"use client";

import { MobileReader } from "@/components/os/mobile/MobileReader";
import { MobileScreen } from "@/components/os/mobile/MobileScreen";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { hasDeepLink } from "@/lib/deepLink";

// Chooses what the page is once the shell mode is known. Detection itself
// lives in lib/shellMode.ts; this only maps the answer to a screen.

export function MobileGate({ children }: { children: React.ReactNode }) {
  const mode = useShellMode();

  // Nothing at all while checking: rendering the desktop as a default would
  // flash it on every phone before the landing page replaced it.
  if (mode === null) return null;
  if (mode === "desktop") return <>{children}</>;

  // `phone` can't be reached while PHONE_SHELL is off, so for now it gets the
  // lite page too. Phase 1 gives it the phone shell here.
  return hasDeepLink() ? <MobileReader /> : <MobileScreen />;
}

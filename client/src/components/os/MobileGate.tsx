"use client";

import { useEffect, useState } from "react";
import { MobileReader } from "@/components/os/mobile/MobileReader";
import { MobileScreen } from "@/components/os/mobile/MobileScreen";
import { hasDeepLink } from "@/lib/deepLink";

const NARROW_PX = 820;

type Status = "checking" | "mobile" | "desktop";

function useIsMobile(): Status {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const check = () => {
      const narrow = window.innerWidth < NARROW_PX;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      setStatus(narrow && coarse ? "mobile" : "desktop");
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return status;
}

export function MobileGate({ children }: { children: React.ReactNode }) {
  const status = useIsMobile();

  if (status === "checking") return null;
  if (status === "mobile") return hasDeepLink() ? <MobileReader /> : <MobileScreen />;
  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { startSeek } from "@/lib/sfx";

export function useSeek(active: boolean, maxMs?: number): void {
  useEffect(() => {
    if (!active) return;
    return startSeek(maxMs);
  }, [active, maxMs]);
}

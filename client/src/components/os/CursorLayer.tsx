"use client";

import { useEffect, useState } from "react";
import { Pointer } from "@/components/os/icons";

// Hides the OS cursor (via CSS on the desktop) and draws the chunky orange
// Workbench pointer following the mouse. Renders nothing until the first
// move, so server and client markup match.
export function CursorLayer() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // -2,-2 nudges the SVG so the arrow tip lands on the real hotspot.
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX - 2, y: e.clientY - 2 });
    const onLeave = () => setPos(null);
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  if (!pos) return null;
  return <Pointer x={pos.x} y={pos.y} />;
}

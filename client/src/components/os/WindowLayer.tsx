"use client";

import { AppRouter } from "@/components/os/AppRouter";
import { WindowFrame } from "@/components/os/WindowFrame";
import { useWindowStore } from "@/context/windowStore";

export function WindowLayer() {
  const windows = useWindowStore((s) => s.windows);
  return (
    <>
      {windows.map((win) => (
        <WindowFrame key={win.id} win={win}>
          <AppRouter win={win} />
        </WindowFrame>
      ))}
    </>
  );
}

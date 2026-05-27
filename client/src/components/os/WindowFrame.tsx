"use client";

import { Rnd } from "react-rnd";
import type { ReactNode } from "react";
import { useWindowStore } from "@/context/windowStore";
import { APP_REGISTRY } from "@/data/appRegistry";
import type { WindowInstance } from "@/types/window";
import { CloseGlyph, MinGlyph, DepthGlyph } from "@/components/os/icons";

const MENUBAR_H = 18;

type Props = {
  win: WindowInstance;
  children: ReactNode;
};

export function WindowFrame({ win, children }: Props) {
  const focus = useWindowStore((s) => s.focus);
  const close = useWindowStore((s) => s.closeWin);
  const sendToBack = useWindowStore((s) => s.sendToBack);
  const minimize = useWindowStore((s) => s.minimize);
  const updateBounds = useWindowStore((s) => s.updateBounds);
  const focusedId = useWindowStore((s) => s.focusedId);

  const def = APP_REGISTRY[win.appId];
  const active = focusedId === win.id;

  if (win.minimized) return null;

  return (
    <Rnd
      position={{ x: win.x, y: win.y }}
      size={{ width: win.width, height: win.height }}
      minWidth={def.minWidth ?? 240}
      minHeight={def.minHeight ?? 140}
      dragHandleClassName="wb-titlebar"
      cancel=".wb-gadget"
      style={{ zIndex: win.z }}
      onDragStart={() => focus(win.id)}
      onDragStop={(_e, d) => {
        updateBounds(win.id, { x: d.x, y: Math.max(MENUBAR_H, d.y) });
      }}
      onResizeStart={() => focus(win.id)}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        updateBounds(win.id, {
          x: pos.x,
          y: Math.max(MENUBAR_H, pos.y),
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
      }}
    >
      <div
        className={`wb-window${active ? " is-active" : ""}`}
        style={{ position: "relative", width: "100%", height: "100%" }}
        onMouseDown={() => focus(win.id)}
      >
        <div className={`wb-titlebar${active ? "" : " is-inactive"}`}>
          <div
            className="wb-gadget"
            role="button"
            aria-label="Close"
            title="Close"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              close(win.id);
            }}
          >
            <CloseGlyph />
          </div>
          <div className="wb-title-text">{win.title}</div>
          <div
            className="wb-gadget is-right"
            role="button"
            aria-label="Minimize"
            title="Minimize"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              minimize(win.id);
            }}
          >
            <MinGlyph />
          </div>
          <div
            className="wb-gadget is-right"
            role="button"
            aria-label="Depth"
            title="Front / Back"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              sendToBack(win.id);
            }}
          >
            <DepthGlyph />
          </div>
        </div>
        <div className="wb-window-body">{children}</div>
      </div>
    </Rnd>
  );
}


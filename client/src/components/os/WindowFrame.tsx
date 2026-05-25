"use client";

import { Rnd } from "react-rnd";
import type { ReactNode } from "react";
import { useWindowStore } from "@/context/windowStore";
import { APP_REGISTRY } from "@/data/appRegistry";
import type { WindowInstance } from "@/types/window";

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
            <MinimizeGlyph />
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

function CloseGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <rect x="2" y="2" width="6" height="6" fill="none" stroke="black" strokeWidth="1" />
      <rect x="4" y="4" width="2" height="2" fill="black" />
    </svg>
  );
}

function DepthGlyph() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden>
      <rect x="1" y="3" width="7" height="6" fill="white" stroke="black" strokeWidth="1" />
      <rect x="4" y="1" width="7" height="6" fill="white" stroke="black" strokeWidth="1" />
    </svg>
  );
}

function MinimizeGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <rect x="1" y="6" width="8" height="2" fill="black" />
    </svg>
  );
}

"use client";

import { Rnd } from "react-rnd";
import { useEffect, useState, type ReactNode } from "react";
import { useWindowStore } from "@/context/windowStore";
import { APP_REGISTRY } from "@/data/appRegistry";
import type { WindowInstance } from "@/types/window";
import { WinMinGlyph, WinMaxGlyph, WinRestoreGlyph, WinCloseGlyph } from "@/components/os/icons";
import { MENUBAR_H } from "@/lib/windowBounds";
import { emitWinDrag } from "@/lib/winDrag";

type Props = {
  win: WindowInstance;
  children: ReactNode;
};

// Live viewport size, so a maximized window fills the desktop and re-fits on
// resize. Falls back to a sane size for the server render (no `window`).
function useViewport() {
  const [vp, setVp] = useState({ w: 1280, h: 800 });
  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return vp;
}

export function WindowFrame({ win, children }: Props) {
  const focus = useWindowStore((s) => s.focus);
  const close = useWindowStore((s) => s.closeWin);
  const minimize = useWindowStore((s) => s.minimize);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const updateBounds = useWindowStore((s) => s.updateBounds);
  const focusedId = useWindowStore((s) => s.focusedId);
  const vp = useViewport();

  const def = APP_REGISTRY[win.appId];
  const active = focusedId === win.id;
  const canMaximize = !def.fixed && !win.noMaximize;

  if (win.minimized) return null;

  // When maximized we paint the desktop-filling rect but leave win.x/y/w/h
  // untouched - those stay as the restore bounds. It fills all the way to the
  // bottom; the dock + taskbar float above it (higher z-index), so no strip is
  // reserved for them.
  const maxRect = {
    x: 0,
    y: MENUBAR_H,
    width: vp.w,
    height: Math.max(def.minHeight ?? 140, vp.h - MENUBAR_H),
  };
  const position = win.maximized ? { x: maxRect.x, y: maxRect.y } : { x: win.x, y: win.y };
  const size = win.maximized
    ? { width: maxRect.width, height: maxRect.height }
    : { width: win.width, height: win.height };

  return (
    <Rnd
      position={position}
      size={size}
      minWidth={def.minWidth ?? 240}
      minHeight={def.minHeight ?? 140}
      dragHandleClassName="wb-titlebar"
      cancel=".wb-winbtn"
      disableDragging={win.maximized}
      enableResizing={!win.maximized && !def.fixed}
      style={{ zIndex: win.z }}
      onDragStart={() => {
        focus(win.id);
        emitWinDrag(win.id, true);
      }}
      onDragStop={(_e, d) => {
        updateBounds(win.id, { x: d.x, y: Math.max(MENUBAR_H, d.y) });
        emitWinDrag(win.id, false);
      }}
      onResizeStart={() => {
        focus(win.id);
        emitWinDrag(win.id, true);
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        emitWinDrag(win.id, false);
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
        <div
          className={`wb-titlebar${active ? "" : " is-inactive"}`}
          onDoubleClick={() => { if (canMaximize) toggleMaximize(win.id); }}
        >
          <div className="wb-title-text">{win.title}</div>
          <div className="wb-winbtns">
            {!def.fixed && <button
              type="button"
              className="wb-winbtn wb-winbtn--min"
              aria-label="Minimize"
              title="Minimize"
              onDoubleClick={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                minimize(win.id);
              }}
            >
              <WinMinGlyph />
            </button>}
            {canMaximize && <button
              type="button"
              className="wb-winbtn wb-winbtn--max"
              aria-label={win.maximized ? "Restore" : "Maximize"}
              title={win.maximized ? "Restore" : "Maximize"}
              onDoubleClick={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                toggleMaximize(win.id);
              }}
            >
              {win.maximized ? <WinRestoreGlyph /> : <WinMaxGlyph />}
            </button>}
            <button
              type="button"
              className="wb-winbtn wb-winbtn--close"
              aria-label="Close"
              title="Close"
              onDoubleClick={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                close(win.id);
              }}
            >
              <WinCloseGlyph />
            </button>
          </div>
        </div>
        <div className="wb-window-body">{children}</div>
      </div>
    </Rnd>
  );
}

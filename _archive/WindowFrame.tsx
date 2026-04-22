"use client";

import { useEffect, useState } from "react";
import { Rnd }               from "react-rnd";
import { useWindowStore }    from "@/context/windowStore";
import { WindowInstance }    from "@/types/window";
import { AppRouter }         from "./AppRouter";
import clsx from "clsx";

const TASKBAR_H = 36;
const MENU_ITEMS = ["File", "Edit", "View", "Help"] as const;

interface Props { win: WindowInstance }

export function WindowFrame({ win }: Props) {
  const { closeWin, focusWin, minimizeWin, maximizeWin, updateWin } =
    useWindowStore();

  // SSR-safe desktop dimensions
  const [desktop, setDesktop] = useState({ w: 1280, h: 768 });
  useEffect(() => {
    function update() {
      setDesktop({
        w: window.innerWidth,
        h: window.innerHeight - TASKBAR_H,
      });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (win.isMinimized) return null;

  const rndProps = win.isMaximized
    ? { x: 0, y: 0, width: desktop.w, height: desktop.h }
    : { x: win.x, y: win.y, width: win.width, height: win.height };

  return (
    <Rnd
      {...rndProps}
      minWidth={win.minWidth  ?? 300}
      minHeight={win.minHeight ?? 200}
      bounds="parent"
      dragHandleClassName="win-drag-handle"
      disableDragging={win.isMaximized}
      enableResizing={!win.isMaximized}
      style={{ zIndex: win.zIndex, pointerEvents: "all", position: "absolute" }}
      onDragStop={(_, d) =>
        updateWin(win.id, { x: d.x, y: d.y })
      }
      onResizeStop={(_, __, ref, ___, pos) =>
        updateWin(win.id, {
          width:  ref.offsetWidth,
          height: ref.offsetHeight,
          x:      pos.x,
          y:      pos.y,
        })
      }
      onMouseDown={() => focusWin(win.id)}
    >
      <div
        className={clsx(
          "window h-full w-full flex flex-col",
          win.isFocused
            ? "shadow-[3px_3px_12px_rgba(0,0,0,0.5)]"
            : "shadow-[2px_2px_8px_rgba(0,0,0,0.35)]"
        )}
        style={{ height: "100%", width: "100%" }}
      >
        {/* ── Title bar ─────────────────────────────────────── */}
        <div
          className={clsx(
            "title-bar win-drag-handle select-none",
            !win.isFocused && "title-bar-inactive"
          )}
        >
          <div className="title-bar-text flex items-center gap-1 min-w-0">
            <span className="shrink-0">{win.icon}</span>
            <span className="truncate">{win.title}</span>
          </div>
          <div className="title-bar-controls flex items-center gap-[2px] shrink-0 ml-1">
            {/* Cosmetic theme buttons matching the screenshot */}
            <button
              title="Light theme"
              style={{ background: "#1a6bb5", color: "#fff", width: 18, height: 16, fontSize: 9, fontWeight: 700, border: "1px solid", borderColor: "#5b9bd5 #0d4a8a #0d4a8a #5b9bd5", cursor: "pointer" }}
            >Lt</button>
            <button
              title="Dark theme"
              style={{ background: "#6a7a8a", color: "#fff", width: 18, height: 16, fontSize: 9, fontWeight: 700, border: "1px solid", borderColor: "#9aafbd #3a4a5a #3a4a5a #9aafbd", cursor: "pointer" }}
            >Dk</button>
            <button aria-label="Minimize" onClick={(e) => { e.stopPropagation(); minimizeWin(win.id); }} />
            <button aria-label="Maximize" onClick={(e) => { e.stopPropagation(); maximizeWin(win.id); }} />
            <button aria-label="Close"    onClick={(e) => { e.stopPropagation(); closeWin(win.id); }} />
          </div>
        </div>

        {/* ── Menu bar ───────────────────────────────────────── */}
        <div className="flex items-center bg-[#d4d0c8] border-b border-[#808080] shrink-0 text-[11px] px-1 py-[1px]">
          {MENU_ITEMS.map((item) => (
            <span
              key={item}
              className="px-2 py-[2px] cursor-pointer hover:bg-[#000080] hover:text-white select-none"
            >
              {item}
            </span>
          ))}
        </div>

        {/* ── App content ────────────────────────────────────── */}
        <div className="window-body flex-1 overflow-hidden m-0 p-0">
          <AppRouter win={win} />
        </div>
      </div>
    </Rnd>
  );
}

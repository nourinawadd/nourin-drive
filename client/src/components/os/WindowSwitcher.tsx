"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowStore } from "@/context/windowStore";
import { APP_ICONS } from "@/data/appIcons";
import type { WindowInstance } from "@/types/window";
import { playSfx } from "@/lib/sfx";

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

function mruOrder(): WindowInstance[] {
  return [...useWindowStore.getState().windows].sort((a, b) => b.z - a.z);
}

export function WindowSwitcher() {
  const [, forceRender] = useState(0);
  const openRef = useRef(false);
  const pickedRef = useRef(0);
  const orderRef = useRef<WindowInstance[]>([]);

  useEffect(() => {
    const paint = () => forceRender((n) => n + 1);

    function close() {
      if (!openRef.current) return;
      openRef.current = false;
      paint();
    }

    function commit() {
      if (!openRef.current) return;
      const win = orderRef.current[pickedRef.current];
      close();
      if (!win) return;
      const { focus, restore } = useWindowStore.getState();
      if (win.minimized) restore(win.id);
      else focus(win.id);
    }

    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target)) return;

      if (e.altKey && (e.key === "`" || e.code === "Backquote")) {
        e.preventDefault();
        if (!openRef.current) {
          const order = mruOrder();
          if (order.length < 2) return;
          orderRef.current = order;
          pickedRef.current = 0;
          openRef.current = true;
        }
        const len = orderRef.current.length;
        pickedRef.current = (pickedRef.current + (e.shiftKey ? -1 : 1) + len) % len;
        playSfx("select");
        paint();
        return;
      }

      if (openRef.current) {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
        }
        return;
      }

      const focusedId = useWindowStore.getState().focusedId;
      if (!focusedId || !e.altKey) return;

      if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        useWindowStore.getState().closeWin(focusedId);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        useWindowStore.getState().minimize(focusedId);
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Alt") commit();
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", close);
    };
  }, []);

  if (!openRef.current) return null;

  return (
    <div className="wb-switcher" role="dialog" aria-modal="true" aria-label="Switch window">
      <div className="wb-switcher-panel">
        {orderRef.current.map((w, i) => {
          const Icon = APP_ICONS[w.appId];
          return (
            <div
              key={w.id}
              className={`wb-switcher-tile${i === pickedRef.current ? " is-picked" : ""}`}
            >
              <div className="wb-switcher-icon">
                <Icon />
              </div>
              <div className="wb-switcher-label">{w.title}</div>
              {w.minimized && <div className="wb-switcher-min">minimised</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

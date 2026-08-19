"use client";

import { useEffect, useRef } from "react";

const SEQUENCE = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
];

type Props = { onTrigger?: () => void };

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

export function KonamiListener({ onTrigger }: Props) {
  const posRef = useRef(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target)) {
        posRef.current = 0;
        return;
      }
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const expected = SEQUENCE[posRef.current];
      if (key === expected) {
        posRef.current += 1;
        if (posRef.current === SEQUENCE.length) {
          posRef.current = 0;
          if (onTrigger) onTrigger();
          else console.log("[konami] easter egg unlocked");
        }
      } else {
        posRef.current = key === SEQUENCE[0] ? 1 : 0;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTrigger]);

  return null;
}

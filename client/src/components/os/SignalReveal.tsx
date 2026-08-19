"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/context/playerStore";
import { useSfxStore } from "@/context/sfxStore";
import { playTick, setSfxEnabled } from "@/lib/sfx";

export const SIGNAL_CODE = "x7fnq4v";

const HOST_TEXT = "nourin.is-a.dev/";
const CODE_TEXT = SIGNAL_CODE;
const FULL_TEXT = `${HOST_TEXT}${CODE_TEXT}`;

const DEAD_AIR_MS = 350;
const FADE_MS = 1100;
const HOLD_MS = 700;
const TYPE_MS = 55;
const LEAVE_MS = 600;

type Phase = "dead" | "fade" | "hold" | "type" | "live" | "leave";

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Props = { open: boolean; onClose: () => void };

export function SignalReveal({ open, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("dead");
  const [typed, setTyped] = useState(0);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const audible = useRef(false);

  useEffect(() => {
    if (!open) return;

    const prevSfx = useSfxStore.getState().enabled;
    const prevMusic = usePlayerStore.getState().playing;
    audible.current = prevSfx;
    setSfxEnabled(false);
    if (prevMusic) usePlayerStore.getState().toggle();

    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reducedMotion()) {
      setTyped(FULL_TEXT.length);
      setPhase("live");
    } else {
      setTyped(0);
      setPhase("dead");
      timers.push(setTimeout(() => setPhase("fade"), DEAD_AIR_MS));
      timers.push(setTimeout(() => setPhase("hold"), DEAD_AIR_MS + FADE_MS));
      timers.push(setTimeout(() => setPhase("type"), DEAD_AIR_MS + FADE_MS + HOLD_MS));
    }

    return () => {
      timers.forEach(clearTimeout);
      setSfxEnabled(prevSfx);
      if (prevMusic && !usePlayerStore.getState().playing) usePlayerStore.getState().toggle();
    };
  }, [open]);

  useEffect(() => {
    if (phase !== "type") return;
    if (typed >= FULL_TEXT.length) {
      setPhase("live");
      return;
    }
    const t = setTimeout(() => {
      if (audible.current) playTick();
      setTyped((n) => n + 1);
    }, TYPE_MS);
    return () => clearTimeout(t);
  }, [phase, typed]);

  useEffect(() => {
    if (phase !== "leave") return;
    const t = setTimeout(() => closeRef.current(), LEAVE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const dismiss = useCallback(() => {
    setPhase((p) => (p === "live" ? "leave" : p));
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      dismiss();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, dismiss]);

  if (!open) return null;

  const showText = phase === "type" || phase === "live" || phase === "leave";
  const host = FULL_TEXT.slice(0, Math.min(typed, HOST_TEXT.length));
  const code = typed > HOST_TEXT.length ? FULL_TEXT.slice(HOST_TEXT.length, typed) : "";

  const classes = [
    "wb-signal",
    phase === "dead" ? "" : "is-lit",
    phase === "leave" ? "is-leaving" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{ ["--wb-signal-fade" as string]: `${FADE_MS}ms` } as React.CSSProperties}
      onMouseDown={dismiss}
      role="presentation"
    >
      <div className="wb-signal-scan" aria-hidden />
      {showText && (
        <p className="wb-signal-line">
          <span className="wb-signal-host">{host}</span>
          <span className="wb-signal-code">{code}</span>
          {phase !== "leave" && <span className="wb-signal-cursor" aria-hidden />}
        </p>
      )}
    </div>
  );
}

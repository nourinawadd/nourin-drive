"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SAVER_SCENES } from "@/components/os/savers";
import { readColors } from "@/components/os/savers/types";

const FADE_MS = 800;
const LEAVE_MS = 250;
const GRACE_MS = 400;
const MOVE_SLOP = 4;
const MAX_DT = 0.05;
const MAX_DPR = 2;

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Props = { open: boolean; saverId: string; onWake: () => void };

export function Screensaver({ open, saverId, onWake }: Props) {
  const [lit, setLit] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const armedAt = useRef(0);
  const anchor = useRef<{ x: number; y: number } | null>(null);
  const wakeRef = useRef(onWake);
  wakeRef.current = onWake;

  useEffect(() => {
    if (!open) {
      setLit(false);
      setLeaving(false);
      return;
    }
    armedAt.current = Date.now();
    anchor.current = null;
    const t = window.setTimeout(() => setLit(true), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const factory = SAVER_SCENES[saverId];
    if (!canvas || !factory) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scene = factory(ctx, readColors());
    const still = reducedMotion();

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.resize(width, height);
      if (still) scene.frame(0);
    };

    size();
    window.addEventListener("resize", size);

    if (still) return () => window.removeEventListener("resize", size);

    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      raf = window.requestAnimationFrame(tick);
      const dt = Math.min((now - prev) / 1000, MAX_DT);
      prev = now;
      if (document.hidden) return;
      scene.frame(dt);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, [open, saverId]);

  const dismiss = useCallback(() => {
    if (Date.now() - armedAt.current < GRACE_MS) return;
    setLeaving(true);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => wakeRef.current(), LEAVE_MS);
    return () => window.clearTimeout(t);
  }, [leaving]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dismiss();
    };
    const onMove = (e: PointerEvent) => {
      const start = anchor.current;
      if (!start) {
        anchor.current = { x: e.clientX, y: e.clientY };
        return;
      }
      if (Math.abs(e.clientX - start.x) > MOVE_SLOP || Math.abs(e.clientY - start.y) > MOVE_SLOP) {
        dismiss();
      }
    };
    const onPoke = () => dismiss();

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerdown", onPoke, true);
    window.addEventListener("wheel", onPoke, { capture: true, passive: true });
    window.addEventListener("touchstart", onPoke, { capture: true, passive: true });

    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerdown", onPoke, true);
      window.removeEventListener("wheel", onPoke, true);
      window.removeEventListener("touchstart", onPoke, true);
    };
  }, [open, dismiss]);

  if (!open) return null;

  const classes = ["wb-saver", lit ? "is-lit" : "", leaving ? "is-leaving" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{ ["--wb-saver-fade" as string]: `${FADE_MS}ms` } as React.CSSProperties}
      role="presentation"
    >
      <canvas ref={canvasRef} className="wb-saver-canvas" aria-hidden />
    </div>
  );
}

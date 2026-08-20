"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefsStore } from "@/context/prefsStore";
import { useWindowStore } from "@/context/windowStore";
import { PET_OFF, rollPet, type PetId } from "@/data/pets";
import { playSfx } from "@/lib/sfx";
import { WIN_DRAG_EVENT, type WinDragDetail } from "@/lib/winDrag";
import { makeBrain, type Brain } from "./brain";
import { SPRITE_SIZE, type Pose } from "./poses";
import { PetSprite } from "./sprites";
import { buildSurfaces, readDockRect } from "./surfaces";

const MAX_DT = 0.05;
const HALF = SPRITE_SIZE / 2;
const DRAG_SLOP = 5;

type View = { pose: Pose; frame: number; facing: 1 | -1 };

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PixelPet({ enabled }: { enabled: boolean }) {
  const pinned = usePrefsStore((s) => s.pet);
  const delay = usePrefsStore((s) => s.petDelay);
  const hydrated = usePrefsStore((s) => s.hydrated);
  const [pet, setPet] = useState<PetId | null>(null);
  const revealed = useRef(false);

  useEffect(() => {
    if (!enabled || !hydrated) return;
    if (pinned === PET_OFF) {
      setPet(null);
      return;
    }
    if (revealed.current) {
      setPet(rollPet(pinned));
      return;
    }
    const t = window.setTimeout(() => {
      revealed.current = true;
      setPet(rollPet(pinned));
    }, delay * 1000);
    return () => window.clearTimeout(t);
  }, [enabled, hydrated, pinned, delay]);

  if (!pet) return null;
  return <PetStage pet={pet} />;
}

function PetStage({ pet }: { pet: PetId }) {
  const spriteRef = useRef<HTMLDivElement>(null);
  const brainRef = useRef<Brain | null>(null);
  const dragging = useRef<string | null>(null);
  const grabStart = useRef<{ x: number; y: number } | null>(null);
  const grabbed = useRef(false);

  const [view, setView] = useState<View>({ pose: "enter", frame: 0, facing: 1 });

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const fromLeft = Math.random() < 0.5;

    const brain = makeBrain({
      x: fromLeft ? -HALF : vw + HALF,
      facing: fromLeft ? 1 : -1,
      vw,
      vh,
    });
    brainRef.current = brain;

    const onWinDrag = (e: Event) => {
      const detail = (e as CustomEvent<WinDragDetail>).detail;
      if (!detail) return;
      dragging.current = detail.active ? detail.id : null;
    };
    const onCleanup = () => {
      const dock = readDockRect();
      if (dock) brainRef.current?.callHome((dock.left + dock.right) / 2);
    };

    window.addEventListener(WIN_DRAG_EVENT, onWinDrag);
    window.addEventListener("wb:cleanup-icons", onCleanup);

    const place = (x: number, y: number) => {
      const node = spriteRef.current;
      if (node) {
        node.style.transform = `translate3d(${Math.round(x - HALF)}px, ${Math.round(y - SPRITE_SIZE)}px, 0)`;
      }
    };

    if (reducedMotion()) {
      place(vw * 0.5, vh);
      setView({ pose: "sit", frame: 0, facing: 1 });
      return () => {
        window.removeEventListener(WIN_DRAG_EVENT, onWinDrag);
        window.removeEventListener("wb:cleanup-icons", onCleanup);
      };
    }

    let raf = 0;
    let prev = performance.now();
    let last: View = { pose: "enter", frame: 0, facing: fromLeft ? 1 : -1 };

    const tick = (now: number) => {
      raf = window.requestAnimationFrame(tick);
      const dt = Math.min((now - prev) / 1000, MAX_DT);
      prev = now;
      if (document.hidden) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const surfaces = buildSurfaces({
        windows: useWindowStore.getState().windows,
        vw: width,
        vh: height,
        dock: readDockRect(),
        dragging: dragging.current,
      });

      const next = brain.step(dt, surfaces, width, height);
      place(next.x, next.y);

      if (next.pose !== last.pose || next.frame !== last.frame || next.facing !== last.facing) {
        last = { pose: next.pose, frame: next.frame, facing: next.facing };
        setView(last);
      }
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener(WIN_DRAG_EVENT, onWinDrag);
      window.removeEventListener("wb:cleanup-icons", onCleanup);
    };
  }, [pet]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    grabStart.current = { x: e.clientX, y: e.clientY };
    grabbed.current = false;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const start = grabStart.current;
    if (!start) return;

    if (!grabbed.current) {
      const far =
        Math.abs(e.clientX - start.x) > DRAG_SLOP || Math.abs(e.clientY - start.y) > DRAG_SLOP;
      if (!far) return;
      grabbed.current = true;
      playSfx("select");
      brainRef.current?.grab(e.clientX, e.clientY + HALF);
      return;
    }

    brainRef.current?.moveTo(e.clientX, e.clientY + HALF);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (grabbed.current) brainRef.current?.release();
    else {
      brainRef.current?.poke();
      playSfx("select");
    }
    grabStart.current = null;
    grabbed.current = false;
  }

  return (
    <div className="wb-pet-layer" aria-hidden>
      <div
        ref={spriteRef}
        className="wb-pet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <PetSprite pet={pet} pose={view.pose} frame={view.frame} facing={view.facing} />
      </div>
    </div>
  );
}

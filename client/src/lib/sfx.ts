export const SFX_NAMES = [
  "boot",
  "open",
  "close",
  "minimize",
  "restore",
  "launch",
  "select",
  "menu",
  "error",
] as const;

export type SfxName = (typeof SFX_NAMES)[number];

const MAX_VOICES = 4;
const DEDUPE_MS = 60;
const STALE_MS = 700;

type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ready: Promise<void> | null = null;
let voices = 0;
let enabled = true;
let volume = 0.3;

const buffers = new Map<SfxName, AudioBuffer>();
const lastFired = new Map<SfxName, number>();

function contextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  if (typeof AudioContext !== "undefined") return AudioContext;
  return (window as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext ?? null;
}

function applyGain(): void {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(enabled ? volume : 0, ctx.currentTime, 0.01);
}

async function load(name: SfxName, context: AudioContext): Promise<void> {
  const res = await fetch(`/sfx/${name}.wav`);
  if (!res.ok) throw new Error(`sfx: ${name}.wav responded ${res.status}`);
  buffers.set(name, await context.decodeAudioData(await res.arrayBuffer()));
}

export function unlockSfx(): void {
  if (ready) {
    void ctx?.resume();
    return;
  }
  const Ctor = contextCtor();
  if (!Ctor) return;

  const context = new Ctor();
  const gain = context.createGain();
  gain.gain.value = enabled ? volume : 0;
  gain.connect(context.destination);

  ctx = context;
  master = gain;
  ready = context
    .resume()
    .catch(() => undefined)
    .then(() => Promise.allSettled(SFX_NAMES.map((name) => load(name, context))))
    .then(() => undefined);
}

export function setSfxEnabled(next: boolean): void {
  enabled = next;
  applyGain();
}

export function setSfxVolume(next: number): void {
  volume = Math.min(1, Math.max(0, next));
  applyGain();
}

function fire(name: SfxName, queuedAt: number): void {
  if (!ctx || !master || !enabled) return;
  if (ctx.state !== "running") return;
  if (Date.now() - queuedAt > STALE_MS) return;
  if (voices >= MAX_VOICES) return;

  const buffer = buffers.get(name);
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(master);
  voices++;
  source.onended = () => {
    voices--;
    source.disconnect();
  };
  source.start();
}

export function playSfx(name: SfxName): void {
  if (!enabled || !ready) return;

  const now = Date.now();
  if (now - (lastFired.get(name) ?? 0) < DEDUPE_MS) return;
  lastFired.set(name, now);

  void ready.then(() => fire(name, now));
}

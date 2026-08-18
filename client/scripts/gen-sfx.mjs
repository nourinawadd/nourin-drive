import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, "..", "public", "sfx");

const RATE = 11025;
const BITS = 8;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rng = mulberry32(1);

const WAVES = {
  sine: (p) => Math.sin(2 * Math.PI * p),
  square: (p) => (p % 1 < 0.5 ? 1 : -1),
  saw: (p) => 2 * (p % 1) - 1,
  triangle: (p) => 4 * Math.abs((p % 1) - 0.5) - 1,
};

const buffer = (seconds) => new Float32Array(Math.round(seconds * RATE));

function envelope(t, dur, attack, curve) {
  const rise = attack <= 0 ? 1 : Math.min(1, t / attack);
  const fall = clamp((t - attack) / Math.max(1e-6, dur - attack), 0, 1);
  return rise * Math.pow(1 - fall, curve);
}

function tone({ dur, from, to = from, wave = "square", attack = 0.004, curve = 3 }) {
  const out = buffer(dur);
  const shape = WAVES[wave];
  const ratio = to / from;
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    phase += (from * Math.pow(ratio, t / dur)) / RATE;
    out[i] = shape(phase) * envelope(t, dur, attack, curve);
  }
  return out;
}

function noise({ dur, cutoff = 0.35, attack = 0.002, curve = 3 }) {
  const out = buffer(dur);
  let low = 0;
  for (let i = 0; i < out.length; i++) {
    low += cutoff * (rng() * 2 - 1 - low);
    out[i] = low * envelope(i / RATE, dur, attack, curve);
  }
  return out;
}

function mix(dst, src, at = 0, gain = 1) {
  const start = Math.round(at * RATE);
  for (let i = 0; i < src.length; i++) {
    const j = start + i;
    if (j >= dst.length) break;
    dst[j] += src[i] * gain;
  }
  return dst;
}

function encode(samples, peak) {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  const scale = max > 0 ? peak / max : 0;
  const pcm = Buffer.alloc(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const dither = (rng() + rng() - 1) / 256;
    const v = clamp(samples[i] * scale + dither, -1, 1);
    pcm[i] = clamp(Math.round(v * 127) + 128, 0, 255);
  }
  return pcm;
}

function wav(pcm) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * (BITS / 8), 28);
  header.writeUInt16LE(BITS / 8, 32);
  header.writeUInt16LE(BITS, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

const SOUNDS = {
  boot: {
    seed: 11,
    peak: 0.9,
    render() {
      const out = buffer(0.95);
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const at = i * 0.075;
        mix(out, tone({ dur: 0.3, from: f, wave: "triangle", curve: 2.2, attack: 0.006 }), at, 0.5);
        mix(out, tone({ dur: 0.24, from: f * 2.005, wave: "sine", curve: 3 }), at, 0.16);
      });
      mix(out, tone({ dur: 0.6, from: 1046.5, wave: "triangle", curve: 2.4, attack: 0.008 }), 0.31, 0.42);
      mix(out, noise({ dur: 0.05, cutoff: 0.5, curve: 4 }), 0, 0.1);
      return out;
    },
  },
  open: {
    seed: 22,
    peak: 0.7,
    render() {
      const out = buffer(0.12);
      mix(out, tone({ dur: 0.09, from: 430, to: 940, curve: 2.6 }), 0.006, 0.55);
      mix(out, noise({ dur: 0.02, cutoff: 0.6, curve: 5 }), 0, 0.22);
      return out;
    },
  },
  close: {
    seed: 33,
    peak: 0.7,
    render() {
      const out = buffer(0.12);
      mix(out, tone({ dur: 0.085, from: 900, to: 360, curve: 2.4 }), 0.004, 0.55);
      mix(out, noise({ dur: 0.018, cutoff: 0.55, curve: 5 }), 0, 0.18);
      return out;
    },
  },
  minimize: {
    seed: 44,
    peak: 0.62,
    render() {
      const out = buffer(0.17);
      mix(out, tone({ dur: 0.14, from: 760, to: 190, wave: "triangle", curve: 2 }), 0, 0.6);
      return out;
    },
  },
  restore: {
    seed: 55,
    peak: 0.62,
    render() {
      const out = buffer(0.17);
      mix(out, tone({ dur: 0.14, from: 190, to: 760, wave: "triangle", curve: 2 }), 0, 0.6);
      return out;
    },
  },
  launch: {
    seed: 66,
    peak: 0.8,
    render() {
      const out = buffer(0.28);
      mix(out, noise({ dur: 0.09, cutoff: 0.22, curve: 2.2 }), 0, 0.5);
      mix(out, noise({ dur: 0.07, cutoff: 0.3, curve: 2.6 }), 0.105, 0.32);
      mix(out, tone({ dur: 0.17, from: 96, to: 62, wave: "sine", curve: 2.6, attack: 0.006 }), 0.02, 0.7);
      return out;
    },
  },
  select: {
    seed: 77,
    peak: 0.4,
    render() {
      const out = buffer(0.05);
      mix(out, tone({ dur: 0.03, from: 1500, to: 1250, curve: 4, attack: 0.001 }), 0, 0.4);
      return out;
    },
  },
  menu: {
    seed: 88,
    peak: 0.48,
    render() {
      const out = buffer(0.07);
      mix(out, tone({ dur: 0.045, from: 1050, to: 1400, curve: 3.4, attack: 0.0015 }), 0, 0.45);
      return out;
    },
  },
  error: {
    seed: 99,
    peak: 0.85,
    render() {
      const out = buffer(0.44);
      for (const [at, f] of [
        [0, 233.08],
        [0.17, 174.61],
      ]) {
        mix(out, tone({ dur: 0.145, from: f, curve: 1.4 }), at, 0.5);
        mix(out, tone({ dur: 0.145, from: f * 1.5, curve: 1.6 }), at, 0.2);
      }
      return out;
    },
  },
};

export function generate() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  let bytes = 0;

  for (const [name, spec] of Object.entries(SOUNDS)) {
    rng = mulberry32(spec.seed);
    const file = wav(encode(spec.render(), spec.peak));
    const path = join(OUT_DIR, `${name}.wav`);
    bytes += file.length;

    const prev = existsSync(path) ? readFileSync(path) : null;
    if (prev && prev.equals(file)) continue;

    writeFileSync(path, file);
    written++;
  }

  if (written) {
    console.log(
      `[gen-sfx] wrote ${written} of ${Object.keys(SOUNDS).length} sound(s) to public/sfx/` +
        ` (${(bytes / 1024).toFixed(1)} KB total)`,
    );
  }
  return written;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) generate();

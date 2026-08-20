import type { SaverFactory } from "./types";

const LAT = 8;
const LON = 16;
const TILT = -0.3;
const SPIN = 2.6;
const GRID = 34;

export const boing: SaverFactory = (ctx, colors) => {
  const cosT = Math.cos(TILT);
  const sinT = Math.sin(TILT);

  let w = 0;
  let h = 0;
  let radius = 0;
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let gravity = 0;
  let spin = 0;

  function backdrop() {
    ctx.fillStyle = colors["--wb-black"];
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = colors["--wb-purple-d"];
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 0; gx <= w; gx += GRID) {
      ctx.moveTo(gx + 0.5, 0);
      ctx.lineTo(gx + 0.5, h);
    }
    for (let gy = 0; gy <= h; gy += GRID) {
      ctx.moveTo(0, gy + 0.5);
      ctx.lineTo(w, gy + 0.5);
    }
    ctx.stroke();
  }

  function shadow() {
    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = colors["--wb-black"];
    ctx.beginPath();
    ctx.ellipse(x + radius * 0.55, y + radius * 0.5, radius * 0.98, radius * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function project(theta: number, phi: number) {
    const st = Math.sin(theta);
    const px = st * Math.cos(phi);
    const py = Math.cos(theta);
    const pz = st * Math.sin(phi);
    return {
      sx: x + (px * cosT - py * sinT) * radius,
      sy: y + (px * sinT + py * cosT) * radius,
      z: pz,
    };
  }

  function ball() {
    for (let i = 0; i < LAT; i++) {
      const t0 = (Math.PI * i) / LAT;
      const t1 = (Math.PI * (i + 1)) / LAT;
      for (let j = 0; j < LON; j++) {
        const p0 = (Math.PI * 2 * j) / LON + spin;
        const p1 = (Math.PI * 2 * (j + 1)) / LON + spin;

        const a = project(t0, p0);
        const b = project(t0, p1);
        const c = project(t1, p1);
        const d = project(t1, p0);
        if ((a.z + b.z + c.z + d.z) / 4 <= 0) continue;

        const fill = (i + j) % 2 === 0 ? colors["--wb-red"] : colors["--wb-white"];
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.lineTo(c.sx, c.sy);
        ctx.lineTo(d.sx, d.sy);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.strokeStyle = fill;
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  function resize(nextW: number, nextH: number) {
    const first = w === 0;
    w = nextW;
    h = nextH;
    radius = Math.max(28, Math.min(nextW, nextH) * 0.16);
    gravity = nextH * 1.9;
    vx = nextW * 0.24 * (vx < 0 ? -1 : 1);
    if (first) {
      x = radius * 1.5;
      y = radius;
      vy = 0;
    }
    x = Math.min(Math.max(x, radius), nextW - radius);
    y = Math.min(Math.max(y, radius), nextH - radius);
  }

  function frame(dt: number) {
    const floor = h - radius;
    const maxVy = Math.sqrt(2 * gravity * Math.max(1, floor - radius));

    x += vx * dt;
    if (x <= radius) {
      x = radius;
      vx = Math.abs(vx);
    } else if (x >= w - radius) {
      x = w - radius;
      vx = -Math.abs(vx);
    }

    vy += gravity * dt;
    y += vy * dt;
    if (y >= floor) {
      y = floor;
      vy = -Math.min(Math.abs(vy), maxVy);
    } else if (y <= radius) {
      y = radius;
      vy = Math.abs(vy);
    }

    spin += SPIN * dt * (vx < 0 ? -1 : 1);

    backdrop();
    shadow();
    ball();
  }

  return { resize, frame };
};

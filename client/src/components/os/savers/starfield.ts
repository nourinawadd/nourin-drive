import type { SaverFactory } from "./types";

const SPREAD = 1200;
const NEAR = 14;
const BASE_SPEED = 430;
const MAX_STARS = 600;

type Star = { x: number; y: number; z: number; tint: string };

export const starfield: SaverFactory = (ctx, colors) => {
  const tints = [
    colors["--wb-white"],
    colors["--wb-white"],
    colors["--wb-white"],
    colors["--wb-gray-0"],
    colors["--wb-orange"],
    colors["--wb-teal"],
  ];

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let k = 0;
  let elapsed = 0;
  let stars: Star[] = [];

  function spawn(star: Star, depth: number) {
    star.x = (Math.random() * 2 - 1) * SPREAD;
    star.y = (Math.random() * 2 - 1) * SPREAD;
    star.z = depth;
    star.tint = tints[Math.floor(Math.random() * tints.length)];
  }

  function resize(nextW: number, nextH: number) {
    w = nextW;
    h = nextH;
    cx = nextW / 2;
    cy = nextH / 2;
    k = Math.min(nextW, nextH) * 0.9;

    const want = Math.max(120, Math.min(MAX_STARS, Math.round((nextW * nextH) / 2400)));
    if (stars.length > want) {
      stars = stars.slice(0, want);
      return;
    }
    while (stars.length < want) {
      const star: Star = { x: 0, y: 0, z: 0, tint: tints[0] };
      spawn(star, NEAR + Math.random() * SPREAD);
      stars.push(star);
    }
  }

  function frame(dt: number) {
    elapsed += dt;
    const speed = BASE_SPEED * (1 + 0.45 * Math.sin(elapsed * 0.32));

    ctx.fillStyle = colors["--wb-black"];
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = "round";

    for (const star of stars) {
      const prevZ = star.z;
      star.z -= speed * dt;
      if (star.z <= NEAR) {
        spawn(star, SPREAD);
        continue;
      }

      const sx = cx + (star.x / star.z) * k;
      const sy = cy + (star.y / star.z) * k;
      const margin = Math.max(w, h);
      if (sx < -margin || sx > w + margin || sy < -margin || sy > h + margin) {
        spawn(star, SPREAD);
        continue;
      }

      const px = cx + (star.x / prevZ) * k;
      const py = cy + (star.y / prevZ) * k;
      const near = 1 - star.z / (SPREAD + NEAR);

      ctx.globalAlpha = Math.min(1, 0.2 + near * 1.1);
      ctx.strokeStyle = star.tint;
      ctx.lineWidth = Math.max(0.7, near * 2.4);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  return { resize, frame };
};

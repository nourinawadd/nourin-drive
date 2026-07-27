// Build the profile portrait as a 1-bit dither AT the exact sizes it is
// displayed, so the browser never resamples it.
//
// Why this exists: a dither encodes gray as a pattern of black/white dots, so
// it only reads correctly at 1:1 pixel scale. The source photo is already
// dithered at 612x720. Letting CSS shrink that into the portrait frame breaks
// it either way - averaging gives blur, nearest-neighbour gives moire. So we
// recover continuous tone from the source, resize to the target, and re-dither
// there. One file per device-pixel-ratio, wired up with srcset in Profile.tsx.
//
// Usage: node scripts/portrait.js
// Keep TARGETS in sync with portraitFrame in client/src/components/apps/Profile.tsx.
const path = require("path");
const sharp = require(path.join(__dirname, "../client/node_modules/sharp"));

const DIR = path.join(__dirname, "../client/public/images");
const SRC = path.join(DIR, "portrait-source-612x720.png");

// "gray"  - 8-bit continuous tone. Clean at small sizes; matches how the source
//           reads when zoomed out, because the eye blends its dots into gray.
// "1bit"  - re-dithered black/white. Matches the desktop's pixel-art look, but
//           needs ~200px+ to render a face without reading as noise.
const MODE = process.env.PORTRAIT_MODE === "1bit" ? "1bit" : "gray";

// Frame is 160x188 CSS px.
const TARGETS = [
  { w: 160, h: 188, out: "portrait.png" },      // 1x - exact, zero resampling
  { w: 320, h: 376, out: "portrait@2x.png" },   // 2x - 1:1 on retina
];

// Tones at or beyond these points are forced to solid white / solid black
// before dithering. Without this, the light-gray backdrop and the dark clothing
// both come out as fields of scattered dots - error diffusion has no way to say
// "flat" except by sprinkling. Clipping first means the dither only spends dots
// on the midtones that carry actual detail (face, hijab folds).
const CLIP_HI = 228;
const CLIP_LO = 28;

function levels(buf) {
  const span = CLIP_HI - CLIP_LO;
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i];
    buf[i] = v >= CLIP_HI ? 255 : v <= CLIP_LO ? 0 : ((v - CLIP_LO) / span) * 255;
  }
  return buf;
}

// Floyd-Steinberg. Serpentine scan avoids the directional worm artifacts a
// left-to-right-only pass leaves in flat areas like the hijab.
function dither(buf, W, H) {
  for (let y = 0; y < H; y++) {
    const ltr = y % 2 === 0;
    for (let k = 0; k < W; k++) {
      const x = ltr ? k : W - 1 - k;
      const i = y * W + x;
      const old = buf[i];
      const val = old < 128 ? 0 : 255;
      buf[i] = val;
      const err = old - val;
      const d = ltr ? 1 : -1;
      const put = (dx, dy, f) => {
        const nx = x + dx * d, ny = y + dy;
        if (nx < 0 || nx >= W || ny >= H) return;
        buf[ny * W + nx] += err * f;
      };
      put(1, 0, 7 / 16); put(-1, 1, 3 / 16); put(0, 1, 5 / 16); put(1, 1, 1 / 16);
    }
  }
  return Buffer.from(Uint8Array.from(buf, (v) => (v < 128 ? 0 : 255)));
}

async function main() {
  const { width: srcW } = await sharp(SRC).metadata();

  for (const { w, h, out } of TARGETS) {
    // Just enough low-pass to merge the source dither dots without softening
    // real detail - the downscale kernel does most of the averaging itself.
    const sigma = Math.max(0.3, (srcW / w) * 0.3);
    const img = sharp(SRC)
      .grayscale()
      .blur(sigma)
      .resize(w, h, { fit: "cover", kernel: "lanczos3" })
      .normalise()
      .sharpen({ sigma: 0.7 });

    if (MODE === "gray") {
      // Continuous tone: what the source looks like to the eye when zoomed out,
      // since the dots blend. Clean at any size, no speckle.
      await img.png({ compressionLevel: 9, colours: 256 }).toFile(path.join(DIR, out));
    } else {
      const raw = await img.raw().toBuffer();
      await sharp(dither(levels(Float32Array.from(raw)), w, h), {
        raw: { width: w, height: h, channels: 1 },
      })
        .png({ compressionLevel: 9, palette: true, colours: 2 })
        .toFile(path.join(DIR, out));
    }

    console.log(`${out}  ${w}x${h}  ${MODE}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Static export: nginx serves the whole desktop off disk on the VM. The box
  // is a 956MB Oracle micro instance, so there is no room to run `next start`
  // next to nginx, the api, ttyd and the go ssh server.
  output: "export",

  // The export target has no image optimiser to call at runtime.
  images: { unoptimized: true },

  // Self-hosted HTML5 game builds (Unity / Godot WebGL) in public/games are
  // pre-compressed: the engine ships .br (Brotli) or .gz (Gzip) files and its
  // loader fetches them directly. Static file serving sends the raw compressed
  // bytes WITHOUT telling the browser they're compressed, so the loader chokes
  // ("Unable to parse ….br"). Under `output: "export"` a headers() block here
  // would be silently ignored, so those Content-Encoding rules live in
  // infra/nginx/nourin.is-a.dev.conf instead. Keep the two in step.
};

export default nextConfig;

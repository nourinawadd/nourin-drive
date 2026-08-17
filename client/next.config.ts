import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Self-hosted HTML5 game builds (Unity / Godot WebGL) in public/games are
  // pre-compressed: the engine ships .br (Brotli) or .gz (Gzip) files and its
  // loader fetches them directly. Static file serving sends the raw compressed
  // bytes WITHOUT telling the browser they're compressed, so the loader chokes
  // ("Unable to parse ….br"). Tagging them with the right Content-Encoding makes
  // the browser transparently decompress before the loader sees them.
  //   - Brotli needs a secure context - works on localhost and HTTPS.
  //   - .wasm.br/.gz: we don't set Content-Type: application/wasm, so the engine
  //     falls back from streaming to ArrayBuffer compile (a harmless console
  //     note). Re-export with compression disabled if you want to avoid this.
  async headers() {
    return [
      { source: "/games/:path(.*\\.br)", headers: [{ key: "Content-Encoding", value: "br" }] },
      { source: "/games/:path(.*\\.gz)", headers: [{ key: "Content-Encoding", value: "gzip" }] },
    ];
  },
};

export default nextConfig;

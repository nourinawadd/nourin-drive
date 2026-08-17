import type { Request, Response, NextFunction } from "express";
import { createHash, randomInt } from "node:crypto";

const BOOT_MS = Date.now();

const FORTUNES = [
  "Only Amiga makes it possible.",
  "The right tool is the one already open.",
  "A program is never finished, only abandoned at a good stopping point.",
  "640K ought to be enough for anybody. (allegedly)",
  "Ship the ugly version. The pretty one never ships.",
  "Every bug was, at some point, a very reasonable idea.",
  "Copper lists don't lie.",
  "If it works on the first try, be suspicious.",
  "Save early. Save often. Save before the demo.",
  "The bottleneck is rarely where you're looking.",
  "Delete more code than you write today.",
];

const WORKBENCH_PALETTE = [
  { name: "Workbench grey", hex: "#a0a0a0" },
  { name: "Workbench blue", hex: "#0055aa" },
  { name: "Workbench white", hex: "#ffffff" },
  { name: "Workbench black", hex: "#000000" },
  { name: "Workbench orange", hex: "#ff8800" },
];

/** GET /api/fun/uptime */
export function uptime(_req: Request, res: Response) {
  const ms = Date.now() - BOOT_MS;
  const mem = process.memoryUsage();
  res.json({
    bootedAt: new Date(BOOT_MS).toISOString(),
    uptime: {
      ms,
      human: humanDuration(ms),
      processSeconds: Math.round(process.uptime()),
    },
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    memoryMB: {
      rss: round2(mem.rss / 1024 / 1024),
      heapUsed: round2(mem.heapUsed / 1024 / 1024),
      heapTotal: round2(mem.heapTotal / 1024 / 1024),
    },
  });
}

/** GET /api/fun/whoami */
export function whoami(req: Request, res: Response) {
  res.json({
    ip: req.ip,
    method: req.method,
    protocol: req.protocol,
    host: req.get("host") ?? null,
    userAgent: req.get("user-agent") ?? null,
    language: req.get("accept-language") ?? null,
    referer: req.get("referer") ?? null,
    query: req.query,
    seenAt: new Date().toISOString(),
  });
}

/** ALL /api/fun/echo - httpbin-style mirror of whatever you sent. */
export function echo(req: Request, res: Response) {
  res.json({
    method: req.method,
    path: req.originalUrl,
    headers: req.headers,
    query: req.query,
    body: req.body ?? null,
    bodyType: typeof req.body,
    receivedAt: new Date().toISOString(),
  });
}

/** GET /api/fun/status/:code - returns whatever status you ask for. */
export function status(req: Request, res: Response) {
  const code = Number(req.params.code);
  if (!Number.isInteger(code) || code < 100 || code > 599) {
    return res.status(400).json({ error: "code must be an integer in 100..599" });
  }
  // These statuses are defined to carry no body.
  if (code === 204 || code === 205 || code === 304) return res.sendStatus(code);
  res.status(code).json({ status: code, requested: code, ok: code < 400 });
}

/** GET /api/fun/delay/:ms - sleeps, then answers. Capped at 10s. */
export function delay(req: Request, res: Response) {
  const requested = Number(req.params.ms);
  if (!Number.isFinite(requested) || requested < 0) {
    return res.status(400).json({ error: "ms must be a non-negative number" });
  }
  const ms = Math.min(Math.round(requested), 10_000);
  const t0 = Date.now();
  setTimeout(() => {
    res.json({ requestedMs: requested, sleptMs: Date.now() - t0, capMs: 10_000 });
  }, ms);
}

/** GET /api/fun/dice?d=20&n=2 */
export function dice(req: Request, res: Response) {
  const sides = clampInt(req.query.d, 6, 2, 1000);
  const count = clampInt(req.query.n, 1, 1, 100);
  const rolls = Array.from({ length: count }, () => randomInt(1, sides + 1));
  const total = rolls.reduce((a, b) => a + b, 0);
  res.json({
    notation: `${count}d${sides}`,
    rolls,
    total,
    max: Math.max(...rolls),
    min: Math.min(...rolls),
    natural: sides === 20 && rolls.includes(20) ? "critical hit" : null,
  });
}

/** GET /api/fun/coin?n=3 */
export function coin(req: Request, res: Response) {
  const count = clampInt(req.query.n, 1, 1, 100);
  const flips = Array.from({ length: count }, () =>
    randomInt(2) === 0 ? "heads" : "tails",
  );
  res.json({
    flips,
    heads: flips.filter((f) => f === "heads").length,
    tails: flips.filter((f) => f === "tails").length,
  });
}

/** GET /api/fun/fortune */
export function fortune(_req: Request, res: Response) {
  const index = randomInt(FORTUNES.length);
  res.json({ fortune: FORTUNES[index], index, of: FORTUNES.length });
}

/** GET /api/fun/palette?n=4 */
export function palette(req: Request, res: Response) {
  const count = clampInt(req.query.n, 4, 1, 16);
  const colors = Array.from({ length: count }, () => {
    const value = randomInt(0x1000000);
    const hexValue = `#${hex(value, 6)}`;
    return {
      hex: hexValue,
      rgb: [(value >> 16) & 255, (value >> 8) & 255, value & 255],
      // Amiga OCS stored 12-bit colour: 4 bits per channel.
      ocs12bit: `$${hex(((value >> 20) & 15) * 256 + ((value >> 12) & 15) * 16 + ((value >> 4) & 15), 3)}`,
    };
  });
  res.json({ colors, workbench: WORKBENCH_PALETTE });
}

/** POST /api/fun/hash  { "text": "..." } */
export function hash(req: Request, res: Response, next: NextFunction) {
  try {
    const { text } = req.body ?? {};
    if (typeof text !== "string" || !text) {
      return res.status(400).json({ error: "body must be JSON with a non-empty string `text`" });
    }
    res.json({
      text,
      length: text.length,
      md5: createHash("md5").update(text).digest("hex"),
      sha1: createHash("sha1").update(text).digest("hex"),
      sha256: createHash("sha256").update(text).digest("hex"),
      base64: Buffer.from(text, "utf8").toString("base64"),
      rot13: text.replace(/[a-z]/gi, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      }),
      reversed: [...text].reverse().join(""),
    });
  } catch (err) { next(err); }
}

/* ---------- helpers ---------- */

function clampInt(raw: unknown, fallback: number, min: number, max: number) {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), min), max);
}

function hex(n: number, width: number) {
  return n.toString(16).toUpperCase().padStart(width, "0");
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function humanDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const parts = [
    [Math.floor(s / 86400), "d"],
    [Math.floor(s / 3600) % 24, "h"],
    [Math.floor(s / 60) % 60, "m"],
    [s % 60, "s"],
  ] as const;
  return parts.filter(([v], i) => v > 0 || i === parts.length - 1)
    .map(([v, u]) => `${v}${u}`)
    .join(" ");
}

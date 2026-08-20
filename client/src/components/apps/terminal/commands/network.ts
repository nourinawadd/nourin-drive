import { PRESETS, PRESET_GROUPS, type Preset } from "@/components/apps/api/presets";
import { apiErrorMessage, getGuestbookStats, listGuestbook, postGuestbook } from "@/lib/api";
import type { Command, Ctx } from "../types";
import { pad } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const BODY_CAP = 60;
const ENTRY_CAP = 10;

function formatBody(text: string, contentType: string): string[] {
  let out = text;
  if (contentType.includes("json")) {
    try {
      out = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      out = text;
    }
  }
  const lines = out.split("\n");
  if (lines.length <= BODY_CAP) return lines;
  return [...lines.slice(0, BODY_CAP), `... ${lines.length - BODY_CAP} more lines`];
}

async function request(ctx: Ctx, init: RequestInit & { url: string }): Promise<void> {
  const { url, ...rest } = init;
  const started = performance.now();
  try {
    const res = await fetch(url, rest);
    const ms = Math.round(performance.now() - started);
    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();
    ctx.print(`${res.status} ${res.statusText} in ${ms}ms`, res.ok ? "head" : "err");
    ctx.print(formatBody(text, contentType));
  } catch (err) {
    ctx.print(`could not reach ${url}`, "err");
    ctx.print(err instanceof Error ? err.message : String(err), "err");
  }
}

function simpleGet(name: string, path: string, blurb: string): Command {
  return {
    name,
    group: "network",
    usage: name,
    blurb,
    run: (ctx) => request(ctx, { url: `${API_BASE}${path}` }),
  };
}

export const health = simpleGet("health", "/api/health", "ping the express api behind this site");
export const uptime = simpleGet("uptime", "/api/fun/uptime", "how long the api has been awake");
export const whoami = simpleGet("whoami", "/api/fun/whoami", "what the api sees about you");

export const guestbook: Command = {
  name: "guestbook",
  group: "network",
  usage: 'guestbook [list|stats|sign <name> "<message>"]',
  blurb: "read the guestbook, or sign it for real",
  run: async (ctx) => {
    const sub = (ctx.argv[1] ?? "list").toLowerCase();

    if (sub === "stats") {
      try {
        const stats = await getGuestbookStats();
        ctx.print([
          `${pad("visits", 14)}${stats.visits}`,
          `${pad("signatures", 14)}${stats.signatures}`,
        ]);
      } catch (err) {
        ctx.print(apiErrorMessage(err, "could not read the stats"), "err");
      }
      return;
    }

    if (sub === "sign") {
      const name = ctx.argv[2];
      const message = ctx.argv.slice(3).join(" ");
      if (!name || !message) {
        ctx.print('usage: guestbook sign "your name" "your message"', "err");
        return;
      }
      try {
        const entry = await postGuestbook({ name, message });
        ctx.print(`signed as ${entry.name}${entry.seq ? `, entry ${entry.seq}` : ""}`, "head");
        ctx.print("it is live on the guestbook now", "note");
      } catch (err) {
        ctx.print(apiErrorMessage(err, "could not sign the guestbook"), "err");
      }
      return;
    }

    if (sub !== "list") {
      ctx.print(`guestbook: no such action "${ctx.argv[1]}"`, "err");
      return;
    }

    try {
      const entries = await listGuestbook();
      if (!entries.length) {
        ctx.print("nobody has signed it yet", "note");
        return;
      }
      const recent = entries.slice(0, ENTRY_CAP);
      for (const entry of recent) {
        const when = entry.createdAt.slice(0, 10);
        ctx.print(`${entry.seq ? `#${entry.seq} ` : ""}${entry.name}${entry.emoji ? ` ${entry.emoji}` : ""}  ${when}`, "head");
        ctx.print(`  ${entry.message}`);
        if (entry.reply) ctx.print(`  reply: ${entry.reply}`, "note");
      }
      if (entries.length > recent.length) {
        ctx.print(`${entries.length - recent.length} older entries not shown`, "note");
      }
    } catch (err) {
      ctx.print(apiErrorMessage(err, "could not read the guestbook"), "err");
    }
  },
};

export const curl: Command = {
  name: "curl",
  group: "network",
  usage: 'curl [-X METHOD] [-H "k: v"] [-d body] <url>',
  blurb: "make a real http request from this window",
  run: (ctx) => {
    let method = "GET";
    let body: string | undefined;
    const headers: Record<string, string> = {};
    let url = "";

    const args = ctx.argv.slice(1);
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === "-X" || arg === "--request") {
        method = (args[++i] ?? "GET").toUpperCase();
      } else if (arg === "-d" || arg === "--data") {
        body = args[++i] ?? "";
        if (method === "GET") method = "POST";
      } else if (arg === "-H" || arg === "--header") {
        const raw = args[++i] ?? "";
        const split = raw.indexOf(":");
        if (split > 0) headers[raw.slice(0, split).trim()] = raw.slice(split + 1).trim();
      } else if (!arg.startsWith("-")) {
        url = arg;
      }
    }

    if (!url) {
      ctx.print("curl: give me a url", "err");
      return;
    }
    if (!/^https?:\/\//i.test(url)) url = url.startsWith("/") ? `${API_BASE}${url}` : `https://${url}`;
    if (body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

    return request(ctx, { url, method, headers, body });
  },
};

function runPreset(ctx: Ctx, preset: Preset): Promise<void> {
  const headers = Object.fromEntries((preset.headers ?? []).map((h) => [h.key, h.value]));
  const sendable = preset.method !== "GET" && preset.method !== "DELETE" && preset.body;
  ctx.print(`${preset.method} ${preset.url}`, "note");
  return request(ctx, {
    url: preset.url,
    method: preset.method,
    headers,
    body: sendable ? preset.body : undefined,
  });
}

export const api: Command = {
  name: "api",
  group: "network",
  usage: "api [preset]",
  blurb: "list or run the API Studio presets",
  run: (ctx) => {
    const target = (ctx.argv[1] ?? "").toLowerCase();

    if (!target) {
      for (const group of PRESET_GROUPS) {
        const inGroup = PRESETS.filter((p) => p.group === group);
        if (!inGroup.length) continue;
        ctx.print(group, "head");
        ctx.print(inGroup.map((p) => `  ${pad(p.id, 22)}${pad(p.method, 8)}${p.name}`));
      }
      ctx.print("run one with: api <preset>", "note");
      return;
    }

    const preset = PRESETS.find((p) => p.id.toLowerCase() === target);
    if (!preset) {
      ctx.print(`api: no preset called "${ctx.argv[1]}"`, "err");
      return;
    }
    return runPreset(ctx, preset);
  },
};

export const NETWORK_COMMANDS: Command[] = [health, uptime, whoami, guestbook, curl, api];

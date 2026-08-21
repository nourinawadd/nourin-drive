import { APP_REGISTRY } from "@/data/appRegistry";
import { PALETTES, PATTERNS } from "@/data/prefs";
import { TRACKS, formatDuration, searchTracks, trackById } from "@/data/tracks";
import { usePlayerStore } from "@/context/playerStore";
import { usePrefsStore } from "@/context/prefsStore";
import { useWindowStore } from "@/context/windowStore";
import type { AppId } from "@/types/window";
import type { Command } from "../types";
import { pad } from "../types";
import { last, resolve } from "../vfs";
import { runAction } from "./actions";

const APP_IDS = Object.keys(APP_REGISTRY) as AppId[];

export const HIDDEN_APPS: AppId[] = ["game", "properties", "prefs-palette", "prefs-pattern", "moderation"];

function isAppId(value: string): value is AppId {
  return (APP_IDS as string[]).includes(value);
}

export const apps: Command = {
  name: "apps",
  group: "desktop",
  usage: "apps",
  blurb: "list every app open can launch",
  run: (ctx) => {
    const rows = APP_IDS.filter((id) => !HIDDEN_APPS.includes(id))
      .sort()
      .map((id) => `${pad(id, 16)}${APP_REGISTRY[id].title}`);
    ctx.print(rows);
  },
};

export const open: Command = {
  name: "open",
  group: "desktop",
  usage: "open <app|file>",
  blurb: "launch an app, or open a file where it belongs",
  run: (ctx) => {
    const target = ctx.argv.slice(1).join(" ");
    if (!target) {
      ctx.print("open: name an app or a file, apps lists the apps", "err");
      return;
    }

    const store = useWindowStore.getState();
    const key = target.toLowerCase();

    if (isAppId(key)) {
      store.openApp(key);
      ctx.print(`opened ${APP_REGISTRY[key].title}`, "note");
      return;
    }

    const found = resolve(ctx.chain, target);
    if (found.kind === "missing") {
      ctx.print(`open: no app or file called "${found.segment}"`, "err");
      return;
    }

    if (found.kind === "folder") {
      const folder = last(found.chain);
      const id = store.openApp("explorer");
      store.patchPayload(id, {
        folderId: folder.id,
        expanded: found.chain.map((f) => f.id),
      });
      ctx.print(`opened ${folder.name} in the explorer`, "note");
      return;
    }

    ctx.print(runAction(found.file.action), "note");
  },
};

export const windows: Command = {
  name: "windows",
  group: "desktop",
  usage: "windows",
  blurb: "list the windows on the desktop",
  run: (ctx) => {
    const { windows: open, focusedId } = useWindowStore.getState();
    if (!open.length) {
      ctx.print("no windows open", "note");
      return;
    }
    ctx.print(
      open.map((w) => {
        const state = w.minimized ? "minimized" : w.maximized ? "maximized" : "open";
        const mark = w.id === focusedId ? "*" : " ";
        return `${mark} ${pad(w.id, 16)}${pad(state, 12)}${w.title}`;
      }),
    );
  },
};

export const close: Command = {
  name: "close",
  group: "desktop",
  usage: "close [window-id|app]",
  blurb: "close a window, or this one with no argument",
  run: (ctx) => {
    const store = useWindowStore.getState();
    const target = ctx.argv[1];
    if (!target) {
      store.closeWin(ctx.winId);
      return;
    }
    const key = target.toLowerCase();
    const hits = store.windows.filter((w) => w.id === key || w.appId === key);
    if (!hits.length) {
      ctx.print(`close: no window matching "${target}"`, "err");
      return;
    }
    hits.forEach((w) => store.closeWin(w.id));
    ctx.print(`closed ${hits.length} window${hits.length === 1 ? "" : "s"}`, "note");
  },
};

export const focus: Command = {
  name: "focus",
  group: "desktop",
  usage: "focus <window-id|app>",
  blurb: "bring a window to the front",
  run: (ctx) => {
    const store = useWindowStore.getState();
    const target = (ctx.argv[1] ?? "").toLowerCase();
    const hit = store.windows.find((w) => w.id === target || w.appId === target);
    if (!hit) {
      ctx.print(`focus: no window matching "${ctx.argv[1] ?? ""}"`, "err");
      return;
    }
    store.restore(hit.id);
    ctx.print(`focused ${hit.title}`, "note");
  },
};

export const theme: Command = {
  name: "theme",
  group: "desktop",
  usage: "theme [name]",
  blurb: "list or set the desktop palette",
  run: (ctx) => {
    const prefs = usePrefsStore.getState();
    const target = (ctx.argv[1] ?? "").toLowerCase();
    if (!target) {
      ctx.print(
        PALETTES.map((p) => `${p.id === prefs.palette ? "*" : " "} ${pad(p.id, 12)}${p.label}`),
      );
      return;
    }
    const hit = PALETTES.find((p) => p.id === target || p.label.toLowerCase() === target);
    if (!hit) {
      ctx.print(`theme: no palette called "${ctx.argv[1]}"`, "err");
      return;
    }
    prefs.setPalette(hit.id);
    ctx.print(`palette set to ${hit.label}`, "note");
  },
};

export const pattern: Command = {
  name: "pattern",
  group: "desktop",
  usage: "pattern [name]",
  blurb: "list or set the desktop backdrop",
  run: (ctx) => {
    const prefs = usePrefsStore.getState();
    const target = (ctx.argv[1] ?? "").toLowerCase();
    if (!target) {
      ctx.print(
        PATTERNS.map((p) => `${p.id === prefs.pattern ? "*" : " "} ${pad(p.id, 12)}${p.label}`),
      );
      return;
    }
    const hit = PATTERNS.find((p) => p.id === target || p.label.toLowerCase() === target);
    if (!hit) {
      ctx.print(`pattern: no backdrop called "${ctx.argv[1]}"`, "err");
      return;
    }
    prefs.setPattern(hit.id);
    ctx.print(`backdrop set to ${hit.label}`, "note");
  },
};

function nowPlaying(): string | null {
  const { queue, pointer } = usePlayerStore.getState();
  const id = queue[pointer];
  if (!id) return null;
  const track = trackById(id);
  return track ? `${track.title} - ${track.artist}` : null;
}

export const play: Command = {
  name: "play",
  group: "desktop",
  usage: "play [search]",
  blurb: "play a track, or resume what is loaded",
  run: (ctx) => {
    const player = usePlayerStore.getState();
    const query = ctx.argv.slice(1).join(" ");

    if (!query) {
      if (player.queue.length) {
        if (!player.playing) player.toggle();
        ctx.print(nowPlaying() ?? "playing", "note");
        return;
      }
      if (!TRACKS.length) {
        ctx.print("no music on this drive", "err");
        return;
      }
      player.play(TRACKS[0].id, TRACKS, "the terminal");
      ctx.print(nowPlaying() ?? "playing", "note");
      return;
    }

    const hits = searchTracks(TRACKS, query);
    if (!hits.length) {
      ctx.print(`play: nothing matching "${query}"`, "err");
      return;
    }
    player.play(hits[0].id, hits, `search: ${query}`);
    ctx.print(`playing ${hits[0].title} - ${hits[0].artist}`, "note");
    if (hits.length > 1) ctx.print(`${hits.length - 1} more queued from that search`, "note");
  },
};

export const pause: Command = {
  name: "pause",
  group: "desktop",
  usage: "pause",
  blurb: "pause playback",
  run: (ctx) => {
    const player = usePlayerStore.getState();
    if (!player.queue.length) {
      ctx.print("nothing is loaded", "note");
      return;
    }
    if (player.playing) player.toggle();
    ctx.print("paused", "note");
  },
};

export const skip: Command = {
  name: "next",
  group: "desktop",
  usage: "next",
  blurb: "skip to the next track",
  run: (ctx) => {
    const player = usePlayerStore.getState();
    if (!player.queue.length) {
      ctx.print("nothing is loaded", "note");
      return;
    }
    player.next();
    ctx.print(nowPlaying() ?? "skipped", "note");
  },
};

export const back: Command = {
  name: "prev",
  group: "desktop",
  usage: "prev",
  blurb: "go back a track",
  run: (ctx) => {
    const player = usePlayerStore.getState();
    if (!player.queue.length) {
      ctx.print("nothing is loaded", "note");
      return;
    }
    player.prev();
    ctx.print(nowPlaying() ?? "back", "note");
  },
};

export const np: Command = {
  name: "np",
  group: "desktop",
  usage: "np",
  blurb: "what is playing right now",
  run: (ctx) => {
    const player = usePlayerStore.getState();
    const id = player.queue[player.pointer];
    const track = id ? trackById(id) : undefined;
    if (!track) {
      ctx.print("nothing is loaded", "note");
      return;
    }
    ctx.print(`${track.title} - ${track.artist}`, "head");
    ctx.print([
      `${pad("album", 10)}${track.album ?? "unknown"}`,
      `${pad("from", 10)}${player.source ?? track.playlist}`,
      `${pad("state", 10)}${player.playing ? "playing" : "paused"}`,
      `${pad("at", 10)}${formatDuration(Math.floor(player.time))} of ${formatDuration(track.duration)}`,
      `${pad("volume", 10)}${Math.round(player.volume * 100)}`,
    ]);
  },
};

export const vol: Command = {
  name: "vol",
  group: "desktop",
  usage: "vol [0-100]",
  blurb: "read or set playback volume",
  run: (ctx) => {
    const player = usePlayerStore.getState();
    const raw = ctx.argv[1];
    if (raw === undefined) {
      ctx.print(`volume ${Math.round(player.volume * 100)}`, "note");
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      ctx.print("vol: give me a number from 0 to 100", "err");
      return;
    }
    player.setVolume(value / 100);
    ctx.print(`volume ${Math.round(value)}`, "note");
  },
};

export const DESKTOP_COMMANDS: Command[] = [
  apps, open, windows, close, focus, theme, pattern, play, pause, skip, back, np, vol,
];

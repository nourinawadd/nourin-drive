import type { Command } from "../types";

export const SSH_HOST = "nourin.is-a.dev";
export const SSH_PORT = 2323;

const REACHABLE = [SSH_HOST, "localhost", "127.0.0.1", "nourin"];

export const ssh: Command = {
  name: "ssh",
  group: "session",
  usage: "ssh [user@]host [-p port]",
  blurb: "open the real ssh portfolio in this window",
  run: (ctx) => {
    const args = ctx.argv.slice(1).filter((a) => a !== "-p" && !/^\d+$/.test(a));
    const target = (args[0] ?? SSH_HOST).toLowerCase();
    const host = target.includes("@") ? target.split("@").slice(-1)[0] : target;

    if (!REACHABLE.includes(host)) {
      ctx.print(`ssh: cannot reach ${host}`, "err");
      ctx.print(
        [
          "a browser tab cannot open a raw tcp socket, so this window can only",
          `reach the one host it is proxied to: ${SSH_HOST} on port ${SSH_PORT}.`,
          "",
          `try: ssh ${SSH_HOST}`,
        ],
        "note",
      );
      return;
    }

    ctx.print(`connecting to ${SSH_HOST} port ${SSH_PORT}...`, "note");
    ctx.connect(SSH_HOST);
  },
};

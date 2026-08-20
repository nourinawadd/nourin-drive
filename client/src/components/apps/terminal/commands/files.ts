import { countItems, type FsFolder, type FsNode } from "@/data/fileTree";
import type { Command } from "../types";
import { pad } from "../types";
import { fullPath, last, resolve, sortNodes, walk } from "../vfs";
import { describeAction } from "./actions";

const NAME_MIN = 14;
const NAME_MAX = 38;
const TYPE_W = 18;
const TREE_CAP = 400;
const FIND_CAP = 120;

function nameOf(node: FsNode): string {
  return node.kind === "folder" ? `${node.name}/` : node.name;
}

function listing(nodes: FsNode[]): string[] {
  const widest = nodes.reduce((w, n) => Math.max(w, nameOf(n).length), 0);
  const width = Math.min(NAME_MAX, Math.max(NAME_MIN, widest)) + 2;
  return nodes.map((n) => {
    if (n.kind === "folder") {
      const { files, folders } = countItems(n);
      return `${pad(nameOf(n), width)}${pad("Drawer", TYPE_W)}${folders + files} items`;
    }
    return `${pad(n.name, width)}${pad(n.typeLabel, TYPE_W)}${n.date ?? ""}`;
  });
}

function argPath(ctx: { argv: string[] }): string {
  return ctx.argv.slice(1).filter((a) => !a.startsWith("-")).join(" ");
}

export const ls: Command = {
  name: "ls",
  group: "files",
  usage: "ls [path]",
  blurb: "list what is in a drawer",
  run: (ctx) => {
    const found = resolve(ctx.chain, argPath(ctx));
    if (found.kind === "missing") {
      ctx.print(`ls: no such drawer or file "${found.segment}"`, "err");
      return;
    }
    if (found.kind === "file") {
      ctx.print(listing([found.file]));
      return;
    }
    const folder = last(found.chain);
    const nodes = sortNodes(folder.children);
    if (!nodes.length) {
      ctx.print("drawer is empty", "note");
      return;
    }
    ctx.print(listing(nodes));
    const { files, folders } = countItems(folder);
    ctx.print(`${folders} drawers, ${files} files`, "note");
  },
};

export const cd: Command = {
  name: "cd",
  group: "files",
  usage: "cd [path]",
  blurb: "change drawer, cd .. goes up",
  run: (ctx) => {
    const target = ctx.argv.slice(1).join(" ");
    const found = resolve(ctx.chain, target || "~");
    if (found.kind === "missing") {
      ctx.print(`cd: no such drawer "${found.segment}"`, "err");
      return;
    }
    if (found.kind === "file") {
      ctx.print(`cd: ${found.file.name} is a file, not a drawer`, "err");
      return;
    }
    ctx.setCwd(last(found.chain).id);
  },
};

export const pwd: Command = {
  name: "pwd",
  group: "files",
  usage: "pwd",
  blurb: "print the drawer you are in",
  run: (ctx) => ctx.print(fullPath(ctx.chain)),
};

export const cat: Command = {
  name: "cat",
  group: "files",
  usage: "cat <file>",
  blurb: "read what a file knows about itself",
  run: (ctx) => {
    const target = ctx.argv.slice(1).join(" ");
    if (!target) {
      ctx.print("cat: name a file", "err");
      return;
    }
    const found = resolve(ctx.chain, target);
    if (found.kind === "missing") {
      ctx.print(`cat: no such file "${found.segment}"`, "err");
      return;
    }
    if (found.kind === "folder") {
      ctx.print(`cat: ${last(found.chain).name} is a drawer, try ls`, "err");
      return;
    }
    const f = found.file;
    ctx.print(f.name, "head");
    const meta = [
      `${pad("type", 10)}${f.typeLabel}`,
      `${pad("path", 10)}${f.path.replace(/\\/g, "/")}`,
    ];
    if (f.date) meta.push(`${pad("date", 10)}${f.date}`);
    meta.push(`${pad("opens", 10)}${describeAction(f.action)}`);
    ctx.print(meta);
    if (f.blurb) ctx.print(["", f.blurb]);
  },
};

export const tree: Command = {
  name: "tree",
  group: "files",
  usage: "tree [path]",
  blurb: "draw the drawer and everything under it",
  run: (ctx) => {
    const found = resolve(ctx.chain, argPath(ctx));
    if (found.kind === "missing") {
      ctx.print(`tree: no such drawer "${found.segment}"`, "err");
      return;
    }
    if (found.kind === "file") {
      ctx.print(found.file.name);
      return;
    }
    const root = last(found.chain);
    const out: string[] = [`${root.name}/`];

    const draw = (folder: FsFolder, prefix: string) => {
      const nodes = sortNodes(folder.children);
      nodes.forEach((node, i) => {
        if (out.length >= TREE_CAP) return;
        const tail = i === nodes.length - 1;
        out.push(`${prefix}${tail ? "`-- " : "|-- "}${nameOf(node)}`);
        if (node.kind === "folder") draw(node, `${prefix}${tail ? "    " : "|   "}`);
      });
    };

    draw(root, "");
    ctx.print(out);
    if (out.length >= TREE_CAP) ctx.print(`stopped at ${TREE_CAP} lines`, "note");
  },
};

export const find: Command = {
  name: "find",
  group: "files",
  usage: "find <text>",
  blurb: "search names under the current drawer",
  run: (ctx) => {
    const query = ctx.argv.slice(1).join(" ").toLowerCase();
    if (!query) {
      ctx.print("find: give me something to look for", "err");
      return;
    }
    const hits: string[] = [];
    walk(last(ctx.chain), (node, trail) => {
      if (hits.length >= FIND_CAP) return;
      const haystack = node.kind === "file" ? `${node.name} ${node.base}` : node.name;
      if (haystack.toLowerCase().includes(query)) hits.push(node.kind === "folder" ? `${trail}/` : trail);
    });
    if (!hits.length) {
      ctx.print(`nothing matching "${query}"`, "note");
      return;
    }
    ctx.print(hits);
    ctx.print(`${hits.length} match${hits.length === 1 ? "" : "es"}`, "note");
  },
};

export const FILE_COMMANDS: Command[] = [ls, cd, pwd, cat, tree, find];

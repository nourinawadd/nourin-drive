import { FS_ROOT, pathTo, type FsFile, type FsFolder, type FsNode } from "@/data/fileTree";

export type Chain = FsFolder[];

export const ROOT_CHAIN: Chain = [FS_ROOT];

export const VOLUME = "NOURIN:";

export function chainFor(cwdId: string): Chain {
  return pathTo(cwdId) ?? ROOT_CHAIN;
}

export function last(chain: Chain): FsFolder {
  return chain[chain.length - 1];
}

export function fullPath(chain: Chain): string {
  return `${VOLUME}${chain.slice(1).map((f) => f.name).join("/")}`;
}

export function promptFor(chain: Chain): string {
  return `${fullPath(chain)}>`;
}

export type Resolved =
  | { kind: "folder"; chain: Chain }
  | { kind: "file"; file: FsFile; chain: Chain }
  | { kind: "missing"; segment: string };

const SEP = /[\\/]+/;

function matchFolder(folder: FsFolder, name: string): FsFolder | undefined {
  const want = name.toLowerCase();
  return folder.children.find(
    (c): c is FsFolder => c.kind === "folder" && c.name.toLowerCase() === want,
  );
}

function matchFile(folder: FsFolder, name: string): FsFile | undefined {
  const want = name.toLowerCase();
  return folder.children.find(
    (c): c is FsFile =>
      c.kind === "file" && (c.name.toLowerCase() === want || c.base.toLowerCase() === want),
  );
}

export function resolve(from: Chain, input: string): Resolved {
  const trimmed = input.trim().replace(/^"(.*)"$/, "$1");
  if (!trimmed) return { kind: "folder", chain: from };

  let chain: Chain = from;
  let rest = trimmed;

  const volume = /^(nourin:|~)/i.exec(rest);
  if (volume) {
    chain = ROOT_CHAIN;
    rest = rest.slice(volume[0].length);
  } else if (SEP.test(rest.charAt(0))) {
    chain = ROOT_CHAIN;
  }

  const segments = rest.split(SEP).filter(Boolean);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === ".") continue;
    if (seg === "..") {
      if (chain.length > 1) chain = chain.slice(0, -1);
      continue;
    }
    const here = last(chain);
    const folder = matchFolder(here, seg);
    if (folder) {
      chain = [...chain, folder];
      continue;
    }
    const file = matchFile(here, seg);
    if (file && i === segments.length - 1) return { kind: "file", file, chain };
    return { kind: "missing", segment: seg };
  }

  return { kind: "folder", chain };
}

export function sortNodes(nodes: FsNode[]): FsNode[] {
  return [
    ...nodes.filter((n): n is FsFolder => n.kind === "folder"),
    ...nodes.filter((n): n is FsFile => n.kind === "file"),
  ];
}

export function walk(folder: FsFolder, visit: (node: FsNode, trail: string) => void, trail = ""): void {
  for (const node of sortNodes(folder.children)) {
    const here = trail ? `${trail}/${node.name}` : node.name;
    visit(node, here);
    if (node.kind === "folder") walk(node, visit, here);
  }
}

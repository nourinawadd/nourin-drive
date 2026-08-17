// Virtual filesystem backing the Explorer.
//
// Nothing here is hand-maintained - the tree is derived from PROJECTS and
// PHOTOS at module load, so it grows as you add content. Photos already nest
// for real (public/gallery/<Category>/...), and projects get grouped into year
// sub-folders so the tree has somewhere to go past depth 2.
//
// Files carry a retro-plausible extension per category. Only photos have a
// genuine one (parsed from their path); the rest are synthetic but consistent,
// which is what makes the list read like a real filesystem.

import { CATEGORIES, PROJECTS, type Project, type ProjectCategory } from "./projects";
import { PHOTOS } from "./gallery";
import { LIBRARY, formatLabel, type LibraryDoc } from "./library";
import { POSTS, postFileName, type BlogPostMeta } from "./blog";
import type { IconCategory } from "@/components/os/icons";

export type FsFile = {
  kind: "file";
  id: string;
  name: string;          // "suhoor-rush.exe"
  base: string;          // "suhoor-rush"
  ext: string;           // "exe"
  typeLabel: string;     // "Application"
  path: string;          // "My Portfolio\\Games\\2025"
  date?: string;
  blurb?: string;
  iconCat: IconCategory;
  /** What double-click / Open does. Resolved by the Explorer, not here. */
  action: FileAction;
};

export type FsFolder = {
  kind: "folder";
  id: string;
  name: string;
  path: string;
  children: FsNode[];
};

export type FsNode = FsFile | FsFolder;

// The tree is pure data so it can be built outside React. Opening a file needs
// the window store, which only exists in a component, so intent is described
// here and performed by the Explorer.
export type FileAction =
  | { type: "browser"; url: string }
  | { type: "game"; projectId: string; name: string; url?: string }
  | { type: "gallery"; photoId: string }
  | { type: "ereader"; docId: string }
  | { type: "blog"; slug: string }
  | { type: "app"; appId: "blog" | "apis" }
  | { type: "external"; url: string }
  | { type: "none" };

const EXT_BY_CATEGORY: Record<ProjectCategory, { ext: string; label: string }> = {
  websites: { ext: "url",  label: "Internet Shortcut" },
  apis:     { ext: "json", label: "JSON File" },
  games:    { ext: "exe",  label: "Application" },
  designs:  { ext: "bmp",  label: "Bitmap Image" },
  photos:   { ext: "jpg",  label: "JPEG Image" },
  blog:     { ext: "txt",  label: "Text Document" },
};

const IMAGE_TYPE_LABELS: Record<string, string> = {
  jpg: "JPEG Image", jpeg: "JPEG Image", png: "PNG Image",
  gif: "GIF Image", webp: "WebP Image", avif: "AVIF Image", svg: "SVG Image",
};

export function joinPath(parent: string, name: string): string {
  return parent ? `${parent}\\${name}` : name;
}

/** Lowercase kebab, so generated names look like real files on disk. */
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled";
}

/** Year from a "YYYY-MM" date, or null when the item is undated. */
function yearOf(date?: string): string | null {
  const y = date?.slice(0, 4);
  return y && /^\d{4}$/.test(y) ? y : null;
}

function actionForProject(p: Project): FileAction {
  switch (p.category) {
    case "websites": return p.url ? { type: "browser", url: p.url } : { type: "none" };
    case "games":    return { type: "game", projectId: p.id, name: p.name, url: p.url };
    case "blog":     return { type: "app", appId: "blog" };
    case "apis":     return { type: "app", appId: "apis" };
    case "designs":
    case "photos":   return p.url ? { type: "external", url: p.url } : { type: "none" };
    default:         return { type: "none" };
  }
}

function projectFile(p: Project, path: string): FsFile {
  const { ext, label } = EXT_BY_CATEGORY[p.category];
  const base = slug(p.id || p.name);
  return {
    kind: "file",
    id: `p:${p.id}`,
    name: `${base}.${ext}`,
    base,
    ext,
    typeLabel: label,
    path,
    date: p.date,
    blurb: p.blurb,
    iconCat: p.category,
    action: actionForProject(p),
  };
}

function photoFile(
  photo: { id: string; title: string; src: string; date?: string },
  path: string,
): FsFile {
  const fileName = photo.src.split("/").pop() ?? photo.title;
  const dot = fileName.lastIndexOf(".");
  const ext = dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "jpg";
  const base = slug(photo.title);
  return {
    kind: "file",
    id: `g:${photo.id}`,
    name: `${base}.${ext}`,
    base,
    ext,
    typeLabel: IMAGE_TYPE_LABELS[ext] ?? `${ext.toUpperCase()} File`,
    path,
    date: photo.date,
    iconCat: "photos",
    action: { type: "gallery", photoId: photo.id },
  };
}

/**
 * Library documents keep their real filename and extension - unlike the
 * synthetic ones above, these are actual files sitting in public/library/, and
 * pretending otherwise would break the download the Ereader offers.
 */
function libraryFile(doc: LibraryDoc, path: string): FsFile {
  const dot = doc.fileName.lastIndexOf(".");
  const base = dot > 0 ? doc.fileName.slice(0, dot) : doc.fileName;
  const ext = dot > 0 ? doc.fileName.slice(dot + 1).toLowerCase() : doc.format;
  return {
    kind: "file",
    id: `lib:${doc.id}`,
    name: doc.fileName,
    base,
    ext,
    typeLabel: formatLabel(doc.format),
    path,
    date: doc.date,
    blurb: doc.blurb ?? (doc.author ? `by ${doc.author}` : undefined),
    iconCat: doc.format === "pdf" ? "pdf" : "document",
    action: { type: "ereader", docId: doc.id },
  };
}

function postFile(post: BlogPostMeta, path: string): FsFile {
  return {
    kind: "file",
    id: `post:${post.slug}`,
    name: postFileName(post.slug),
    base: post.slug,
    ext: "html",
    typeLabel: "HTML Document",
    path,
    date: post.date,
    blurb: post.summary || `${post.minutes} min read`,
    iconCat: "blog",
    action: { type: "blog", slug: post.slug },
  };
}

const byNameAsc = (a: FsNode, b: FsNode) => a.name.localeCompare(b.name);
// Newest first, undated last - matches how the old flat list was ordered.
const byDateDesc = (a: FsFile, b: FsFile) => (b.date ?? "").localeCompare(a.date ?? "");

/**
 * Group a category's files into year sub-folders - but only when there is more
 * than one year to show. A single "2025" folder wrapping everything is just an
 * extra click, so in that case the files sit directly in the category.
 */
function withYearFolders(files: FsFile[], parentPath: string, idPrefix: string): FsNode[] {
  const years = new Set(files.map((f) => yearOf(f.date)).filter(Boolean) as string[]);
  if (years.size < 2) return [...files].sort(byDateDesc);

  const dated = new Map<string, FsFile[]>();
  const undated: FsFile[] = [];
  for (const f of files) {
    const y = yearOf(f.date);
    if (!y) { undated.push(f); continue; }
    const bucket = dated.get(y);
    if (bucket) bucket.push(f);
    else dated.set(y, [f]);
  }

  const folders: FsNode[] = [...dated.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, items]): FsFolder => {
      const path = joinPath(parentPath, year);
      return {
        kind: "folder",
        id: `${idPrefix}:${year}`,
        name: year,
        path,
        // Re-home the files so Properties reports the year folder, not the
        // category it was grouped from.
        children: items.map((f) => ({ ...f, path })).sort(byDateDesc),
      };
    });

  return [...folders, ...undated.sort(byDateDesc)];
}

const ROOT_NAME = "My Portfolio";

function build(): FsFolder {
  const rootPath = ROOT_NAME;

  // Project categories. "designs"/"photos" are excluded here because the real
  // image volumes below replace those placeholders (same rule the old Explorer
  // sidebar used).
  const projectFolders = CATEGORIES
    .filter((c) => c.id !== "designs" && c.id !== "photos" && c.id !== "blog")
    .map((c): FsFolder => {
      const path = joinPath(rootPath, c.label);
      const files = PROJECTS
        .filter((p) => p.category === c.id)
        .map((p) => projectFile(p, path));
      return {
        kind: "folder",
        id: `cat:${c.id}`,
        name: c.label,
        path,
        children: withYearFolders(files, path, `cat:${c.id}`),
      };
    })
    .filter((f) => f.children.length > 0);

  // Image volumes, nested by their real gallery sub-folder.
  const photoCategories = Array.from(new Set(PHOTOS.map((p) => p.category))).sort();
  const photoFolders = photoCategories.map((cat): FsFolder => {
    const path = joinPath(rootPath, cat);
    return {
      kind: "folder",
      id: `gal:${cat}`,
      name: cat,
      path,
      children: PHOTOS
        .filter((p) => p.category === cat)
        .map((p) => photoFile(p, path))
        .sort(byNameAsc),
    };
  });

  // Reading library - one folder per shelf, derived the same way the photo
  // volumes are. These are real files on disk, and double-clicking one opens
  // the Ereader.
  const shelves = Array.from(new Set(LIBRARY.map((d) => d.shelf)));
  const libraryFolders = shelves.map((shelf): FsFolder => {
    const path = joinPath(rootPath, shelf);
    return {
      kind: "folder",
      id: `lib:${shelf}`,
      name: shelf,
      path,
      children: LIBRARY
        .filter((d) => d.shelf === shelf)
        .map((d) => libraryFile(d, path))
        .sort(byNameAsc),
    };
  });

  const blogPath = joinPath(rootPath, "Blog");
  const blogFolder: FsFolder = {
    kind: "folder",
    id: "blog:posts",
    name: "Blog",
    path: blogPath,
    children: withYearFolders(POSTS.map((p) => postFile(p, blogPath)), blogPath, "blog:posts"),
  };

  const blogFolders = blogFolder.children.length > 0 ? [blogFolder] : [];

  return {
    kind: "folder",
    id: "root",
    name: ROOT_NAME,
    path: rootPath,
    children: [...projectFolders, ...blogFolders, ...photoFolders, ...libraryFolders],
  };
}

export const FS_ROOT: FsFolder = build();

/** Depth-first lookup by folder id. */
export function findFolder(id: string, node: FsFolder = FS_ROOT): FsFolder | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    if (child.kind !== "folder") continue;
    const hit = findFolder(id, child);
    if (hit) return hit;
  }
  return null;
}

/** Chain of folders from the root down to `id`, inclusive. */
export function pathTo(id: string, node: FsFolder = FS_ROOT): FsFolder[] | null {
  if (node.id === id) return [node];
  for (const child of node.children) {
    if (child.kind !== "folder") continue;
    const rest = pathTo(id, child);
    if (rest) return [node, ...rest];
  }
  return null;
}

export function countItems(folder: FsFolder): { files: number; folders: number } {
  let files = 0;
  let folders = 0;
  for (const c of folder.children) {
    if (c.kind === "folder") folders++;
    else files++;
  }
  return { files, folders };
}

// Reading library for the Ereader app — poems, longer writing, and the
// open-source books worth keeping around.
//
// You don't edit this list by hand. Drop files into client/public/library/ and
// the list is generated automatically (see scripts/gen-library.mjs, which runs
// on `npm run dev` / `npm run build`, or run `npm run library` to refresh
// without restarting). `npm run add:doc` walks you through it interactively.
//
// Shelf = the subfolder name. Metadata comes from frontmatter for .md, from the
// filename for .txt, and from "Author - Title.pdf" for PDFs.

import { GENERATED_LIBRARY } from "./library.generated";

export type DocFormat = "pdf" | "md" | "txt";

export type LibraryDoc = {
  id: string;        // "poems/on-leaving" — stable, used in share links
  shelf: string;     // "Poems" | "Writings" | "Books" | any folder you make
  title: string;
  author?: string;   // absent means it's yours
  date?: string;     // "YYYY" or "YYYY-MM"
  blurb?: string;
  note?: string;     // free line for edition / provenance, shown if present
  format: DocFormat;
  src: string;       // "/library/Poems/on leaving.md" (URL-encoded)
  fileName: string;  // original name, used for the download filename
  bytes: number;
  cover?: string;    // "/library/Books/….cover.png"; PDFs fall back to page 1
  body?: string;     // md/txt inlined at build time; absent = fetch `src`
};

export const LIBRARY: LibraryDoc[] = GENERATED_LIBRARY;

/** Shelves in the order the generator emitted them (yours before other people's). */
export const SHELVES: string[] = Array.from(new Set(LIBRARY.map((d) => d.shelf)));

export function docById(id: string): LibraryDoc | undefined {
  return LIBRARY.find((d) => d.id === id);
}

/**
 * Poems are read as a whole, not paged — a fourteen-line poem split across a
 * two-page spread reads as broken. Everything else paginates, apart from
 * pieces so short that a "page" would be mostly empty.
 */
const SHORT_FORM_CHARS = 900;

export function isShortForm(doc: LibraryDoc): boolean {
  if (doc.format === "pdf") return false;
  if (doc.shelf.toLowerCase() === "poems") return true;
  return (doc.body?.length ?? doc.bytes) < SHORT_FORM_CHARS;
}

/** Case-insensitive match across title, author, shelf and blurb. */
export function searchDocs(docs: LibraryDoc[], query: string): LibraryDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return docs;
  return docs.filter((d) =>
    [d.title, d.author, d.shelf, d.blurb, d.note]
      .filter(Boolean)
      .some((field) => (field as string).toLowerCase().includes(q)),
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FORMAT_LABELS: Record<DocFormat, string> = {
  pdf: "PDF Document",
  md: "Markdown Document",
  txt: "Text Document",
};

export function formatLabel(format: DocFormat): string {
  return FORMAT_LABELS[format];
}

"use client";

import { LIBRARY, SHELVES, formatBytes, formatLabel, type LibraryDoc } from "@/data/library";
import { DocCover } from "./DocCover";
import { downloadDoc } from "./actions";

export const ALL_SHELVES = "Everything";

/* ── category chips ─────────────────────────────────────────────────────── */

export function ShelfChips({
  shelf, onSelect, counts,
}: {
  shelf: string;
  onSelect: (s: string) => void;
  counts: Map<string, number>;
}) {
  const options = [ALL_SHELVES, ...SHELVES];
  return (
    <div style={chipRow}>
      {options.map((name) => {
        const active = name === shelf;
        const count = name === ALL_SHELVES ? LIBRARY.length : counts.get(name) ?? 0;
        return (
          <button
            key={name}
            onClick={() => onSelect(name)}
            style={{ ...chip, ...(active ? chipActive : null) }}
          >
            {name}
            <span style={{ marginLeft: 6, opacity: 0.65 }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── one card ───────────────────────────────────────────────────────────── */

export function DocCard({
  doc, onRead, onShare,
}: {
  doc: LibraryDoc;
  onRead: (doc: LibraryDoc) => void;
  onShare: (doc: LibraryDoc) => void;
}) {
  return (
    <div style={card}>
      <div style={{ display: "flex", gap: 10, padding: 8, minWidth: 0 }}>
        <button onClick={() => onRead(doc)} style={coverButton} title={`Read ${doc.title}`}>
          <DocCover doc={doc} width={84} />
        </button>

        <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={cardTitle} title={doc.title}>{doc.title}</div>
          <div style={cardMeta}>
            {doc.author ? `by ${doc.author}` : "Nourin Awad"}
            {doc.date ? ` · ${doc.date}` : ""}
          </div>
          <div style={cardMeta}>
            {doc.shelf} · {formatLabel(doc.format)} · {formatBytes(doc.bytes)}
          </div>
          {doc.blurb && <div style={cardBlurb}>{doc.blurb}</div>}
          {doc.note && <div style={{ ...cardMeta, fontStyle: "italic" }}>{doc.note}</div>}

          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            <button onClick={() => downloadDoc({ kind: "library", doc })} style={miniButton} title="Download the original file">
              Download
            </button>
            <button onClick={() => onShare(doc)} style={miniButton} title="Copy a link to this document">
              Share
            </button>
          </div>
        </div>
      </div>

      <button onClick={() => onRead(doc)} style={readButton}>
        Read
      </button>
    </div>
  );
}

/* ── the grid ───────────────────────────────────────────────────────────── */

export function DocGrid({
  docs, onRead, onShare, empty,
}: {
  docs: LibraryDoc[];
  onRead: (doc: LibraryDoc) => void;
  onShare: (doc: LibraryDoc) => void;
  empty: string;
}) {
  if (!docs.length) return <div style={emptyNote}>{empty}</div>;
  return (
    <div style={grid}>
      {docs.map((doc) => (
        <DocCard key={doc.id} doc={doc} onRead={onRead} onShare={onShare} />
      ))}
    </div>
  );
}

/* ── home: newest first, then a row per shelf ───────────────────────────── */

export function HomeView({
  onRead, onShare, onOpenShelf,
}: {
  onRead: (doc: LibraryDoc) => void;
  onShare: (doc: LibraryDoc) => void;
  onOpenShelf: (shelf: string) => void;
}) {
  if (!LIBRARY.length) return <EmptyLibrary />;

  // The generator already orders each shelf newest-first; this just interleaves
  // them so the landing row isn't all one shelf.
  const recent = [...LIBRARY]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <section>
        <h2 style={sectionHeading}>Recently added</h2>
        <DocGrid docs={recent} onRead={onRead} onShare={onShare} empty="" />
      </section>

      {SHELVES.map((shelf) => {
        const docs = LIBRARY.filter((d) => d.shelf === shelf).slice(0, 4);
        if (!docs.length) return null;
        return (
          <section key={shelf}>
            <h2 style={sectionHeading}>
              {shelf}
              <button onClick={() => onOpenShelf(shelf)} style={seeAll}>see all</button>
            </h2>
            <DocGrid docs={docs} onRead={onRead} onShare={onShare} empty="" />
          </section>
        );
      })}
    </div>
  );
}

/* ── shelves: the collections picker ────────────────────────────────────── */

export function ShelvesView({
  counts, onOpenShelf,
}: {
  counts: Map<string, number>;
  onOpenShelf: (shelf: string) => void;
}) {
  if (!LIBRARY.length) return <EmptyLibrary />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <h2 style={sectionHeading}>Collections</h2>
      {SHELVES.map((shelf) => {
        const docs = LIBRARY.filter((d) => d.shelf === shelf);
        return (
          <button key={shelf} onClick={() => onOpenShelf(shelf)} style={shelfRow}>
            <div style={{ display: "flex", gap: 3 }}>
              {docs.slice(0, 3).map((d) => (
                <DocCover key={d.id} doc={d} width={34} />
              ))}
            </div>
            <div style={{ minWidth: 0, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: "bold" }}>{shelf}</div>
              <div style={cardMeta}>
                {counts.get(shelf) ?? 0} item{(counts.get(shelf) ?? 0) === 1 ? "" : "s"}
                {" · "}
                {SHELF_BLURBS[shelf] ?? "Collection"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const SHELF_BLURBS: Record<string, string> = {
  Poems: "short pieces, read in one sitting",
  Writings: "essays, notes and longer prose",
  Books: "open-licence editions worth keeping",
};

/* ── info: the colophon ─────────────────────────────────────────────────── */

export function InfoView() {
  return (
    <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 style={sectionHeading}>About this library</h2>
      <p style={infoPara}>
        A reading room for things worth re-reading: poems and prose I wrote, and
        books I didn&apos;t.
      </p>
      <p style={infoPara}>
        Everything on the <strong>Books</strong> shelf is someone else&apos;s work —
        freely available editions of published titles, kept here to read rather
        than to claim. Authorship is on every card. The <strong>Poems</strong> and{" "}
        <strong>Writings</strong> shelves are mine.
      </p>
      <p style={infoPara}>
        PDFs render page by page; Markdown and plain text are typeset into
        columns. Short pieces scroll as one piece instead — a poem cut across a
        spread stops being a poem. Every document can be downloaded in its
        original format or shared as a direct link.
      </p>
      <p style={{ ...infoPara, opacity: 0.7 }}>
        {LIBRARY.length} document{LIBRARY.length === 1 ? "" : "s"} across{" "}
        {SHELVES.length} shelf{SHELVES.length === 1 ? "" : "s"}.
      </p>
    </div>
  );
}

function EmptyLibrary() {
  return (
    <div style={emptyNote}>
      <div style={{ marginBottom: 6, fontWeight: "bold" }}>The library is empty.</div>
      Drop a .pdf, .md or .txt into <code>client/public/library/Poems/</code>{" "}
      (or Writings/, Books/) and run <code>npm run library</code>.
      <br />
      <code>npm run add:doc</code> walks you through it.
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────────────────────── */

const chipRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  marginBottom: 10,
};
const chip: React.CSSProperties = {
  padding: "2px 10px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const chipActive: React.CSSProperties = {
  background: "var(--wb-orange)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-3), inset -1px -1px 0 var(--wb-white)",
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))",
  gap: 8,
  alignContent: "start",
};
const card: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
};
const coverButton: React.CSSProperties = {
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  lineHeight: 0,
  flexShrink: 0,
};
const cardTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: "bold",
  lineHeight: 1.2,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};
const cardMeta: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.75,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const cardBlurb: React.CSSProperties = {
  fontSize: 11,
  marginTop: 3,
  lineHeight: 1.3,
  opacity: 0.9,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};
const miniButton: React.CSSProperties = {
  padding: "1px 7px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 11,
  color: "var(--wb-black)",
  cursor: "pointer",
};
const readButton: React.CSSProperties = {
  padding: "3px 0",
  background: "var(--wb-orange)",
  border: "none",
  borderTop: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-yellow), inset -1px -1px 0 var(--wb-orange-d)",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  fontWeight: "bold",
  color: "var(--wb-black)",
  cursor: "pointer",
};
const sectionHeading: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  margin: "0 0 6px",
  fontSize: 13,
  fontWeight: "bold",
};
const seeAll: React.CSSProperties = {
  padding: 0,
  border: "none",
  background: "transparent",
  fontFamily: "var(--wb-font)",
  fontSize: 11,
  color: "var(--wb-black)",
  opacity: 0.7,
  textDecoration: "underline",
  cursor: "pointer",
};
const shelfRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 6,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  color: "var(--wb-black)",
  cursor: "pointer",
};
const emptyNote: React.CSSProperties = {
  padding: 16,
  fontSize: 12,
  lineHeight: 1.6,
  opacity: 0.75,
};
const infoPara: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.55,
};

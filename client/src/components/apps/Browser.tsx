"use client";

import { useEffect, useRef, useState } from "react";

const HOME = "https://en.wikipedia.org/wiki/Amiga";

// Some sites refuse to embed (X-Frame-Options / frame-ancestors CSP).
// We can't detect those reliably from JS, so we race the iframe's onLoad
// against a timer and assume blocked if onLoad never fires.
const LOAD_TIMEOUT_MS = 2000;

type Bookmark = { label: string; url: string; group: "pinned" | "dev" };

const BOOKMARKS: Bookmark[] = [
  { label: "Github",          url: "https://github.com/nourinawadd",            group: "pinned" },
  { label: "LinkedIn",        url: "https://linkedin.com/in/nourinawad",        group: "pinned" },
  { label: "Instagram",       url: "https://instagram.com/diarydump.jpg",       group: "pinned" },
  { label: "Wikipedia",       url: "https://en.wikipedia.org/wiki/Amiga",       group: "dev" },
  { label: "PointerPointer",  url: "https://pointerpointer.com",                group: "dev" },
  { label: "Cat Bounce",      url: "https://cat-bounce.com",                    group: "dev" },
  { label: "OMFG Dogs",       url: "https://omfgdogs.com",                      group: "dev" },
  { label: "Corndog",         url: "https://corndog.io",                        group: "dev" },
  { label: "Zoomquilt",       url: "https://zoomquilt.org",                     group: "dev" },
  { label: "Pollock",         url: "https://jacksonpollock.org",                group: "dev" },
  { label: "Christmas?",      url: "https://isitchristmas.com",                 group: "dev" },
  { label: "Hacker Typer",    url: "https://hackertyper.net",                   group: "dev" },
  { label: "CERN '91",        url: "http://info.cern.ch",                       group: "dev" },
  { label: "MF Website",      url: "https://motherfuckingwebsite.com",          group: "dev" },
];

function normalize(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type BrowserPayload = { initialUrl?: string };

export function Browser({ payload }: { payload?: unknown }) {
  const start = (payload as BrowserPayload | undefined)?.initialUrl ?? HOME;
  const [url, setUrl] = useState(start);     // committed URL (drives iframe)
  const [input, setInput] = useState(start); // address-bar contents
  const [status, setStatus] = useState<"loading" | "ok" | "blocked">("loading");
  const timerRef = useRef<number | null>(null);

  function go(target: string) {
    const next = normalize(target);
    if (!next) return;
    setUrl(next);
    setInput(next);
    setStatus("loading");
  }

  useEffect(() => {
    if (status !== "loading") return;
    const t = window.setTimeout(() => setStatus("blocked"), LOAD_TIMEOUT_MS);
    timerRef.current = t;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [url, status]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 4 }}>
      {/* address bar */}
      <div style={{ display: "flex", gap: 4, alignItems: "stretch" }}>
        <ChromeButton onClick={() => go(url)} title="Reload">⟳</ChromeButton>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") go(input); }}
          style={addressStyle}
          spellCheck={false}
        />
        <ChromeButton onClick={() => go(input)} title="Go">Go</ChromeButton>
      </div>

      {/* bookmarks */}
      <div style={bookmarkRow}>
        {BOOKMARKS.map((b) => (
          <button
            key={b.url}
            onClick={() => go(b.url)}
            title={b.url}
            style={{
              ...bookmarkChip,
              background: b.group === "pinned" ? "var(--wb-orange)" : "var(--wb-white)",
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* viewport */}
      <div style={viewportWrap}>
        <iframe
          key={url}
          src={url}
          title="Browser"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer"
          onLoad={() => {
            if (timerRef.current) {
              window.clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            setStatus("ok");
          }}
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid var(--wb-black)",
            background: "var(--wb-white)",
          }}
        />
        {status === "blocked" && <BlockedPanel url={url} />}
        {status === "loading" && <LoadingPanel />}
      </div>
    </div>
  );
}

function ChromeButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} style={chromeBtnStyle}>
      {children}
    </button>
  );
}

function BlockedPanel({ url }: { url: string }) {
  return (
    <div style={overlay}>
      <div style={panel}>
        <strong>This site refused to embed.</strong>
        <p style={{ margin: "8px 0 12px", fontSize: 13 }}>
          Modern sites usually block <code>&lt;iframe&gt;</code> via{" "}
          <code>X-Frame-Options</code> or CSP. Open it in a real tab instead.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={openTabBtn}
        >
          Open in new tab ↗
        </a>
      </div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div style={{ ...overlay, background: "rgba(255,255,255,0.4)" }}>
      <div style={{ ...panel, width: 200 }}>loading…</div>
    </div>
  );
}

const addressStyle: React.CSSProperties = {
  flex: 1,
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  padding: "2px 6px",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  outline: "none",
};

const chromeBtnStyle: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  padding: "0 10px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
  cursor: "pointer",
  color: "var(--wb-black)",
};

const bookmarkRow: React.CSSProperties = {
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
  padding: "2px 0",
  borderBottom: "1px solid var(--wb-black)",
};

const bookmarkChip: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  padding: "1px 6px",
  border: "1px solid var(--wb-black)",
  cursor: "pointer",
  color: "var(--wb-black)",
};

const viewportWrap: React.CSSProperties = {
  flex: 1,
  position: "relative",
  minHeight: 0,
};

const overlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  background: "var(--wb-white)",
  padding: 16,
};

const panel: React.CSSProperties = {
  width: 320,
  background: "var(--wb-white)",
  border: "2px solid var(--wb-black)",
  padding: 14,
  textAlign: "center",
  boxShadow: "4px 4px 0 var(--wb-black)",
};

const openTabBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  background: "var(--wb-orange)",
  border: "1px solid var(--wb-black)",
  color: "var(--wb-black)",
  textDecoration: "none",
  fontSize: 13,
};

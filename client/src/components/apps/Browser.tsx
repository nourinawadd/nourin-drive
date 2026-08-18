"use client";

import { useEffect, useRef, useState } from "react";
import {
  BROWSER_HOME,
  newBrowserTab,
  useWindowStore,
  type BrowserPayload,
  type BrowserTab,
} from "@/context/windowStore";
import { playSfx } from "@/lib/sfx";

const SLOW_LOAD_MS = 10000;

const FRAMING_BLOCKED_HOSTS = [
  "github.com",
  "linkedin.com",
  "instagram.com",
  "facebook.com",
  "x.com",
  "twitter.com",
  "reddit.com",
  "stackoverflow.com",
  "google.com",
  "youtube.com",
  "itch.io",
];

type BlockReason = "framing" | "insecure" | "slow";

function blockReason(url: string): BlockReason | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (typeof window !== "undefined" && window.location.protocol === "https:" && u.protocol === "http:") {
    return "insecure";
  }
  if (u.pathname.startsWith("/embed/")) return null;
  const host = u.hostname.replace(/^www\./, "");
  const blocked = FRAMING_BLOCKED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  return blocked ? "framing" : null;
}

type Bookmark = { label: string; url: string; group: "mine" | "pinned" | "dev" };

const BOOKMARKS: Bookmark[] = [
  { label: "Blog",            url: "https://blog.nourin.is-a.dev",              group: "mine" },
  { label: "Anchor",          url: "https://anchor-iesq.onrender.com",          group: "mine" },
  { label: "Tether Note",     url: "https://tethernote.vercel.app",             group: "mine" },
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
  { label: "MF Website",      url: "https://motherfuckingwebsite.com",          group: "dev" },
];

// Stable fallback so a browser window somehow opened without a normalized
// payload still renders one home tab (openApp normally seeds tabs itself).
const FALLBACK_TAB: BrowserTab = { id: "tab-0", url: BROWSER_HOME };

function normalize(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// Short label for a tab: the hostname, minus a leading www.
function tabLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url || "new tab";
  }
}

export function Browser({ winId, payload }: { winId: string; payload?: unknown }) {
  const patchPayload = useWindowStore((s) => s.patchPayload);
  const closeWin = useWindowStore((s) => s.closeWin);

  // Tabs live in the window's payload (in the store) so external opens can
  // append a tab reactively. Guard against a window created without a payload.
  const p = payload as BrowserPayload | undefined;
  const tabs: BrowserTab[] = p?.tabs?.length ? p.tabs : [FALLBACK_TAB];
  const activeId = p?.activeId ?? tabs[0].id;
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const activeUrl = active.url;

  const [input, setInput] = useState(activeUrl); // address-bar contents

  // Keep the address bar in sync with the active tab's committed URL when you
  // switch tabs or a navigation commits. Typing only changes local `input`
  // (activeUrl unchanged), so it never clobbers mid-edit text.
  useEffect(() => {
    setInput(activeUrl);
  }, [activeId, activeUrl]);

  function setTabs(nextTabs: BrowserTab[], nextActive: string) {
    patchPayload(winId, { tabs: nextTabs, activeId: nextActive });
  }

  // Navigate the active tab (address bar / bookmarks).
  function go(target: string) {
    const next = normalize(target);
    if (!next) return;
    setInput(next);
    setTabs(
      tabs.map((t) => (t.id === active.id ? { ...t, url: next } : t)),
      active.id,
    );
  }

  function addTab() {
    const tab = newBrowserTab(BROWSER_HOME);
    setTabs([...tabs, tab], tab.id);
  }

  function selectTab(id: string) {
    if (id !== activeId) patchPayload(winId, { activeId: id });
  }

  function closeTab(id: string) {
    // Closing the last tab closes the whole browser window.
    if (tabs.length <= 1) {
      closeWin(winId);
      return;
    }
    const idx = tabs.findIndex((t) => t.id === id);
    const nextTabs = tabs.filter((t) => t.id !== id);
    const nextActive =
      id === activeId
        ? (nextTabs[idx] ?? nextTabs[idx - 1] ?? nextTabs[0]).id
        : activeId;
    setTabs(nextTabs, nextActive);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 4 }}>
      {/* tab strip */}
      <div style={tabStrip}>
        {tabs.map((t) => {
          const on = t.id === activeId;
          return (
            <div
              key={t.id}
              onClick={() => selectTab(t.id)}
              title={t.url}
              style={{
                ...tabChip,
                background: on ? "var(--wb-orange)" : "var(--wb-white)",
                fontWeight: on ? "bold" : "normal",
              }}
            >
              <span style={tabText}>{tabLabel(t.url)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
                title="Close tab"
                style={tabClose}
              >
                ✕
              </button>
            </div>
          );
        })}
        <button onClick={addTab} title="New tab" style={newTabBtn}>+</button>
      </div>

      {/* address bar */}
      <div style={{ display: "flex", gap: 4, alignItems: "stretch" }}>
        <ChromeButton onClick={() => go(activeUrl)} title="Reload">⟳</ChromeButton>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") go(input); }}
          style={addressStyle}
          spellCheck={false}
        />
        <ChromeButton onClick={() => go(input)} title="Go">Go</ChromeButton>
        <a
          href={activeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open this page in a real browser tab"
          style={chromeLinkStyle}
        >
          ↗
        </a>
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
              background:
                b.group === "mine"
                  ? "var(--wb-orange)"
                  : b.group === "pinned"
                    ? "var(--wb-gray-0)"
                    : "var(--wb-white)",
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* viewport - every tab stays mounted so switching keeps its page state */}
      <div style={viewportWrap}>
        {tabs.map((t) => (
          <TabFrame
            key={t.id}
            url={t.url}
            active={t.id === activeId}
            onGoHome={() => go(BROWSER_HOME)}
          />
        ))}
      </div>
    </div>
  );
}

// One iframe per tab. Kept mounted (hidden when inactive) so a tab preserves its
// loaded page when you switch away and back. Owns its own load/blocked state.
function TabFrame({
  url,
  active,
  onGoHome,
}: {
  url: string;
  active: boolean;
  onGoHome: () => void;
}) {
  const refused = blockReason(url);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (refused) return;
    setLoaded(false);
    setSlow(false);
    const t = window.setTimeout(() => setSlow(true), SLOW_LOAD_MS);
    timerRef.current = t;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [url, refused]);

  if (refused) {
    return (
      <div style={{ ...frameLayer, display: active ? "block" : "none" }}>
        <BlockedRequester url={url} reason={refused} onGoHome={onGoHome} />
      </div>
    );
  }

  return (
    <div style={{ ...frameLayer, display: active ? "block" : "none" }}>
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
          setLoaded(true);
        }}
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid var(--wb-black)",
          background: "var(--wb-white)",
        }}
      />
      {active && !loaded && slow && <BlockedRequester url={url} reason="slow" onGoHome={onGoHome} />}
      {active && !loaded && !slow && <LoadingPanel />}
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

const REFUSAL_COPY: Record<BlockReason, { line: string; note: string }> = {
  framing: {
    line: "will not open in this window.",
    note: "Some sites only allow themselves to be opened in a window of their own.",
  },
  insecure: {
    line: "will not open in this window.",
    note: "It is served over plain http, and this page is https. Your browser blocks the mix.",
  },
  slow: {
    line: "is taking a long time.",
    note: "It may be refusing to open in a frame, or it may just be slow.",
  },
};

function BlockedRequester({
  url,
  reason,
  onGoHome,
}: {
  url: string;
  reason: BlockReason;
  onGoHome: () => void;
}) {
  const copy = REFUSAL_COPY[reason];

  useEffect(() => playSfx("error"), [url, reason]);

  return (
    <div className="wb-req-overlay" role="alertdialog" aria-label="System Request">
      <div className="wb-req-card">
        <div className="wb-req-title">System Request</div>
        <div className="wb-req-body">
          <p className="wb-req-host">{tabLabel(url)}</p>
          <p>{copy.line}</p>
          <p className="wb-req-note">{copy.note}</p>
          <div className="wb-req-gadgets">
            <a
              className="wb-req-gadget is-primary"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in New Tab
            </a>
            {url !== BROWSER_HOME && (
              <button type="button" className="wb-req-gadget" onClick={onGoHome}>
                Start Page
              </button>
            )}
          </div>
        </div>
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

const tabStrip: React.CSSProperties = {
  display: "flex",
  gap: 3,
  alignItems: "stretch",
  flexWrap: "wrap",
  paddingBottom: 3,
  borderBottom: "1px solid var(--wb-black)",
};

const tabChip: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  maxWidth: 160,
  padding: "1px 4px 1px 8px",
  border: "1px solid var(--wb-black)",
  borderBottom: "none",
  cursor: "pointer",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
};

const tabText: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const tabClose: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 11,
  lineHeight: 1,
  padding: "1px 3px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--wb-black)",
};

const newTabBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 15,
  lineHeight: 1,
  padding: "0 8px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
  cursor: "pointer",
  color: "var(--wb-black)",
};

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

const chromeLinkStyle: React.CSSProperties = {
  ...chromeBtnStyle,
  display: "flex",
  alignItems: "center",
  textDecoration: "none",
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

const frameLayer: React.CSSProperties = {
  position: "absolute",
  inset: 0,
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

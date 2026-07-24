"use client";

import { useEffect, useRef, useState } from "react";
import {
  BROWSER_HOME,
  newBrowserTab,
  useWindowStore,
  type BrowserPayload,
  type BrowserTab,
} from "@/context/windowStore";

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

      {/* viewport — every tab stays mounted so switching keeps its page state */}
      <div style={viewportWrap}>
        {tabs.map((t) => (
          <TabFrame key={t.id} url={t.url} active={t.id === activeId} />
        ))}
      </div>
    </div>
  );
}

// One iframe per tab. Kept mounted (hidden when inactive) so a tab preserves its
// loaded page when you switch away and back. Owns its own load/blocked state.
function TabFrame({ url, active }: { url: string; active: boolean }) {
  const [status, setStatus] = useState<"loading" | "ok" | "blocked">("loading");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setStatus("loading");
    const t = window.setTimeout(() => setStatus("blocked"), LOAD_TIMEOUT_MS);
    timerRef.current = t;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [url]);

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
          setStatus("ok");
        }}
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid var(--wb-black)",
          background: "var(--wb-white)",
        }}
      />
      {active && status === "blocked" && <BlockedPanel url={url} />}
      {active && status === "loading" && <LoadingPanel />}
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

const openTabBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  background: "var(--wb-orange)",
  border: "1px solid var(--wb-black)",
  color: "var(--wb-black)",
  textDecoration: "none",
  fontSize: 13,
};

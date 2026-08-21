"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { useWindowStore } from "@/context/windowStore";
import { useStickyStore } from "@/context/stickyStore";
import { APP_ICONS } from "@/data/appIcons";
import { DockStickies, IconFloppySystem } from "@/components/os/icons";
import { playSfx } from "@/lib/sfx";
import type { AppId } from "@/types/window";

const INTRO = [
  "Everything I make ends up here eventually. The things I build, the things I write, the things I draw, and the things I just want to keep somewhere that belongs to me. If I've made it and I'm willing to show it, it's behind one of these icons.",
  "It's built to look like AmigaOS because I thought it looked cool. I got interested in that era of computing, when machines worked nothing like the Windows desktop the rest of us grew up taking for granted.",
  "Have a poke around.",
];

type Item = { name: string; line: string; appId?: AppId; Icon: ComponentType };

const ITEMS: Item[] = [
  { name: "User Profile", line: "The CV. Education, experience, skills, and everything I've shipped. Export it as a PDF from the sidebar.", appId: "profile", Icon: APP_ICONS.profile },
  { name: "File Explorer", line: "Every project as a folder, with the write-up inside it.", appId: "explorer", Icon: APP_ICONS.explorer },
  { name: "Games", line: "Small games I made, playable right here in the window.", appId: "games", Icon: APP_ICONS.games },
  { name: "Graphic Design", line: "Posters, covers, and illustration work.", appId: "gallery", Icon: APP_ICONS.gallery },
  { name: "Blog", line: "Whatever I've been chewing on lately.", appId: "blog", Icon: APP_ICONS.blog },
  { name: "Ereader", line: "A reading room for my poems and writing, plus books worth keeping.", appId: "ereader", Icon: APP_ICONS.ereader },
  { name: "Browser", line: "A browser, inside a browser. Bookmarks included.", appId: "browser", Icon: APP_ICONS.browser },
  { name: "Prefs", line: "Repaint the desktop. Pick a palette and a backdrop, and it remembers.", appId: "prefs", Icon: APP_ICONS.prefs },
  { name: "API Studio", line: "Fire real HTTP requests at real endpoints and read what comes back.", appId: "apis", Icon: APP_ICONS.apis },
  { name: "Shell", line: "A command line for the desktop. Browse the drive, launch apps, or ssh into the real machine.", appId: "terminal", Icon: APP_ICONS.terminal },
  { name: "Music Player", line: "What I've had on repeat. Keeps playing while you wander off.", appId: "music", Icon: APP_ICONS.music },
  { name: "Guestbook", line: "Sign it. I do read them.", appId: "guestbook", Icon: APP_ICONS.guestbook },
  { name: "Sticky Notes", line: "Scratch paper for the desktop. Double-click for a fresh one.", Icon: DockStickies },
  { name: "Recycle Bin", line: "Nothing important in here. Look anyway.", appId: "recycle", Icon: APP_ICONS.recycle },
];

const GETTING_AROUND = [
  "Double-click a drive on the right to open it. The dock along the bottom does the same for the ones I reach for most.",
  "Drag anything. Windows move by their title bar, icons go wherever you drop them.",
  "Minimise a window and it shrinks to an icon down the left edge. Double-click that to bring it back.",
  "Right-click an icon or a file for Properties.",
  "Right-click the desktop itself for a new sticky, a tidy up and the palettes.",
  "Icons ▸ Clean Up puts every icon back where it started.",
  "The Window menu does the obvious: cascade, minimise all, restore all.",
];

const CREDITS =
  "Modelled on Commodore's AmigaOS 3.1 Workbench. Type is VT323. Every icon on this desktop was drawn by hand, one pixel at a time.";

const NOTICES = [
  "The guestbook keeps what you type in it. Optional analytics only measure page views and major app opens, never guestbook text or form contents.",
  "Sticky notes never leave your browser, and they vanish on refresh.",
  "One tab at a time please!",
];

type TabId = "about" | "inside" | "around" | "credits";

const TABS: { id: TabId; label: string }[] = [
  { id: "about", label: "About" },
  { id: "inside", label: "What's Inside" },
  { id: "around", label: "Getting Around" },
  { id: "credits", label: "Credits" },
];

const HINTS: Record<TabId, string> = {
  about: "About This Site",
  inside: `${ITEMS.length} items · double-click to open`,
  around: "It's a desktop. Treat it like one.",
  credits: "Workbench 3.31",
};

export function AboutSite() {
  const [tab, setTab] = useState<TabId>("about");

  return (
    <div style={shell}>
      <div style={tabRow} role="tablist">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                if (!active) playSfx("menu");
                setTab(t.id);
              }}
              style={{ ...tabBtn, ...(active ? tabBtnActive : null) }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={pane}>
        {tab === "about" && <AboutPage />}
        {tab === "inside" && <InsidePage />}
        {tab === "around" && <AroundPage />}
        {tab === "credits" && <CreditsPage />}
      </div>

      <div style={statusBar}>{HINTS[tab]}</div>
    </div>
  );
}

const SPECS: { label: string; value: string }[] = [
  { label: "Workbench", value: "3.31" },
  { label: "Kickstart", value: "40.68" },
  { label: "Processor", value: "68040" },
  { label: "Chip RAM", value: "2,048 K" },
  { label: "Fast RAM", value: "8,192 K" },
  { label: "Display", value: "PAL HiRes" },
  { label: "Author", value: "Nourin Awad" },
  { label: "Located", value: "Cairo, Egypt" },
];

function AboutPage() {
  return (
    <div style={page}>
      <div style={banner}>
        <div style={bannerIcon}>
          <IconFloppySystem />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={bannerTitle}>This is my homepage.</div>
          <div style={bannerSub}>Nourin Awad · Cairo, Egypt</div>
        </div>
      </div>

      <div style={columns}>
        <div style={proseCol}>
          {INTRO.map((text, i) => (
            <p key={i} style={para}>{text}</p>
          ))}
        </div>

        <div style={specPanel}>
          <div style={specTitle}>SYSTEM</div>
          <div style={specBody}>
            {SPECS.map((s) => (
              <div key={s.label} style={specRow}>
                <span style={specKey}>{s.label}</span>
                <span style={specVal}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={copper} aria-hidden>
        <div style={slogan}>Only Amiga makes it possible.</div>
      </div>
    </div>
  );
}

function InsidePage() {
  const openApp = useWindowStore((s) => s.openApp);
  const addSticky = useStickyStore((s) => s.add);
  const [selected, setSelected] = useState<string | null>(null);

  function open(item: Item) {
    playSfx("launch");
    if (item.appId) openApp(item.appId);
    else addSticky();
  }

  return (
    <div style={grid}>
      {ITEMS.map((item) => {
        const active = selected === item.name;
        return (
          <div
            key={item.name}
            style={cell}
            title={item.line}
            onClick={() => {
              if (!active) playSfx("select");
              setSelected(item.name);
            }}
            onDoubleClick={() => open(item)}
          >
            <div style={tile}>
              <item.Icon />
            </div>
            <div style={{ ...cellLabel, ...(active ? cellLabelActive : null) }}>{item.name}</div>
            <div style={cellLine}>{item.line}</div>
          </div>
        );
      })}
    </div>
  );
}

function AroundPage() {
  return (
    <div style={page}>
      <ul style={ul}>
        {GETTING_AROUND.map((text, i) => (
          <li key={i} style={li}>{text}</li>
        ))}
      </ul>
    </div>
  );
}

function CreditsPage() {
  return (
    <div style={page}>
      <p style={para}>{CREDITS}</p>
      <div style={noticeHead}>Before you go</div>
      <ul style={ul}>
        {NOTICES.map((text, i) => (
          <li key={i} style={li}>{text}</li>
        ))}
      </ul>
    </div>
  );
}

const shell: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  fontFamily: "var(--wb-font)",
  color: "var(--wb-black)",
};
const tabRow: React.CSSProperties = {
  display: "flex",
  gap: 4,
  padding: "2px 2px 0",
  flexWrap: "wrap",
};
const tabBtn: React.CSSProperties = {
  padding: "3px 12px",
  fontFamily: "var(--wb-font)",
  fontSize: 15,
  color: "var(--wb-black)",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  borderBottom: "none",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
  cursor: "pointer",
};
const tabBtnActive: React.CSSProperties = {
  background: "var(--wb-orange)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-orange-d)",
  fontWeight: "bold",
};
const pane: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-2), inset -1px -1px 0 var(--wb-white)",
};
const statusBar: React.CSSProperties = {
  fontSize: 13,
  padding: "2px 6px",
  background: "var(--wb-gray)",
  borderTop: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white)",
};
const page: React.CSSProperties = {
  height: "100%",
  boxSizing: "border-box",
  padding: 12,
  display: "flex",
  flexDirection: "column",
};
const banner: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 8,
  marginBottom: 10,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
};
const bannerIcon: React.CSSProperties = {
  width: 112,
  height: 80,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};
const bannerTitle: React.CSSProperties = { fontSize: 23, fontWeight: "bold" };
const bannerSub: React.CSSProperties = { fontSize: 14, opacity: 0.7 };
const columns: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginBottom: 12,
};
const proseCol: React.CSSProperties = { flex: "1 1 320px", minWidth: 0 };
const specPanel: React.CSSProperties = {
  width: 236,
  flexShrink: 0,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
};
const specTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: "bold",
  letterSpacing: 1,
  background: "var(--wb-black)",
  color: "var(--wb-white)",
  padding: "1px 6px",
};
const specBody: React.CSSProperties = { padding: 6 };
const specRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  fontSize: 14,
  padding: "1px 0",
};
const specKey: React.CSSProperties = { opacity: 0.65 };
const specVal: React.CSSProperties = { fontWeight: "bold" };
const copper: React.CSSProperties = {
  flex: 1,
  minHeight: 72,
  display: "grid",
  placeItems: "center",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-2), inset -1px -1px 0 var(--wb-white)",
  background:
    "repeating-linear-gradient(180deg," +
    "var(--wb-blue-2) 0 3px," +
    "var(--wb-blue) 3px 6px," +
    "var(--wb-blue-3) 6px 9px," +
    "var(--wb-steel) 9px 12px," +
    "var(--wb-gray-3) 12px 14px," +
    "var(--wb-steel) 14px 17px," +
    "var(--wb-blue-3) 17px 20px," +
    "var(--wb-blue) 20px 23px," +
    "var(--wb-blue-2) 23px 28px)",
};
const slogan: React.CSSProperties = {
  padding: "2px 10px",
  fontSize: 15,
  letterSpacing: 1,
  color: "var(--wb-white)",
  background: "var(--wb-black)",
  border: "1px solid var(--wb-white)",
};
const para: React.CSSProperties = { margin: "0 0 8px", fontSize: 15, lineHeight: 1.45 };
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(156px, 1fr))",
  gap: 6,
  padding: 10,
  alignContent: "start",
};
const cell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
  padding: "8px 4px",
  cursor: "pointer",
  userSelect: "none",
};
const tile: React.CSSProperties = {
  width: 72,
  height: 72,
  display: "grid",
  placeItems: "center",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
};
const cellLabel: React.CSSProperties = {
  padding: "0 4px",
  fontSize: 14,
  fontWeight: "bold",
  textAlign: "center",
};
const cellLabelActive: React.CSSProperties = {
  background: "var(--wb-orange)",
  outline: "1px dotted var(--wb-black)",
};
const cellLine: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.3,
  textAlign: "center",
  opacity: 0.75,
};
const ul: React.CSSProperties = { margin: 0, paddingLeft: 18, fontSize: 15, lineHeight: 1.45 };
const li: React.CSSProperties = { marginBottom: 6 };
const noticeHead: React.CSSProperties = {
  marginTop: 12,
  marginBottom: 4,
  fontSize: 13,
  fontWeight: "bold",
  background: "var(--wb-black)",
  color: "var(--wb-white)",
  padding: "1px 6px",
  display: "inline-block",
};

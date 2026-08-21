"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ABOUT, type Entry } from "@/data/about";
import { exportCvPdf } from "@/components/apps/cv/exportPdf";

// NOURIN-NET - a monochrome "social information network" profile screen (styled
// exactly after the NETLINK reference) rendered over the extended CV. The left
// nav switches CV sections; the PROFILE tab is the dashboard (identity + stats +
// featured projects + education). All content comes from @/data/about.

/* ── palette (screen-local monochrome, light mode) ────────────────────── */
const BG = "#f7f6f0";   // paper screen
const FG = "#17170f";   // near-black ink
const DIM = "#6c6b60";  // secondary ink
const LINE = "#26261f"; // structural hairlines
const LINE_HI = "#000000";
const DIV = "#e2e0d7";  // faint row dividers
const MONO = "var(--wb-font)";

/* ── identity (values gathered from the user) ─────────────────────────── */
const NET_NAME = "NOURIN-NET";
const NET_TITLE = `${NET_NAME} [ver. 1.0] - Personal Profile System`;
const USER_ID = "nourinawadd";
const MEMBER_SINCE = "09-2022";
const STATUS = "ONLINE";
const QUOTE = "I build end to end, where engineering meets creativity.";

const IDENTITY: { label: string; value: string }[] = [
  { label: "LOCATION",     value: ABOUT.location },
  { label: "OCCUPATION",   value: ABOUT.title },
  { label: "ORGANIZATION", value: "Mansoura University" },
  { label: "DOMAIN",       value: "Software Engineering" },
];

const STATS: { label: string; value: string }[] = [
  { label: "Projects",   value: String(ABOUT.projects.length) },
  { label: "Games",      value: String(ABOUT.games.length) },
  { label: "Experience", value: String(ABOUT.experience.length) },
  { label: "Certs",      value: String(ABOUT.certifications.length) },
  { label: "Languages",  value: String(ABOUT.languages.length) },
  { label: "GPA",        value: "3.95" },
];

const FEATURED = ABOUT.projects.slice(0, 3);

const SYSTEM_MESSAGE =
  `Welcome to ${NET_NAME}. This profile runs inside a retro desktop environment, ` +
  `explore the other drives for projects, games, music and more. ` +
  `Use EXPORT PDF in the sidebar to download the full CV.`;

/* ── tabs ─────────────────────────────────────────────────────────────── */
type TabId =
  | "profile" | "skills" | "experience" | "education"
  | "projects" | "games" | "activities" | "credentials";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile",     label: "PROFILE" },
  { id: "skills",      label: "SKILLS" },
  { id: "experience",  label: "EXPERIENCE" },
  { id: "education",   label: "EDUCATION" },
  { id: "projects",    label: "PROJECTS" },
  { id: "games",       label: "GAMES" },
  { id: "activities",  label: "ACTIVITIES" },
  { id: "credentials", label: "CREDENTIALS" },
];

const COUNTS: Partial<Record<TabId, number>> = {
  experience:  ABOUT.experience.length,
  education:   ABOUT.education.length,
  projects:    ABOUT.projects.length,
  games:       ABOUT.games.length,
  activities:  ABOUT.extracurriculars.length,
  credentials: ABOUT.certifications.length + ABOUT.languages.length,
};

/* ── clock / uptime ───────────────────────────────────────────────────── */
const p2 = (n: number) => String(n).padStart(2, "0");
function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  const start = useRef(Date.now());
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const date = now ? `${p2(now.getMonth() + 1)}-${p2(now.getDate())}-${String(now.getFullYear()).slice(2)}` : "";
  const time = now ? `${p2(now.getHours())}:${p2(now.getMinutes())}:${p2(now.getSeconds())}` : "";
  const s = now ? Math.floor((now.getTime() - start.current) / 1000) : 0;
  const uptime = `${p2(Math.floor(s / 3600))}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}`;
  return { date, time, uptime };
}

/* ── nav icons (line, currentColor) ───────────────────────────────────── */
function Ico({ children }: { children: ReactNode }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
      {children}
    </svg>
  );
}
const NAV_ICON: Record<TabId, ReactNode> = {
  profile:     <><circle cx="8" cy="5.4" r="2.5" /><path d="M3.6 13.2c0-2.7 2-4 4.4-4s4.4 1.3 4.4 4" /></>,
  skills:      <><path d="M4 13V8.5" /><path d="M8 13V3.5" /><path d="M12 13V10" /></>,
  experience:  <><rect x="2.6" y="5.6" width="10.8" height="7" rx="1" /><path d="M6 5.6V4.4c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v1.2" /><path d="M2.6 8.6h10.8" /></>,
  education:   <><path d="M8 3.2 14.5 6 8 8.8 1.5 6z" /><path d="M4.6 7.2v3.1c0 .9 1.5 1.7 3.4 1.7s3.4-.8 3.4-1.7V7.2" /></>,
  projects:    <><path d="M5.6 5 2.6 8l3 3" /><path d="M10.4 5l3 3-3 3" /></>,
  games:       <><circle cx="8" cy="4.6" r="1.9" /><path d="M8 6.5v4.4" /><path d="M4.6 12.8c0-1.3 1.5-2 3.4-2s3.4.7 3.4 2" /></>,
  activities:  <><path d="M4 2.6v11" /><path d="M4 3.4h7l-1.6 2 1.6 2H4" /></>,
  credentials: <><circle cx="8" cy="6" r="3.1" /><path d="M6 8.6 5 13l3-1.4L11 13l-1-4.4" /></>,
};

/* ═══════════════════════════════════════════════════════════════════════ */
export function Profile() {
  const [tab, setTab] = useState<TabId>("profile");
  const { date, time, uptime } = useClock();
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div style={screen}>
      {/* title strip */}
      <div style={titleStrip}>
        <span style={{ color: FG }}>{NET_TITLE}</span>
        <span style={{ color: DIM }}>{date}&nbsp;&nbsp;{time}</span>
      </div>

      {/* menu bar */}
      <div style={menuBar}>
        {["File", "Edit", "View", "Network", "Message", "Options", "Help"].map((m) => (
          <span key={m} style={menuItem}>{m}</span>
        ))}
      </div>

      {/* work area: sidebar + main */}
      <div style={workArea}>
        <Sidebar tab={tab} setTab={setTab} />
        <div style={mainScroll}>
          <div style={mainHeaderBar}>USER PROFILE {tab !== "profile" && <>· {active.label}</>}</div>
          {tab === "profile" ? <Dashboard setTab={setTab} /> : <SectionView tab={tab} label={active.label} />}
        </div>
      </div>

      {/* system message */}
      <div style={sysMsg}>
        <span style={sysMsgTag}>SYSTEM MESSAGE</span>
        <span style={{ color: DIM }}>{SYSTEM_MESSAGE}</span>
      </div>

      {/* status bar */}
      <div style={statusBar}>
        <span>CONNECTED TO {NET_NAME}</span>
        <span style={{ color: DIM }}>UPTIME: {uptime}</span>
        <span>USERS ONLINE: 1</span>
      </div>
    </div>
  );
}

/* ── sidebar ──────────────────────────────────────────────────────────── */
function Sidebar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  async function onExport() {
    setBusy(true);
    setErr(false);
    try {
      await exportCvPdf();
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={sidebar}>
      <div style={brand}>
        <div style={brandMark}>N</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: "bold", letterSpacing: 1 }}>{NET_NAME}</div>
          <div style={{ fontSize: 13, color: DIM }}>ver. 1.0</div>
        </div>
      </div>

      <div style={navList}>
        {TABS.map((t) => {
          const on = tab === t.id;
          const count = COUNTS[t.id];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{ ...navItem, ...(on ? navItemOn : null) }}
            >
              <span style={{ color: on ? BG : FG, display: "inline-flex" }}><Ico>{NAV_ICON[t.id]}</Ico></span>
              <span style={{ flex: 1 }}>{t.label}</span>
              {count != null && <span style={{ color: on ? BG : DIM, fontSize: 13 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      <div style={navFooter}>
        <button type="button" onClick={onExport} disabled={busy} style={{ ...navItem, ...exportItem, opacity: busy ? 0.6 : 1 }}>
          <span style={{ display: "inline-flex" }}>
            <Ico><path d="M8 3v7" /><path d="M5 7l3 3 3-3" /><path d="M3.5 12.5h9" /></Ico>
          </span>
          <span style={{ flex: 1 }}>{busy ? "BUILDING…" : "EXPORT PDF"}</span>
        </button>
        {err && <div style={{ color: "#a11", fontSize: 13, marginTop: 4 }}>Export failed. Try again.</div>}
      </div>
    </div>
  );
}

/* ── dashboard (PROFILE tab) ──────────────────────────────────────────── */
function Dashboard({ setTab }: { setTab: (t: TabId) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* row 1: user profile + stats */}
      <div style={row}>
        <Panel title="USER PROFILE" style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch" }}>
            <FaceBox />
            <div style={{ flex: 1, minWidth: 170 }}>
              <div style={{ fontSize: 23, fontWeight: "bold", letterSpacing: 1 }}>{ABOUT.name.toUpperCase()}</div>
              <div style={kv}><span style={kKey}>User ID:</span> {USER_ID}</div>
              <div style={kv}><span style={kKey}>Member Since:</span> {MEMBER_SINCE}</div>
              <div style={{ ...kv, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={kKey}>Status:</span> <span style={badge}>{STATUS}</span>
              </div>
              <div style={quoteBox}>&ldquo;{QUOTE}&rdquo;</div>
              <div style={{ marginTop: 8 }}>
                {IDENTITY.map((r) => (
                  <div key={r.label} style={idRow}>
                    <span style={idKey}>{r.label}:</span>
                    <span>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={bioBlock}>
                <div style={idKey}>BIO</div>
                {ABOUT.bio.map((text, i) => (
                  <p key={i} style={bioPara}>{text}</p>
                ))}
              </div>
              <div style={contactRow}>
                <a href={`mailto:${ABOUT.email}`} style={link}>{ABOUT.email}</a>
                {ABOUT.links.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" style={link}>{l.label} ↗</a>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="STATS" style={{ width: 172, flexShrink: 0 }}>
          {STATS.map((s) => (
            <div key={s.label} style={statRow}>
              <span style={{ color: DIM }}>{s.label}:</span>
              <span style={{ fontWeight: "bold" }}>{s.value}</span>
            </div>
          ))}
        </Panel>
      </div>

      {/* row 2: featured projects + education */}
      <div style={row}>
        <Panel title="FEATURED PROJECTS" style={{ flex: 1.2, minWidth: 240 }}>
          {FEATURED.map((p, i) => (
            <div key={p.title} style={{ marginBottom: i === FEATURED.length - 1 ? 0 : 10 }}>
              <div style={{ color: DIM, fontSize: 13 }}>{p.meta}</div>
              <div style={{ fontWeight: "bold" }}>
                {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" style={link}>{p.title} ↗</a> : p.title}
              </div>
              <div style={{ fontSize: 15 }}>{p.subtitle}</div>
            </div>
          ))}
          <ViewAll onClick={() => setTab("projects")}>VIEW ALL PROJECTS ▶</ViewAll>
        </Panel>

        <Panel title="EDUCATION" style={{ flex: 1, minWidth: 200 }}>
          {ABOUT.education.map((e, i) => (
            <div key={e.title} style={{ marginBottom: i === ABOUT.education.length - 1 ? 0 : 10 }}>
              <div style={{ fontWeight: "bold" }}>{e.title}</div>
              {e.subtitle && <div style={{ fontSize: 15 }}>{e.subtitle}</div>}
              {e.meta && <div style={{ color: DIM, fontSize: 13 }}>{e.meta}</div>}
            </div>
          ))}
          <ViewAll onClick={() => setTab("education")}>VIEW ALL ▶</ViewAll>
        </Panel>
      </div>
    </div>
  );
}

/* ── portrait ─────────────────────────────────────────────────────────── */
const FACE_SRC = "/profile/face.png";
const FACE_W = 770;
const FACE_H = 1083;
const FACE_MIN_H = 200;
const FACE_MAX_H = 380;

function FaceBox() {
  return (
    <div style={faceFrame}>
      <div style={faceStage}>
        <img
          src={FACE_SRC}
          width={FACE_W}
          height={FACE_H}
          alt={`${ABOUT.name}, ASCII portrait`}
          style={faceImg}
        />
      </div>
    </div>
  );
}

/* ── section views (non-profile tabs) ─────────────────────────────────── */
function SectionView({ tab, label }: { tab: TabId; label: string }) {
  return (
    <Panel title={label}>
      {tab === "skills" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ABOUT.skills.map((g) => (
            <div key={g.label}>
              <div style={{ fontWeight: "bold", marginBottom: 3 }}>{g.label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {g.items.map((s) => <span key={s} style={chip}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === "experience"  && ABOUT.experience.map((e) => <EntryBlock key={e.title} entry={e} />)}
      {tab === "education"   && ABOUT.education.map((e) => <EntryBlock key={e.title} entry={e} />)}
      {tab === "projects"    && ABOUT.projects.map((e) => <EntryBlock key={e.title} entry={e} />)}
      {tab === "games"       && ABOUT.games.map((e) => <EntryBlock key={e.title} entry={e} />)}
      {tab === "activities"  && ABOUT.extracurriculars.map((e) => <EntryBlock key={e.title} entry={e} />)}
      {tab === "credentials" && (
        <div>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>Certifications</div>
          <ul style={ul}>{ABOUT.certifications.map((c) => <li key={c} style={{ marginBottom: 3 }}>{c}</li>)}</ul>
          <div style={{ fontWeight: "bold", margin: "12px 0 4px" }}>Languages</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {ABOUT.languages.map((l) => <span key={l} style={chip}>{l}</span>)}
          </div>
        </div>
      )}
    </Panel>
  );
}

/* ── shared bits ──────────────────────────────────────────────────────── */
function Panel({ title, style, children }: { title: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div style={{ ...panel, ...style }}>
      <div style={panelTitle}>{title}</div>
      <div style={panelBody}>{children}</div>
    </div>
  );
}

function ViewAll({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={viewAll}>{children}</button>
  );
}

function EntryBlock({ entry }: { entry: Entry }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <strong>
          {entry.url ? <a href={entry.url} target="_blank" rel="noopener noreferrer" style={link}>{entry.title} ↗</a> : entry.title}
        </strong>
        {entry.meta && <span style={{ color: DIM, fontSize: 13 }}>{entry.meta}</span>}
      </div>
      {entry.subtitle && <div style={{ fontSize: 15 }}>{entry.subtitle}</div>}
      {entry.stack && <div style={{ color: DIM, fontSize: 13 }}>{entry.stack}</div>}
      {entry.bullets && (
        <ul style={ul}>{entry.bullets.map((b, i) => <li key={i} style={{ marginBottom: 2 }}>{b}</li>)}</ul>
      )}
    </div>
  );
}

/* ── styles ───────────────────────────────────────────────────────────── */
// Bleed over the window body's 8px padding so the black screen fills edge-to-edge.
const screen: CSSProperties = {
  margin: -8,
  width: "calc(100% + 16px)",
  height: "calc(100% + 16px)",
  boxSizing: "border-box",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  background: BG,
  color: FG,
  font: `12px/1.4 ${MONO}`,
};
const titleStrip: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "3px 8px",
  borderBottom: `1px solid ${LINE}`,
  fontSize: 15,
  flexShrink: 0,
};
const menuBar: CSSProperties = {
  display: "flex",
  gap: 14,
  padding: "2px 8px",
  borderBottom: `1px solid ${LINE}`,
  color: DIM,
  fontSize: 15,
  flexShrink: 0,
};
const menuItem: CSSProperties = { cursor: "default" };
const workArea: CSSProperties = { flex: 1, display: "flex", minHeight: 0 };

const sidebar: CSSProperties = {
  width: 158,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  borderRight: `1px solid ${LINE}`,
};
const brand: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: 8,
  borderBottom: `1px solid ${LINE}`,
  flexShrink: 0,
};
const brandMark: CSSProperties = {
  width: 26,
  height: 26,
  flexShrink: 0,
  display: "grid",
  placeItems: "center",
  fontWeight: "bold",
  fontSize: 20,
  color: BG,
  background: FG,
  border: `1px solid ${FG}`,
};
const navList: CSSProperties = { flex: 1, overflowY: "auto", minHeight: 0 };
const navItem: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  textAlign: "left",
  padding: "6px 8px",
  border: "none",
  borderBottom: `1px solid ${DIV}`,
  background: "transparent",
  color: FG,
  font: "inherit",
  fontSize: 15,
  cursor: "pointer",
};
const navItemOn: CSSProperties = { background: FG, color: BG, fontWeight: "bold" };
const navFooter: CSSProperties = { padding: 8, borderTop: `1px solid ${LINE}`, flexShrink: 0 };
const exportItem: CSSProperties = {
  border: `1px solid ${LINE_HI}`,
  padding: "6px 8px",
  fontWeight: "bold",
  letterSpacing: 0.5,
};

const mainScroll: CSSProperties = { flex: 1, minWidth: 0, overflowY: "auto", padding: 10 };
const mainHeaderBar: CSSProperties = {
  fontWeight: "bold",
  letterSpacing: 1,
  color: BG,
  background: FG,
  padding: "2px 8px",
  marginBottom: 8,
};

const row: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };
const panel: CSSProperties = { border: `1px solid ${LINE}`, display: "flex", flexDirection: "column", minWidth: 0 };
const panelTitle: CSSProperties = {
  padding: "3px 8px",
  borderBottom: `1px solid ${LINE}`,
  color: FG,
  fontWeight: "bold",
  letterSpacing: 1,
  fontSize: 15,
};
const panelBody: CSSProperties = { padding: 8, minWidth: 0 };

const FACE_PAPER = "#14140e";
const faceFrame: CSSProperties = {
  flexShrink: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  border: `1px solid ${LINE}`,
  background: FACE_PAPER,
  padding: 4,
  display: "flex",
  flexDirection: "column",
  alignSelf: "stretch",
};
const faceStage: CSSProperties = {
  flex: 1,
  minHeight: FACE_MIN_H,
  maxHeight: FACE_MAX_H,
  aspectRatio: `${FACE_W} / ${FACE_H}`,
};
const faceImg: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const kv: CSSProperties = { marginTop: 3, fontSize: 15 };
const kKey: CSSProperties = { color: DIM };
const badge: CSSProperties = {
  display: "inline-block",
  padding: "0 8px",
  color: BG,
  background: FG,
  fontWeight: "bold",
  fontSize: 13,
  letterSpacing: 1,
};
const quoteBox: CSSProperties = {
  marginTop: 8,
  padding: "4px 8px",
  border: `1px solid ${LINE}`,
  color: FG,
  fontSize: 15,
};
const idRow: CSSProperties = { display: "flex", gap: 8, fontSize: 15, marginTop: 2 };
const idKey: CSSProperties = { width: 104, flexShrink: 0, color: DIM };
const bioBlock: CSSProperties = { marginTop: 8, borderTop: `1px solid ${LINE}`, paddingTop: 6 };
const bioPara: CSSProperties = { margin: "3px 0 0", fontSize: 15, lineHeight: 1.45 };
const contactRow: CSSProperties = { marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13 };

const statRow: CSSProperties = { display: "flex", justifyContent: "space-between", padding: "1px 0", fontSize: 15 };

const viewAll: CSSProperties = {
  marginTop: 10,
  padding: 0,
  border: "none",
  background: "transparent",
  color: DIM,
  font: "inherit",
  fontSize: 13,
  letterSpacing: 0.5,
  cursor: "pointer",
};

const chip: CSSProperties = { fontSize: 15, padding: "1px 6px", border: `1px solid ${LINE}`, color: FG };
const ul: CSSProperties = { margin: "4px 0 0", paddingLeft: 16, fontSize: 15, lineHeight: 1.35, color: FG };
const link: CSSProperties = { color: FG, textDecoration: "underline", textUnderlineOffset: 2 };

const sysMsg: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "baseline",
  padding: "4px 8px",
  borderTop: `1px solid ${LINE}`,
  fontSize: 13,
  flexShrink: 0,
};
const sysMsgTag: CSSProperties = { color: FG, fontWeight: "bold", letterSpacing: 1, flexShrink: 0 };
const statusBar: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  padding: "2px 8px",
  borderTop: `1px solid ${LINE}`,
  color: FG,
  fontSize: 13,
  flexShrink: 0,
};

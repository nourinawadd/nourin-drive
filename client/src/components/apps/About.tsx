"use client";

import { ABOUT, type Entry } from "@/data/about";

export function About() {
  const initials = ABOUT.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      {/* profile card */}
      <div style={card}>
        <div style={portrait}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18 }}>{ABOUT.name}</h1>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{ABOUT.title}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{ABOUT.location}</div>
          <div style={{ fontSize: 12, marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href={`mailto:${ABOUT.email}`} style={link}>{ABOUT.email}</a>
            <span style={{ opacity: 0.6 }}>{ABOUT.phone}</span>
            {ABOUT.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" style={link}>
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>

      <Section title="About">
        {ABOUT.bio.map((p, i) => (
          <p key={i} style={para}>{p}</p>
        ))}
      </Section>

      <Section title="Skills">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ABOUT.skills.map((g) => (
            <div key={g.label}>
              <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 2 }}>{g.label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {g.items.map((s) => <span key={s} style={chip}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Education">
        {ABOUT.education.map((e, i) => <EntryBlock key={i} entry={e} />)}
      </Section>

      <Section title="Experience">
        {ABOUT.experience.map((e, i) => <EntryBlock key={i} entry={e} />)}
      </Section>

      <Section title="Software Projects">
        {ABOUT.projects.map((e, i) => <EntryBlock key={i} entry={e} />)}
      </Section>

      <Section title="Game Projects">
        {ABOUT.games.map((e, i) => <EntryBlock key={i} entry={e} />)}
      </Section>

      <Section title="Extracurriculars">
        {ABOUT.extracurriculars.map((e, i) => <EntryBlock key={i} entry={e} />)}
      </Section>

      <Section title="Certifications">
        <ul style={ul}>
          {ABOUT.certifications.map((c, i) => <li key={i} style={{ marginBottom: 2 }}>{c}</li>)}
        </ul>
      </Section>

      <Section title="Languages">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {ABOUT.languages.map((l) => <span key={l} style={chip}>{l}</span>)}
        </div>
      </Section>
    </div>
  );
}

function EntryBlock({ entry }: { entry: Entry }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 13 }}>
          {entry.url ? (
            <a href={entry.url} target="_blank" rel="noopener noreferrer" style={link}>{entry.title} ↗</a>
          ) : entry.title}
        </strong>
        {entry.meta && <span style={{ fontSize: 11, opacity: 0.6 }}>{entry.meta}</span>}
      </div>
      {entry.subtitle && <div style={{ fontSize: 12, opacity: 0.8 }}>{entry.subtitle}</div>}
      {entry.stack && <div style={{ fontSize: 11, opacity: 0.6, fontStyle: "italic" }}>{entry.stack}</div>}
      {entry.bullets && (
        <ul style={ul}>
          {entry.bullets.map((b, i) => <li key={i} style={{ marginBottom: 2 }}>{b}</li>)}
        </ul>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 10 }}>
      <div style={sectionTitle}>{title}</div>
      <div style={{ padding: "6px 2px" }}>{children}</div>
    </section>
  );
}

const card: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 8,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
};
const portrait: React.CSSProperties = {
  width: 56,
  height: 56,
  display: "grid",
  placeItems: "center",
  fontSize: 24,
  color: "var(--wb-white)",
  background: "linear-gradient(135deg,#0055aa,#ff8800)",
  border: "1px solid var(--wb-black)",
  flexShrink: 0,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: "bold",
  background: "var(--wb-black)",
  color: "var(--wb-white)",
  padding: "1px 6px",
};
const para: React.CSSProperties = { margin: "0 0 8px", fontSize: 14, lineHeight: 1.4 };
const chip: React.CSSProperties = {
  fontSize: 12,
  padding: "1px 6px",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
};
const ul: React.CSSProperties = {
  margin: "4px 0 0",
  paddingLeft: 18,
  fontSize: 14,
  lineHeight: 1.4,
};
const link: React.CSSProperties = {
  color: "#0055aa",
  textDecoration: "underline",
};

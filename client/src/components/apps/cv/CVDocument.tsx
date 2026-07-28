// Vector (selectable-text) PDF of the full CV, built with @react-pdf/renderer.
// These are react-pdf primitives (Document/Page/View/Text), NOT DOM elements.
// Rendered to a Blob and downloaded by ./exportPdf.tsx — never mounted in the DOM.
// All content comes from @/data/about; nothing is invented here.
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { ABOUT, type Entry } from "@/data/about";

const s = StyleSheet.create({
  page: {
    paddingVertical: 34,
    paddingHorizontal: 40,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#111111",
    lineHeight: 1.35,
  },
  // Explicit lineHeight on the large name/role: react-pdf otherwise inherits the
  // page's computed body line-height, collapsing the name's line box so the role
  // text overlaps it.
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, lineHeight: 1.2, marginBottom: 4 },
  role: { fontSize: 11, color: "#333333", lineHeight: 1.25, marginBottom: 2 },
  contact: { fontSize: 8.5, color: "#444444", lineHeight: 1.3, marginTop: 4 },
  link: { color: "#0055aa", textDecoration: "none" },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginTop: 13,
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  para: { marginBottom: 4 },
  entry: { marginBottom: 6 },
  entryHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  entryTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  entryMeta: { fontSize: 8, color: "#555555" },
  entrySub: { fontSize: 9 },
  entryStack: { fontSize: 8, color: "#555555", fontFamily: "Helvetica-Oblique" },
  bulletRow: { flexDirection: "row", marginTop: 1.5 },
  bulletDot: { width: 9, fontSize: 8.5 },
  bulletText: { flex: 1, fontSize: 8.5 },
  skillRow: { marginBottom: 3 },
  skillLabel: { fontFamily: "Helvetica-Bold" },
});

function EntryView({ e }: { e: Entry }) {
  return (
    <View style={s.entry} wrap={false}>
      <View style={s.entryHead}>
        <Text style={s.entryTitle}>{e.title}</Text>
        {e.meta ? <Text style={s.entryMeta}>{e.meta}</Text> : null}
      </View>
      {e.subtitle ? <Text style={s.entrySub}>{e.subtitle}</Text> : null}
      {e.stack ? <Text style={s.entryStack}>{e.stack}</Text> : null}
      {e.bullets?.map((b, i) => (
        <View key={i} style={s.bulletRow}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function CVDocument() {
  return (
    <Document author={ABOUT.name} title={`${ABOUT.name} · CV`}>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{ABOUT.name}</Text>
        <Text style={s.role}>{ABOUT.title}</Text>
        <Text style={s.contact}>
          {ABOUT.location}   |   {ABOUT.email}   |   {ABOUT.phone}
        </Text>
        <Text style={s.contact}>
          {ABOUT.links.map((l) => `${l.label}: ${l.url}`).join("     ")}
        </Text>

        <Section title="SUMMARY">
          {ABOUT.bio.map((p, i) => (
            <Text key={i} style={s.para}>{p}</Text>
          ))}
        </Section>

        <Section title="SKILLS">
          {ABOUT.skills.map((g) => (
            <View key={g.label} style={s.skillRow}>
              <Text>
                <Text style={s.skillLabel}>{g.label}: </Text>
                {g.items.join(" · ")}
              </Text>
            </View>
          ))}
        </Section>

        <Section title="EXPERIENCE">
          {ABOUT.experience.map((e, i) => <EntryView key={i} e={e} />)}
        </Section>

        <Section title="EDUCATION">
          {ABOUT.education.map((e, i) => <EntryView key={i} e={e} />)}
        </Section>

        <Section title="SOFTWARE PROJECTS">
          {ABOUT.projects.map((e, i) => <EntryView key={i} e={e} />)}
        </Section>

        <Section title="GAME PROJECTS">
          {ABOUT.games.map((e, i) => <EntryView key={i} e={e} />)}
        </Section>

        <Section title="EXTRACURRICULARS">
          {ABOUT.extracurriculars.map((e, i) => <EntryView key={i} e={e} />)}
        </Section>

        <Section title="CERTIFICATIONS">
          {ABOUT.certifications.map((c, i) => (
            <View key={i} style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{c}</Text>
            </View>
          ))}
        </Section>

        <Section title="LANGUAGES">
          <Text>{ABOUT.languages.join("     ·     ")}</Text>
        </Section>
      </Page>
    </Document>
  );
}

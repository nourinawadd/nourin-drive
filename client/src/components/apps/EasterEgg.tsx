"use client";

// Placeholder secret. Swap MESSAGE for the real hidden message later.
const ART = String.raw`
   ___________________
  |  .-----------.   |
  | |  SECRET    |   |
  | |  UNLOCKED  |   |
  | '-----------'    |
  |__________________|
`;

const MESSAGE = [
  "you typed the konami code.",
  "respect.",
  "",
  "there's nothing here yet...",
  "but you clearly know where to look.",
  "",
  "(placeholder secret · replace me)",
];

export function EasterEgg() {
  return (
    <div style={wrap}>
      <pre style={art}>{ART}</pre>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {MESSAGE.map((line, i) => (
          <span key={i} style={{ fontSize: 13, minHeight: 14 }}>{line}</span>
        ))}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  background: "var(--wb-black)",
  color: "#3f6",
  fontFamily: "var(--wb-font)",
  textAlign: "center",
  padding: 12,
};
const art: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.1,
  color: "var(--wb-orange)",
};

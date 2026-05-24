"use client";

import { PROJECTS } from "@/data/projects";

const games = PROJECTS.filter((p) => p.category === "games");

export function Games() {
  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div style={grid}>
        {games.length === 0 && (
          <div style={{ padding: 12, fontSize: 12, opacity: 0.6 }}>
            no games yet — add entries to data/projects.ts.
          </div>
        )}
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => g.url && window.open(g.url, "_blank", "noopener,noreferrer")}
            style={card}
            title={g.url ?? ""}
          >
            <div style={cover}>
              <span style={{ fontSize: 22 }}>▶</span>
            </div>
            <div style={meta}>
              <strong style={{ fontSize: 13 }}>{g.name}</strong>
              <span style={{ fontSize: 11, opacity: 0.7 }}>{g.blurb ?? ""}</span>
              <span style={{ fontSize: 11, opacity: 0.5 }}>opens in a new tab ↗</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: 8,
  padding: 4,
};
const card: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  padding: 6,
  fontFamily: "var(--wb-font)", color: "var(--wb-black)",
  cursor: "pointer", textAlign: "left",
};
const cover: React.CSSProperties = {
  width: "100%",
  aspectRatio: "16 / 9",
  background: "linear-gradient(135deg, #0055aa, #c33)",
  border: "1px solid var(--wb-black)",
  display: "grid",
  placeItems: "center",
  color: "var(--wb-white)",
};
const meta: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 2,
};

"use client";

import { PROJECTS } from "@/data/projects";
import { LOCAL_GAMES } from "@/data/games.generated";
import { useWindowStore } from "@/context/windowStore";

const games = PROJECTS.filter((p) => p.category === "games");

export function Games() {
  const openApp = useWindowStore((s) => s.openApp);

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div style={grid}>
        {games.length === 0 && (
          <div style={{ padding: 12, fontSize: 13, opacity: 0.6 }}>
            no games yet. add one with `npm run add`.
          </div>
        )}
        {games.map((g) => {
          const build = LOCAL_GAMES[g.id];
          const play = () => {
            if (build?.src) openApp("game", { payload: { src: build.src, name: g.name }, title: g.name });
            else if (g.url) window.open(g.url, "_blank", "noopener,noreferrer");
          };
          return (
            <div key={g.id} style={card}>
              <button onClick={play} style={cardBtn} title={build?.src ? "Play here" : g.url ?? ""}>
                <div style={cover}>
                  {build?.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={build.cover} alt="" style={coverImg} />
                  ) : (
                    <span style={{ fontSize: 23 }}>▶</span>
                  )}
                </div>
                <div style={meta}>
                  <strong style={{ fontSize: 14 }}>{g.name}</strong>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>{g.blurb ?? ""}</span>
                  <span style={{ fontSize: 12, opacity: 0.5 }}>
                    {build?.src ? "plays here ▶" : "opens in a new tab ↗"}
                  </span>
                </div>
              </button>
              {build?.src && g.url && (
                <a href={g.url} target="_blank" rel="noopener noreferrer" style={itchLink}>
                  view on itch ↗
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: 12,
  padding: 8,
};
const card: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  padding: 6,
};
const cardBtn: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
  background: "transparent", border: "none", padding: 0,
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
  overflow: "hidden",
};
const coverImg: React.CSSProperties = {
  width: "100%", height: "100%", objectFit: "cover", display: "block",
};
const meta: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 2,
};
const itchLink: React.CSSProperties = {
  fontSize: 12,
  color: "#0055aa",
  textDecoration: "underline",
  alignSelf: "flex-start",
};

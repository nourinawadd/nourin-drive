"use client";

import { PROJECTS } from "@/data/projects";
import { LOCAL_GAMES } from "@/data/games.generated";
import { useWindowStore } from "@/context/windowStore";
import { useIsPhone } from "@/components/os/ShellModeProvider";

const games = PROJECTS.filter((p) => p.category === "games");

export function Games() {
  const openApp = useWindowStore((s) => s.openApp);
  // Phone: one card per row and larger text. Play is the same call; the phone
  // shell redirects a `game` open to the game's itch.io page (phoneRedirects),
  // so every card says it opens there, and the separate itch link would just be
  // a second button doing the same thing. A build with no itch page lands on
  // "needs a computer", which the hint says up front.
  const phone = useIsPhone();

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div style={{ ...grid, ...(phone ? gridPhone : null) }}>
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
          const hint = !phone
            ? build?.src ? "plays here ▶" : "opens in a new tab ↗"
            : g.url ? "opens on itch ↗"
            : build?.src ? "needs a computer"
            : "opens in a new tab ↗";
          return (
            <div key={g.id} style={card}>
              <button onClick={play} style={cardBtn} title={build?.src && !phone ? "Play here" : g.url ?? ""}>
                <div style={cover}>
                  {build?.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={build.cover} alt="" style={coverImg} />
                  ) : (
                    <span style={{ fontSize: 23 }}>▶</span>
                  )}
                </div>
                <div style={meta}>
                  <strong style={{ fontSize: 14, ...(phone ? namePhone : null) }}>{g.name}</strong>
                  <span style={{ fontSize: 12, opacity: 0.7, ...(phone ? blurbPhone : null) }}>{g.blurb ?? ""}</span>
                  <span style={{ fontSize: 12, opacity: 0.5, ...(phone ? hintPhone : null) }}>
                    {hint}
                  </span>
                </div>
              </button>
              {!phone && build?.src && g.url && (
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
  aspectRatio: "630 / 500",
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

/* ---- phone overrides: spread over the desktop objects above ----------- */
// One column: minmax(300px) would overflow a 320px phone.
const gridPhone: React.CSSProperties = { gridTemplateColumns: "minmax(0, 1fr)", gap: 10 };
const namePhone: React.CSSProperties = { fontSize: 16 };
const blurbPhone: React.CSSProperties = { fontSize: 14, lineHeight: 1.35 };
const hintPhone: React.CSSProperties = { fontSize: 13, opacity: 0.6 };

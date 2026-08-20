"use client";

import { usePrefsStore } from "@/context/prefsStore";
import { IDLE_CHOICES, SAVERS, SAVER_OFF, findSaver } from "@/data/savers";
import { PresetList, type PresetRow } from "@/components/apps/prefs/PresetList";
import { playSfx } from "@/lib/sfx";

const W = 50;
const H = 30;

function BoingThumb() {
  const cells = [];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={14 + x * 6}
          y={4 + y * 6}
          width={6}
          height={6}
          fill={(x + y) % 2 === 0 ? "var(--wb-red)" : "var(--wb-white)"}
        />,
      );
    }
  }
  return (
    <svg width={W} height={H} shapeRendering="crispEdges" aria-hidden>
      <rect width={W} height={H} fill="var(--wb-black)" />
      <path d="M0 10 H50 M0 20 H50 M12 0 V30 M25 0 V30 M38 0 V30" stroke="var(--wb-purple-d)" />
      <defs>
        <clipPath id="wb-saver-boing">
          <circle cx={26} cy={15} r={11} />
        </clipPath>
      </defs>
      <g clipPath="url(#wb-saver-boing)">{cells}</g>
    </svg>
  );
}

const DOTS: [number, number, number][] = [
  [25, 15, 1.6],
  [16, 9, 1],
  [35, 21, 1.2],
  [38, 8, 0.8],
  [11, 22, 1.4],
  [30, 6, 0.7],
  [19, 24, 0.9],
  [43, 15, 1.1],
  [7, 13, 0.8],
  [32, 12, 0.6],
];

function StarsThumb() {
  return (
    <svg width={W} height={H} aria-hidden>
      <rect width={W} height={H} fill="var(--wb-black)" />
      {DOTS.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="var(--wb-white)" />
      ))}
    </svg>
  );
}

function OffThumb() {
  return (
    <svg width={W} height={H} shapeRendering="crispEdges" aria-hidden>
      <rect width={W} height={H} fill="var(--wb-gray)" />
      <path d="M0 0 L50 30 M50 0 L0 30" stroke="var(--wb-gray-2)" />
    </svg>
  );
}

const THUMBS: Record<string, React.ReactNode> = {
  boing: <BoingThumb />,
  stars: <StarsThumb />,
  off: <OffThumb />,
};

export function ScreensaverEditor() {
  const saver = usePrefsStore((s) => s.saver);
  const saverIdle = usePrefsStore((s) => s.saverIdle);
  const setSaver = usePrefsStore((s) => s.setSaver);
  const setSaverIdle = usePrefsStore((s) => s.setSaverIdle);

  const off = saver === SAVER_OFF;
  const active = findSaver(saver);

  const rows: PresetRow[] = SAVERS.map((s) => ({
    id: s.id,
    label: s.label,
    blurb: s.blurb,
    preview: THUMBS[s.id] ?? null,
  }));

  const footer = (
    <div style={footerRow}>
      <span style={footerLabel}>Blank after</span>
      {IDLE_CHOICES.map((choice) => {
        const on = !off && choice.seconds === saverIdle;
        return (
          <button
            key={choice.seconds}
            type="button"
            aria-pressed={on}
            disabled={off}
            style={{ ...gadget, ...(on ? gadgetOn : null), ...(off ? gadgetOff : null) }}
            onClick={() => {
              if (on) return;
              playSfx("select");
              setSaverIdle(choice.seconds);
            }}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );

  const hint = off
    ? "Screensaver off"
    : `${active?.label ?? "Screensaver"} after ${saverIdle} seconds idle`;

  return (
    <PresetList rows={rows} activeId={saver} onPick={setSaver} hint={hint} footer={footer} />
  );
}

const footerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 4,
  padding: "5px 6px",
  background: "var(--wb-gray)",
  borderTop: "1px solid var(--wb-black)",
  boxShadow: "inset 0 1px 0 var(--wb-white)",
};
const footerLabel: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  marginRight: 4,
};
const gadget: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  padding: "1px 8px",
  color: "var(--wb-black)",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
  cursor: "pointer",
};
const gadgetOn: React.CSSProperties = {
  background: "var(--wb-orange)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-orange-d)",
  fontWeight: "bold",
};
const gadgetOff: React.CSSProperties = {
  opacity: 0.45,
  cursor: "default",
};

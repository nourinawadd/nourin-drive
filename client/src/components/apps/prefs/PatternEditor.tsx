"use client";

import { usePrefsStore } from "@/context/prefsStore";
import { PATTERNS, type Pattern } from "@/data/prefs";
import { PresetList, type PresetRow } from "@/components/apps/prefs/PresetList";

const TILE = 5;
const COLS = 10;
const ROWS = 6;

function Tile({ pattern }: { pattern: Pattern }) {
  const w = pattern.rows[0].length;
  const h = pattern.rows.length;
  const cols = COLS;
  const rows = ROWS;

  const cells = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = pattern.rows[y % h][x % w];
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x * TILE}
          y={y * TILE}
          width={TILE}
          height={TILE}
          fill={ch === "B" ? "var(--wb-white)" : "var(--wb-black)"}
        />,
      );
    }
  }

  return (
    <svg
      width={cols * TILE}
      height={rows * TILE}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {cells}
    </svg>
  );
}

export function PatternEditor() {
  const pattern = usePrefsStore((s) => s.pattern);
  const setPattern = usePrefsStore((s) => s.setPattern);

  const rows: PresetRow[] = PATTERNS.map((p) => ({
    id: p.id,
    label: p.label,
    blurb: p.blurb,
    preview: <Tile pattern={p} />,
  }));

  const active = PATTERNS.find((p) => p.id === pattern);

  return (
    <PresetList
      rows={rows}
      activeId={pattern}
      onPick={setPattern}
      hint={active ? `${active.label} · takes its colours from the palette` : "WBPattern"}
    />
  );
}

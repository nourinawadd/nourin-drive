"use client";

import { usePrefsStore } from "@/context/prefsStore";
import { PALETTES } from "@/data/prefs";
import { PresetList, type PresetRow } from "@/components/apps/prefs/PresetList";

const SWATCH = 13;

function Swatch({ colors }: { colors: string[] }) {
  return (
    <svg
      width={SWATCH * colors.length}
      height={SWATCH * 2}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {colors.map((c, i) => (
        <rect key={i} x={i * SWATCH} y={0} width={SWATCH} height={SWATCH * 2} fill={c} />
      ))}
    </svg>
  );
}

export function PaletteEditor() {
  const palette = usePrefsStore((s) => s.palette);
  const setPalette = usePrefsStore((s) => s.setPalette);

  const rows: PresetRow[] = PALETTES.map((p) => ({
    id: p.id,
    label: p.label,
    blurb: p.blurb,
    preview: <Swatch colors={p.swatch} />,
  }));

  const active = PALETTES.find((p) => p.id === palette);

  return (
    <PresetList
      rows={rows}
      activeId={palette}
      onPick={setPalette}
      hint={active ? `${active.label} · applies everywhere, icons included` : "Palette"}
    />
  );
}

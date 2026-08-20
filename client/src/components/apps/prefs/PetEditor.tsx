"use client";

import { usePrefsStore } from "@/context/prefsStore";
import { DELAY_CHOICES, PETS, PET_OFF, PET_RANDOM, findPet } from "@/data/pets";
import { PET_GRIDS } from "@/components/os/pet/sprites";
import { gridRects } from "@/components/os/pixelGrid";
import { PresetList, type PresetRow } from "@/components/apps/prefs/PresetList";
import { playSfx } from "@/lib/sfx";

const THUMB = 32;
const GRID = 16;

function Thumb({ name }: { name: string }) {
  const grid = PET_GRIDS[name];
  if (!grid) return null;
  return (
    <svg
      width={THUMB}
      height={THUMB}
      viewBox={`0 0 ${GRID} ${GRID}`}
      shapeRendering="crispEdges"
      aria-hidden
      style={{ display: "block" }}
    >
      {gridRects(grid.rows)}
    </svg>
  );
}

function Dice() {
  return (
    <svg width={THUMB} height={THUMB} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden style={{ display: "block" }}>
      <rect x={2} y={2} width={12} height={12} fill="var(--wb-gray)" />
      <rect x={2} y={2} width={12} height={1} fill="var(--wb-white)" />
      <rect x={2} y={2} width={1} height={12} fill="var(--wb-white)" />
      <rect x={2} y={13} width={12} height={1} fill="var(--wb-black)" />
      <rect x={13} y={2} width={1} height={12} fill="var(--wb-black)" />
      <rect x={5} y={5} width={2} height={2} fill="var(--wb-black)" />
      <rect x={9} y={9} width={2} height={2} fill="var(--wb-black)" />
      <rect x={9} y={5} width={2} height={2} fill="var(--wb-black)" />
      <rect x={5} y={9} width={2} height={2} fill="var(--wb-black)" />
    </svg>
  );
}

function Blank() {
  return (
    <svg width={THUMB} height={THUMB} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden style={{ display: "block" }}>
      <rect width={16} height={16} fill="var(--wb-gray)" />
      <path d="M0 0 L16 16 M16 0 L0 16" stroke="var(--wb-gray-2)" strokeWidth={1} />
    </svg>
  );
}

function previewFor(id: string) {
  if (id === PET_RANDOM) return <Dice />;
  if (id === PET_OFF) return <Blank />;
  return <Thumb name={`${id.toUpperCase()}_SIT`} />;
}

export function PetEditor() {
  const pet = usePrefsStore((s) => s.pet);
  const petDelay = usePrefsStore((s) => s.petDelay);
  const setPet = usePrefsStore((s) => s.setPet);
  const setPetDelay = usePrefsStore((s) => s.setPetDelay);

  const off = pet === PET_OFF;
  const active = findPet(pet);

  const rows: PresetRow[] = PETS.map((p) => ({
    id: p.id,
    label: p.label,
    blurb: p.blurb,
    preview: previewFor(p.id),
  }));

  const footer = (
    <div style={footerRow}>
      <span style={footerLabel}>Arrives after</span>
      {DELAY_CHOICES.map((choice) => {
        const on = !off && choice.seconds === petDelay;
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
              setPetDelay(choice.seconds);
            }}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );

  const hint = off
    ? "No pet"
    : `${active?.label ?? "Pet"} turns up after ${Math.round(petDelay / 60)} min`;

  return <PresetList rows={rows} activeId={pet} onPick={setPet} hint={hint} footer={footer} />;
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

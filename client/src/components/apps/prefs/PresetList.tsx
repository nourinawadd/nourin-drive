"use client";

import type { ReactNode } from "react";
import { useIsPhone } from "@/components/os/ShellModeProvider";
import { playSfx } from "@/lib/sfx";

export type PresetRow = {
  id: string;
  label: string;
  blurb: string;
  preview: ReactNode;
};

export function PresetList({
  rows,
  activeId,
  onPick,
  hint,
  footer,
}: {
  rows: PresetRow[];
  activeId: string;
  onPick: (id: string) => void;
  hint: string;
  footer?: ReactNode;
}) {
  // Phone: rows a thumb can pick out, and a hint line that may wrap rather
  // than run off the edge.
  const phone = useIsPhone();
  return (
    <div style={shell}>
      <div style={listPane}>
        {rows.map((row) => {
          const active = row.id === activeId;
          return (
            <button
              key={row.id}
              type="button"
              aria-pressed={active}
              style={{ ...rowStyle, ...(phone ? rowPhone : null), ...(active ? rowActive : null) }}
              onClick={() => {
                if (active) return;
                playSfx("select");
                onPick(row.id);
              }}
            >
              <span style={previewWrap}>{row.preview}</span>
              <span style={{ minWidth: 0, textAlign: "left" }}>
                <span style={rowLabel}>{row.label}</span>
                <span style={rowBlurb}>{row.blurb}</span>
              </span>
              <span style={tick}>{active ? "✓" : ""}</span>
            </button>
          );
        })}
      </div>
      {footer}
      <div style={{ ...statusBar, ...(phone ? statusBarPhone : null) }}>{hint}</div>
    </div>
  );
}

const shell: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  fontFamily: "var(--wb-font)",
  color: "var(--wb-black)",
};
const listPane: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: 6,
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-2), inset -1px -1px 0 var(--wb-white)",
};
const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "6px 8px",
  fontFamily: "var(--wb-font)",
  fontSize: 15,
  textAlign: "left",
  color: "var(--wb-black)",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
  cursor: "pointer",
};
const rowActive: React.CSSProperties = {
  background: "var(--wb-orange)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-orange-d)",
};
const previewWrap: React.CSSProperties = {
  display: "inline-flex",
  flexShrink: 0,
  border: "1px solid var(--wb-black)",
  lineHeight: 0,
};
const rowLabel: React.CSSProperties = {
  display: "block",
  fontSize: 15,
};
const rowBlurb: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  opacity: 0.75,
  lineHeight: 1.25,
};
const tick: React.CSSProperties = {
  marginLeft: "auto",
  flexShrink: 0,
  fontSize: 15,
};
const statusBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "3px 6px",
  fontSize: 13,
  background: "var(--wb-gray)",
  borderTop: "1px solid var(--wb-black)",
  boxShadow: "inset 0 1px 0 var(--wb-white)",
};

/* ---- phone overrides: spread over the desktop objects above ----------- */
const rowPhone: React.CSSProperties = { minHeight: 52 };
const statusBarPhone: React.CSSProperties = { padding: "6px 8px", fontSize: 13, lineHeight: 1.3 };

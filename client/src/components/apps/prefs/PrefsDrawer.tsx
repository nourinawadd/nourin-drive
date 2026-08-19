"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { useWindowStore } from "@/context/windowStore";
import { usePrefsStore } from "@/context/prefsStore";
import { DEFAULT_PALETTE, DEFAULT_PATTERN } from "@/data/prefs";
import { DockPhoto } from "@/components/os/icons";
import { playSfx } from "@/lib/sfx";
import type { AppId } from "@/types/window";

type Tool = { id: string; name: string; appId: AppId; Icon: ComponentType };

// TODO(art): both tools are borrowing DockPhoto until Prefs gets its own icons.
const TOOLS: Tool[] = [
  { id: "palette", name: "Palette", appId: "prefs-palette", Icon: DockPhoto },
  { id: "pattern", name: "WBPattern", appId: "prefs-pattern", Icon: DockPhoto },
];

export function PrefsDrawer() {
  const openApp = useWindowStore((s) => s.openApp);
  const reset = usePrefsStore((s) => s.reset);
  const palette = usePrefsStore((s) => s.palette);
  const pattern = usePrefsStore((s) => s.pattern);
  const [selected, setSelected] = useState<string | null>(null);

  const isDefault = palette === DEFAULT_PALETTE && pattern === DEFAULT_PATTERN;

  return (
    <div style={shell}>
      <div style={iconGrid}>
        {TOOLS.map((t) => {
          const active = selected === t.id;
          return (
            <button
              key={t.id}
              style={iconCell}
              onClick={() => {
                if (!active) playSfx("select");
                setSelected(t.id);
              }}
              onDoubleClick={() => {
                playSfx("launch");
                openApp(t.appId);
              }}
            >
              <span style={{ display: "inline-flex" }}>
                <t.Icon />
              </span>
              <span
                style={{
                  ...iconLabel,
                  background: active ? "var(--wb-orange)" : "transparent",
                  outline: active ? "1px dotted var(--wb-black)" : "none",
                }}
              >
                {t.name}
              </span>
            </button>
          );
        })}
      </div>

      <div style={footer}>
        <span style={{ opacity: 0.7 }}>
          {isDefault ? "Factory settings" : "Modified"}
        </span>
        <button
          type="button"
          style={{ ...resetBtn, opacity: isDefault ? 0.5 : 1 }}
          disabled={isDefault}
          onClick={() => {
            playSfx("menu");
            reset();
          }}
        >
          Reset to Defaults
        </button>
      </div>
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
const iconGrid: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: 6,
  padding: 8,
  alignContent: "start",
};
const iconCell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "6px 2px",
  border: "none",
  background: "transparent",
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  color: "var(--wb-black)",
  cursor: "default",
  userSelect: "none",
};
const iconLabel: React.CSSProperties = {
  maxWidth: "100%",
  padding: "0 3px",
  textAlign: "center",
  wordBreak: "break-word",
  lineHeight: 1.25,
};
const footer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "4px 6px",
  fontSize: 13,
  background: "var(--wb-gray)",
  borderTop: "1px solid var(--wb-black)",
  boxShadow: "inset 0 1px 0 var(--wb-white)",
};
const resetBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  padding: "2px 10px",
  background: "var(--wb-gray)",
  color: "var(--wb-black)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
  cursor: "pointer",
};

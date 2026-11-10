"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { useWindowStore } from "@/context/windowStore";
import { usePrefsStore } from "@/context/prefsStore";
import { DEFAULT_PALETTE, DEFAULT_PATTERN } from "@/data/prefs";
import { DEFAULT_IDLE, DEFAULT_SAVER } from "@/data/savers";
import { DEFAULT_DELAY, DEFAULT_PET } from "@/data/pets";
import { DockPhoto } from "@/components/os/icons";
import { useIsPhone } from "@/components/os/ShellModeProvider";
import { mobileSupport } from "@/data/appRegistry";
import { playSfx } from "@/lib/sfx";
import { useActivate } from "@/lib/useActivate";
import type { AppId } from "@/types/window";

type Tool = { id: string; name: string; appId: AppId; Icon: ComponentType };

// TODO(art): both tools are borrowing DockPhoto until Prefs gets its own icons.
const TOOLS: Tool[] = [
  { id: "palette", name: "Palette", appId: "prefs-palette", Icon: DockPhoto },
  { id: "pattern", name: "WBPattern", appId: "prefs-pattern", Icon: DockPhoto },
  { id: "saver", name: "ScreenSaver", appId: "prefs-screensaver", Icon: DockPhoto },
  { id: "pet", name: "Pet", appId: "prefs-pet", Icon: DockPhoto },
];

export function PrefsDrawer() {
  const openApp = useWindowStore((s) => s.openApp);
  const reset = usePrefsStore((s) => s.reset);
  const palette = usePrefsStore((s) => s.palette);
  const pattern = usePrefsStore((s) => s.pattern);
  const saver = usePrefsStore((s) => s.saver);
  const saverIdle = usePrefsStore((s) => s.saverIdle);
  const pet = usePrefsStore((s) => s.pet);
  const petDelay = usePrefsStore((s) => s.petDelay);
  const [selected, setSelected] = useState<string | null>(null);
  // Phone: only the tools the phone can open (Palette and WBPattern;
  // ScreenSaver and Pet are desktop features), larger cells, and a thumb-sized
  // Reset. Reset still restores everything, ScreenSaver and Pet included: it's
  // one store, and "Modified" may honestly mean a saver chosen on this
  // browser's desktop.
  const phone = useIsPhone();
  const tools = phone ? TOOLS.filter((t) => mobileSupport(t.appId) !== "hidden") : TOOLS;

  const isDefault =
    palette === DEFAULT_PALETTE &&
    pattern === DEFAULT_PATTERN &&
    saver === DEFAULT_SAVER &&
    saverIdle === DEFAULT_IDLE &&
    pet === DEFAULT_PET &&
    petDelay === DEFAULT_DELAY;

  return (
    <div style={shell}>
      <div style={{ ...iconGrid, ...(phone ? iconGridPhone : null) }}>
        {tools.map((t) => (
          <ToolIcon
            key={t.id}
            tool={t}
            active={selected === t.id}
            phone={phone}
            onSelect={() => setSelected(t.id)}
            onOpen={() => openApp(t.appId)}
          />
        ))}
      </div>

      <div style={{ ...footer, ...(phone ? footerPhone : null) }}>
        <span style={{ opacity: 0.7 }}>
          {isDefault ? "Factory settings" : "Modified"}
        </span>
        <button
          type="button"
          style={{ ...resetBtn, ...(phone ? resetBtnPhone : null), opacity: isDefault ? 0.5 : 1 }}
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

/**
 * One tool in the drawer. The Workbench rule through useActivate: on the
 * desktop a click selects (with its sound) and a double-click opens, exactly as
 * the drawer always did; on a phone one tap opens it, and only the launch sound
 * plays, since the selection is never seen before the tool covers the screen.
 */
function ToolIcon({
  tool, active, phone, onSelect, onOpen,
}: {
  tool: Tool;
  active: boolean;
  phone: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const activate = useActivate();
  const select = () => {
    if (!active) playSfx("select");
    onSelect();
  };
  return (
    <button
      style={{ ...iconCell, ...(phone ? iconCellPhone : null) }}
      {...activate({
        onSelect: phone ? undefined : select,
        onOpen: () => {
          playSfx("launch");
          onOpen();
        },
      })}
    >
      <span style={{ display: "inline-flex" }}>
        <tool.Icon />
      </span>
      <span
        style={{
          ...iconLabel,
          background: active ? "var(--wb-orange)" : "transparent",
          outline: active ? "1px dotted var(--wb-black)" : "none",
        }}
      >
        {tool.name}
      </span>
    </button>
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

/* ---- phone overrides: spread over the desktop objects above ----------- */
const iconGridPhone: React.CSSProperties = { gridTemplateColumns: "repeat(2, 1fr)", gap: 8, padding: 12 };
const iconCellPhone: React.CSSProperties = { minHeight: 88, justifyContent: "center", gap: 6, padding: 10, fontSize: 16 };
const footerPhone: React.CSSProperties = { flexWrap: "wrap", padding: "6px 8px", fontSize: 14 };
const resetBtnPhone: React.CSSProperties = { minHeight: 44, padding: "0 14px", fontSize: 15 };

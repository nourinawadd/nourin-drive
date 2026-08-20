"use client";

import { ContextMenu, type MenuItem } from "@/components/os/ContextMenu";
import { usePrefsStore } from "@/context/prefsStore";
import { useStickyStore } from "@/context/stickyStore";
import { useWindowStore } from "@/context/windowStore";
import { PALETTES, PATTERNS } from "@/data/prefs";
import { playSfx } from "@/lib/sfx";

type Props = { x: number; y: number; onClose: () => void };

export function DesktopMenu({ x, y, onClose }: Props) {
  const palette = usePrefsStore((s) => s.palette);
  const pattern = usePrefsStore((s) => s.pattern);
  const setPalette = usePrefsStore((s) => s.setPalette);
  const setPattern = usePrefsStore((s) => s.setPattern);
  const addSticky = useStickyStore((s) => s.add);
  const openApp = useWindowStore((s) => s.openApp);

  const items: MenuItem[] = [
    {
      kind: "item",
      label: "New Sticky",
      onSelect: () => {
        playSfx("menu");
        addSticky({ x, y });
      },
    },
    {
      kind: "item",
      label: "Clean Up",
      onSelect: () => {
        playSfx("menu");
        window.dispatchEvent(new Event("wb:cleanup-icons"));
      },
    },
    { kind: "separator" },
    {
      kind: "submenu",
      label: "Change Palette",
      items: PALETTES.map((p): MenuItem => ({
        kind: "item",
        label: p.label,
        hint: palette === p.id ? "•" : undefined,
        onSelect: () => {
          playSfx("select");
          setPalette(p.id);
        },
      })),
    },
    {
      kind: "submenu",
      label: "Backdrop Pattern",
      items: PATTERNS.map((p): MenuItem => ({
        kind: "item",
        label: p.label,
        hint: pattern === p.id ? "•" : undefined,
        onSelect: () => {
          playSfx("select");
          setPattern(p.id);
        },
      })),
    },
    { kind: "separator" },
    {
      kind: "item",
      label: "Preferences…",
      onSelect: () => {
        playSfx("menu");
        openApp("prefs");
      },
    },
  ];

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}

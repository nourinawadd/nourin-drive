"use client";

import { useEffect } from "react";
import { usePrefsStore } from "@/context/prefsStore";
import {
  PALETTE_TOKENS,
  findPalette,
  findPattern,
  patternImage,
  patternSize,
} from "@/data/prefs";

const IMAGE_VAR = "--wb-desktop-image";
const SIZE_VAR = "--wb-desktop-size";

function readToken(root: HTMLElement, name: string): string {
  return getComputedStyle(root).getPropertyValue(name).trim();
}

function apply(paletteId: string, patternId: string): void {
  const root = document.documentElement;

  const palette = findPalette(paletteId);
  const tokens = palette?.tokens ?? {};
  for (const name of PALETTE_TOKENS) {
    const value = tokens[name];
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  }

  const pattern = findPattern(patternId);
  if (!pattern) {
    root.style.removeProperty(IMAGE_VAR);
    root.style.removeProperty(SIZE_VAR);
    return;
  }

  const colorA = readToken(root, "--wb-blue");
  const colorB = readToken(root, "--wb-blue-2");
  root.style.setProperty(IMAGE_VAR, patternImage(pattern, colorA, colorB));
  root.style.setProperty(SIZE_VAR, patternSize(pattern));
}

export function PrefsEngine() {
  const hydrate = usePrefsStore((s) => s.hydrate);
  const palette = usePrefsStore((s) => s.palette);
  const pattern = usePrefsStore((s) => s.pattern);
  const hydrated = usePrefsStore((s) => s.hydrated);

  useEffect(() => hydrate(), [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    apply(palette, pattern);
  }, [hydrated, palette, pattern]);

  return null;
}

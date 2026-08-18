"use client";

import type { ReactNode } from "react";

type Props = {
  name: string;
  section: number;
  children?: ReactNode;
};

// Placeholder app body used during scaffolding. Real apps replace these
// in later sections.
export function Stub({ name, section, children }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <strong>{name}</strong>
      <span style={{ opacity: 0.7, fontSize: 13 }}>
        coming in section {section}.
      </span>
      {children}
    </div>
  );
}

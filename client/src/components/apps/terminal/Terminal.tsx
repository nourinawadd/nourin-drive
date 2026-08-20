"use client";

import { Shell } from "./Shell";
import { TtydPane } from "./TtydPane";
import { normalizePayload } from "./payload";

export function Terminal({ winId, payload }: { winId: string; payload?: unknown }) {
  const state = normalizePayload(payload);

  if (state.mode === "ssh") return <TtydPane winId={winId} host={state.host} />;
  return <Shell winId={winId} payload={state} />;
}

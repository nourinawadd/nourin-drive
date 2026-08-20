"use client";

import { useEffect, useState } from "react";
import { playSfx } from "@/lib/sfx";
import { SSH_PORT } from "./commands/ssh";
import { appendLines, patch } from "./payload";

const TTYD_URL = process.env.NEXT_PUBLIC_TTYD_URL ?? "/terminal/";

const SLOW_MS = 12000;

export function TtydPane({ winId, host }: { winId: string; host: string }) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function disconnect() {
    playSfx("close");
    patch(winId, { mode: "shell" });
    appendLines(winId, `connection to ${host} closed.`, "note");
  }

  return (
    <div style={wrap}>
      <div style={bar}>
        <span style={{ ...dot, background: loaded ? "var(--wb-teal)" : "var(--wb-orange)" }} />
        <span style={label}>
          {loaded ? `${host}:${SSH_PORT}` : `opening ${host}:${SSH_PORT}`}
        </span>
        <button type="button" onClick={disconnect} style={button}>
          Disconnect
        </button>
      </div>

      <div style={frameWrap}>
        <iframe
          src={TTYD_URL}
          title={`ssh ${host}`}
          onLoad={() => setLoaded(true)}
          style={frame}
        />
        {!loaded && (
          <div style={overlay}>
            <div style={panel}>
              {slow ? (
                <>
                  <p style={panelLine}>{host} is not answering.</p>
                  <p style={{ ...panelLine, color: "var(--wb-gray-3)" }}>
                    The ssh service may be down, or you may be running this from a dev server that
                    has no route to it.
                  </p>
                  <button type="button" onClick={disconnect} style={button}>
                    Back to the shell
                  </button>
                </>
              ) : (
                <p style={panelLine}>negotiating with {host}...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  gap: 4,
};

const bar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "2px 4px",
  border: "1px solid var(--wb-black)",
  background: "var(--wb-gray)",
  fontFamily: "var(--wb-font)",
  fontSize: 13,
  color: "var(--wb-black)",
};

const dot: React.CSSProperties = {
  width: 8,
  height: 8,
  border: "1px solid var(--wb-black)",
  flexShrink: 0,
};

const label: React.CSSProperties = {
  flex: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const button: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 13,
  padding: "0 8px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
  cursor: "pointer",
  color: "var(--wb-black)",
};

const frameWrap: React.CSSProperties = {
  flex: 1,
  position: "relative",
  minHeight: 0,
};

const frame: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: "1px solid var(--wb-black)",
  background: "var(--wb-black)",
  display: "block",
};

const overlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  background: "var(--wb-white)",
  padding: 16,
};

const panel: React.CSSProperties = {
  width: 340,
  maxWidth: "100%",
  background: "var(--wb-white)",
  border: "2px solid var(--wb-black)",
  boxShadow: "4px 4px 0 var(--wb-black)",
  padding: 14,
  textAlign: "center",
  fontFamily: "var(--wb-font)",
  fontSize: 13,
  color: "var(--wb-black)",
  display: "grid",
  gap: 10,
  justifyItems: "center",
};

const panelLine: React.CSSProperties = {
  margin: 0,
};

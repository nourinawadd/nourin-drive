import type { CSSProperties } from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wb-desktop-bg" style={screen}>
      <section style={windowFrame} aria-labelledby="not-found-title">
        <div style={titleBar}>
          <span style={titleGadget} aria-hidden />
          <span style={titleRule} aria-hidden />
          <h1 id="not-found-title" style={titleText}>ERROR: VOLUME NOT FOUND</h1>
          <span style={titleRule} aria-hidden />
        </div>
        <div style={body}>
          <div style={disk} aria-hidden>
            <span style={diskBand} />
            <span style={diskLabel}>?</span>
            <span style={diskSlot} />
          </div>
          <div style={copy}>
            <p style={status}>Workbench cannot mount the requested location.</p>
            <p style={hint}>The drawer may have moved, been renamed, or never existed on this drive.</p>
            <Link href="/" style={button}>Return to main desktop</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

const screen: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 18,
  color: "var(--wb-black)",
  fontFamily: "var(--wb-font)",
};

const windowFrame: CSSProperties = {
  width: "min(560px, calc(100vw - 36px))",
  border: "2px solid var(--wb-black)",
  background: "var(--wb-gray)",
  boxShadow: "8px 8px 0 rgba(0, 0, 0, 0.35)",
};

const titleBar: CSSProperties = {
  height: 26,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "3px 8px",
  borderBottom: "2px solid var(--wb-black)",
  background: "var(--wb-orange)",
};

const titleGadget: CSSProperties = {
  width: 16,
  height: 14,
  border: "2px solid var(--wb-black)",
  background: "var(--wb-gray-0)",
  boxShadow: "inset 2px 2px 0 var(--wb-white), inset -2px -2px 0 var(--wb-gray-3)",
  flexShrink: 0,
};

const titleRule: CSSProperties = {
  height: 2,
  background: "var(--wb-black)",
  borderTop: "2px solid var(--wb-orange-d)",
  borderBottom: "2px solid var(--wb-white)",
  flex: 1,
};

const titleText: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 400,
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const body: CSSProperties = {
  display: "flex",
  gap: 20,
  padding: 22,
  alignItems: "center",
};

const disk: CSSProperties = {
  width: 112,
  height: 80,
  border: "2px solid var(--wb-black)",
  background: "var(--wb-gray-0)",
  boxShadow: "inset 3px 3px 0 var(--wb-white), inset -3px -3px 0 var(--wb-gray-3)",
  position: "relative",
  flexShrink: 0,
};

const diskBand: CSSProperties = {
  position: "absolute",
  left: 8,
  right: 8,
  top: 8,
  height: 14,
  background: "var(--wb-steel)",
  borderBottom: "2px solid var(--wb-black)",
};

const diskLabel: CSSProperties = {
  position: "absolute",
  inset: "28px 14px 22px",
  display: "grid",
  placeItems: "center",
  background: "var(--wb-white)",
  border: "2px solid var(--wb-black)",
  color: "var(--wb-red)",
  fontSize: 32,
};

const diskSlot: CSSProperties = {
  position: "absolute",
  left: 24,
  right: 24,
  bottom: 8,
  height: 8,
  background: "var(--wb-black)",
  borderTop: "2px solid var(--wb-gray-3)",
};

const copy: CSSProperties = { minWidth: 0 };
const status: CSSProperties = { margin: "0 0 8px", fontSize: 28, lineHeight: 1.05 };
const hint: CSSProperties = { margin: "0 0 18px", fontSize: 20, lineHeight: 1.1 };
const button: CSSProperties = {
  display: "inline-block",
  padding: "6px 12px",
  border: "2px solid var(--wb-black)",
  background: "var(--wb-gray-0)",
  color: "var(--wb-black)",
  textDecoration: "none",
  boxShadow: "2px 2px 0 var(--wb-black)",
  fontSize: 22,
};
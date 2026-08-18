"use client";

/**
 * Workbench-style confirmation for Share, scoped to the window that raised it.
 * Positioned absolutely, so the host needs `position: relative`.
 */
export function ShareDialog({
  url, copied, what = "document", onClose,
}: {
  url: string;
  copied: boolean;
  what?: string;
  onClose: () => void;
}) {
  return (
    <div style={dialogBackdrop} onClick={onClose}>
      <div style={dialogPanel} onClick={(e) => e.stopPropagation()}>
        <div style={dialogTitle}>{copied ? "Link copied" : "Copy this link"}</div>
        <div style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.5 }}>
          {copied
            ? `The link is on your clipboard. It opens this ${what}.`
            : "Your browser blocked the clipboard. Select and copy it by hand:"}
        </div>
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          style={dialogInput}
          aria-label="Share link"
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button onClick={onClose} style={dialogButton} autoFocus>OK</button>
        </div>
      </div>
    </div>
  );
}

const dialogBackdrop: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 60,
  display: "grid",
  placeItems: "center",
  background: "rgba(0,0,0,0.28)",
};
const dialogPanel: React.CSSProperties = {
  width: 340,
  maxWidth: "88%",
  padding: 10,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3), 3px 3px 0 rgba(0,0,0,0.4)",
};
const dialogTitle: React.CSSProperties = {
  marginBottom: 6,
  fontSize: 14,
  fontWeight: "bold",
};
const dialogInput: React.CSSProperties = {
  width: "100%",
  padding: "3px 6px",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
};
const dialogButton: React.CSSProperties = {
  padding: "2px 18px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 13,
  color: "var(--wb-black)",
  cursor: "pointer",
};

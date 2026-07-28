"use client";

import { useWindowStore } from "@/context/windowStore";
import { FileIcon, FolderIcon, type IconCategory } from "@/components/os/icons";

// Everything the dialog needs, captured when it is opened. Kept flat and
// serialisable because it rides along in the window payload.
export type PropertiesPayload = {
  kind: "file" | "folder";
  name: string;
  typeLabel: string;
  location: string;
  date?: string;
  blurb?: string;
  iconCat?: IconCategory;
  /** Folders only: "3 Files, 2 Folders". */
  contains?: string;
};

export function Properties({ winId, payload }: { winId: string; payload: unknown }) {
  const closeWin = useWindowStore((s) => s.closeWin);
  const p = (payload ?? {}) as Partial<PropertiesPayload>;
  const close = () => closeWin(winId);

  return (
    <div style={shell}>
      {/* single-tab strip — the tab is decorative, but the shape is the point */}
      <div style={tabStrip}>
        <div style={tab}>General</div>
      </div>

      <div style={sheet}>
        <div style={headerRow}>
          <span style={{ display: "inline-flex", flexShrink: 0 }}>
            {p.kind === "folder"
              ? <FolderIcon scale={3} />
              : <FileIcon category={p.iconCat ?? "blog"} scale={3} />}
          </span>
          <span style={nameText}>{p.name ?? "Unknown"}</span>
        </div>

        <Rule />

        <Field label="Type" value={p.typeLabel ?? "-"} />
        <Field label="Location" value={p.location ?? "-"} />
        {p.contains && <Field label="Contains" value={p.contains} />}
        <Field label="Modified" value={p.date ?? "-"} />

        {p.blurb && (
          <>
            <Rule />
            <div style={{ display: "flex", gap: 6 }}>
              <span style={fieldKey}>Comments:</span>
              <span style={{ flex: 1, lineHeight: 1.45 }}>{p.blurb}</span>
            </div>
          </>
        )}
      </div>

      <div style={buttonRow}>
        <button style={button} onClick={close}>OK</button>
        <button style={button} onClick={close}>Cancel</button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
      <span style={fieldKey}>{label}:</span>
      <span style={{ flex: 1, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

const Rule = () => <div style={rule} />;

const shell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  padding: 8,
  gap: 6,
  fontSize: 12,
  minHeight: 0,
};
const tabStrip: React.CSSProperties = {
  display: "flex",
  gap: 2,
  marginBottom: -7,
  paddingLeft: 4,
  position: "relative",
  zIndex: 1,
};
const tab: React.CSSProperties = {
  padding: "2px 12px 3px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  borderBottom: "none",
  boxShadow: "inset 1px 1px 0 var(--wb-white)",
  fontSize: 12,
};
const sheet: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  padding: 10,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
};
const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
};
const nameText: React.CSSProperties = {
  fontSize: 13,
  fontWeight: "bold",
  wordBreak: "break-word",
  minWidth: 0,
};
const rule: React.CSSProperties = {
  height: 0,
  margin: "8px 0",
  borderTop: "1px solid var(--wb-gray-3)",
  borderBottom: "1px solid var(--wb-white)",
};
const fieldKey: React.CSSProperties = {
  width: 74,
  flexShrink: 0,
  color: "var(--wb-gray-3)",
};
const buttonRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 6,
};
const button: React.CSSProperties = {
  minWidth: 72,
  padding: "3px 10px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-3)",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
  cursor: "pointer",
};

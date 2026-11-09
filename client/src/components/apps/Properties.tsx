"use client";

import { useWindowStore } from "@/context/windowStore";
import { FileIcon, FolderIcon, type IconCategory } from "@/components/os/icons";
import { useIsPhone } from "@/components/os/ShellModeProvider";

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
  // Phone: the same dialog full screen, with readable type and buttons a thumb
  // can hit. The window's Back gadget closes it too, but OK and Cancel stay
  // because they're what a dialog is expected to have.
  const phone = useIsPhone();

  return (
    <div style={{ ...shell, ...(phone ? shellPhone : null) }}>
      {/* single-tab strip - the tab is decorative, but the shape is the point */}
      <div style={tabStrip}>
        <div style={{ ...tab, ...(phone ? tabPhone : null) }}>General</div>
      </div>

      <div style={sheet}>
        <div style={headerRow}>
          <span style={{ display: "inline-flex", flexShrink: 0 }}>
            {p.kind === "folder"
              ? <FolderIcon scale={3} />
              : <FileIcon category={p.iconCat ?? "blog"} scale={3} />}
          </span>
          <span style={{ ...nameText, ...(phone ? nameTextPhone : null) }}>{p.name ?? "Unknown"}</span>
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
              <span style={{ flex: 1, lineHeight: 1.45, ...(phone ? valuePhone : null) }}>{p.blurb}</span>
            </div>
          </>
        )}
      </div>

      <div style={{ ...buttonRow, ...(phone ? buttonRowPhone : null) }}>
        <button style={{ ...button, ...(phone ? buttonPhone : null) }} onClick={close}>OK</button>
        <button style={{ ...button, ...(phone ? buttonPhone : null) }} onClick={close}>Cancel</button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const phone = useIsPhone();
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
      <span style={fieldKey}>{label}:</span>
      {/* Locations are backslash paths with no spaces to break at, so on a
          phone they may wrap anywhere rather than push the sheet sideways. */}
      <span style={{ flex: 1, wordBreak: "break-word", ...(phone ? valuePhone : null) }}>{value}</span>
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
  fontSize: 13,
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
  fontSize: 13,
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
  fontSize: 14,
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
  fontSize: 13,
  color: "var(--wb-black)",
  cursor: "pointer",
};

/* ---- phone overrides: spread over the desktop objects above ----------- */
const shellPhone: React.CSSProperties = { padding: 4, fontSize: 15 };
const tabPhone: React.CSSProperties = { fontSize: 15, padding: "4px 14px 5px" };
const nameTextPhone: React.CSSProperties = { fontSize: 17 };
const valuePhone: React.CSSProperties = { minWidth: 0, overflowWrap: "anywhere" };
const buttonRowPhone: React.CSSProperties = { gap: 8 };
const buttonPhone: React.CSSProperties = { flex: 1, minHeight: 44, fontSize: 16 };

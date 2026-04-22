export default function NotFound() {
  return (
    <div
      style={{
        background: "#0000aa",
        color:      "#ffffff",
        width:      "100vw",
        height:     "100vh",
        display:    "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        padding:    "40px",
        textAlign:  "center",
        userSelect: "none",
      }}
    >
      <div style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>
        <p>A fatal exception 0E has occurred at 0028:C0011E36</p>
        <p>in VXD VMM(01) + 00010E36. The current application</p>
        <p>will be terminated.</p>
        <br />
        <p>*  Press any key to terminate the current application.</p>
        <p>*  Press CTRL+ALT+DEL to restart your computer. You will</p>
        <p>   lose any unsaved information in all applications.</p>
        <br />
        <p style={{ opacity: 0.7 }}>
          (Actual error: 404 — this page does not exist.)
        </p>
        <br />
        <p>Press any key to continue _</p>
        <br />
        <a
          href="/"
          style={{ color: "#ffffff", textDecoration: "underline", fontSize: 12 }}
        >
          ← Back to desktop
        </a>
      </div>
    </div>
  );
}

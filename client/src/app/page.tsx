export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "0.75rem",
        fontFamily: "ui-monospace, monospace",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", margin: 0 }}>Workbench 3.31</h1>
      <p style={{ opacity: 0.7, margin: 0 }}>Scaffold OK. Section 2 starts the chrome.</p>
      <p style={{ opacity: 0.4, margin: 0, fontSize: "0.8rem" }}>API: {apiUrl}</p>
    </main>
  );
}

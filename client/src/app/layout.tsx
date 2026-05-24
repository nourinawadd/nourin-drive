import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workbench 3.31 · Nourin Awad",
  description: "Amiga-style portfolio desktop.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

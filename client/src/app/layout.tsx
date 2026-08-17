import type { Metadata } from "next";
import { VT323, IBM_Plex_Mono } from "next/font/google";
import { QueryProvider } from "@/context/QueryProvider";
import "./globals.css";

const wbFont = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wb",
  display: "swap",
});

// Reading face for the Ereader's page. VT323 is a pixel font - right for window
// chrome, punishing for a chapter - so the page gets a real monospace instead.
// Mono rather than serif because a fixed grid is what makes a justified page
// read like a printed one. Self-hosted by next/font, so no runtime request.
const paperFont = IBM_Plex_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-paper",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NOURIN: · Nourin Awad",
  description: "A personal computer. Everything-Nourin, mounted as an Amiga Workbench desktop.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${wbFont.variable} ${paperFont.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

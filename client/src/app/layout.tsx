import type { Metadata } from "next";
import { VT323, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@/components/os/Analytics";
import { QueryProvider } from "@/context/QueryProvider";
import "./globals.css";

const wbFont = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wb",
  display: "swap",
});

const paperFont = IBM_Plex_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-paper",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NOURIN-DRIVE: · Nourin Awad",
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
        <Analytics />
      </body>
    </html>
  );
}
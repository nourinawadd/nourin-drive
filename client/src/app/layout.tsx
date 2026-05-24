import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";

const wbFont = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wb",
  display: "swap",
});

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
    <html lang="en" className={wbFont.variable}>
      <body>{children}</body>
    </html>
  );
}

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
const title = "NOURIN-DRIVE:";
const description = "A personal computer. Everything-Nourin, mounted as an Amiga Workbench desktop.";
const siteUrl = "https://nourin.is-a.dev";
const socialBanner = "/banner.png";

const paperFont = IBM_Plex_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-paper",
  display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "NOURIN-DRIVE:",
    type: "website",
    images: [
      {
        url: socialBanner,
        width: 1200,
        height: 630,
        alt: "NOURIN-DRIVE: social preview banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialBanner],
  },
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
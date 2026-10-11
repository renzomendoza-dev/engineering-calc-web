import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { ConversionFab } from "@/components/ConversionFab";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Engineering Tools",
  description:
    "Electrical, mechanical, acoustics, and smoke control engineering calculators, with code-referenced formulas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* pb-24 keeps the fixed unit-converter button (56px, 24px from the bottom) from
          permanently covering the last content on the page when scrolled to the end. */}
      <body className="min-h-full flex flex-col pb-24">
        <Header />
        {children}
        <ConversionFab />
      </body>
    </html>
  );
}

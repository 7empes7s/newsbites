import type { Metadata } from "next";
import Link from "next/link";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { getVerticalLabel, verticals } from "@/lib/articles";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NewsBites",
  description: "A fast, editorial-first news prototype for TechInsiderBytes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <body>
        <div className="site-frame">
          <header className="site-header">
            <Link className="brand-mark" href="/">
              <span className="brand-tag">TechInsiderBytes</span>
              <span className="brand-name">NewsBites</span>
            </Link>
            <nav className="main-nav">
              {verticals.map((vertical) => (
                <Link key={vertical} href={`/category/${vertical}`}>
                  {getVerticalLabel(vertical)}
                </Link>
              ))}
              <Link href="/about">About</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

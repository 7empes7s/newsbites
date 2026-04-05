import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { getVerticalLabel, verticals } from "@/lib/article-taxonomy";
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
  description:
    "Simple news with an editorial pulse. NewsBites turns complex stories into sharp, readable briefings across AI, finance, global politics, and trends.",
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
        <div className="site-backdrop" aria-hidden="true">
          <div className="site-orb site-orb-left" />
          <div className="site-orb site-orb-right" />
          <div className="site-gridline" />
        </div>
        <div className="site-frame">
          <header className="site-header">
            <Link className="brand-mark" href="/">
              <Image
                src="/brand-assets/ProfessionalLogo.png"
                alt="TechInsiderBytes NewsBites"
                width={180}
                height={98}
                className="brand-logo"
                priority
              />
              <span className="brand-copy">
                <span className="brand-tag">TechInsiderBytes</span>
                <span className="brand-name">NewsBites</span>
              </span>
            </Link>
            <nav className="main-nav">
              <Link href="/">News</Link>
              <Link href="/#edition">Edition</Link>
              <Link href="/app">App</Link>
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

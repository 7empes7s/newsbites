import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { getAllGroups } from "@/lib/articles";
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
    "Simple news with an editorial pulse. NewsBites turns complex stories into sharp, readable briefings across technology, business, politics, culture, sport, and more.",
  metadataBase: new URL("https://news.techinsiderbytes.com"),
  alternates: {
    types: { "application/rss+xml": "https://news.techinsiderbytes.com/feed.xml" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const groups = getAllGroups();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NewsBites — TechInsiderBytes",
    url: "https://news.techinsiderbytes.com",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: "https://news.techinsiderbytes.com/search?q={search_term_string}" },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>
        <div className="site-backdrop" aria-hidden="true">
          <div className="site-orb site-orb-left" />
          <div className="site-orb site-orb-right" />
          <div className="site-gridline" />
        </div>
        <SiteChrome groups={groups}>{children}</SiteChrome>
      </body>
    </html>
  );
}

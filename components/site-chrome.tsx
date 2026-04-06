"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getVerticalLabel } from "@/lib/article-taxonomy";
import { SiteFooter } from "@/components/site-footer";

export function SiteChrome({
  children,
  verticals = [],
}: {
  children: React.ReactNode;
  verticals?: string[];
}) {
  const pathname = usePathname();
  const isReaderApp = pathname === "/app";

  useEffect(() => {
    document.body.classList.toggle("reader-app-mode", isReaderApp);

    return () => {
      document.body.classList.remove("reader-app-mode");
    };
  }, [isReaderApp]);

  return (
    <div className={isReaderApp ? "site-frame site-frame-app" : "site-frame"}>
      {!isReaderApp ? (
        <>
          <header className="site-header">
            <Link className="brand-mark" href="/">
              <span className="brand-emblem" aria-hidden="true">
                NB
              </span>
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
          <nav className="mobile-nav-strip" aria-label="Quick navigation">
            <Link className="mobile-nav-pill mobile-nav-pill-accent" href="/app">
              Open app
            </Link>
            {verticals.map((vertical) => (
              <Link
                key={vertical}
                className="mobile-nav-pill"
                href={`/category/${vertical}`}
              >
                {getVerticalLabel(vertical)}
              </Link>
            ))}
          </nav>
        </>
      ) : null}
      {children}
      {!isReaderApp ? <SiteFooter /> : null}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getVerticalLabel, verticals } from "@/lib/article-taxonomy";

export function SiteChrome({ children }: { children: React.ReactNode }) {
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
      ) : null}
      {children}
    </div>
  );
}

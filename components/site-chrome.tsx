"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getGroupLabel, type Group } from "@/lib/article-taxonomy";
import { SiteFooter } from "@/components/site-footer";

export function SiteChrome({
  children,
  groups = [],
}: {
  children: React.ReactNode;
  groups?: Group[];
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
              <Link href="/finance">Finance</Link>
              {groups.map((group) => (
                <Link key={group} href={`/group/${group}`}>
                  {getGroupLabel(group)}
                </Link>
              ))}
              <Link href="/about">About</Link>
            </nav>
          </header>
          <nav className="mobile-nav-strip" aria-label="Quick navigation">
            <Link className="mobile-nav-pill mobile-nav-pill-accent" href="/app">
              Open app
            </Link>
            <Link className="mobile-nav-pill" href="/finance">
              Finance
            </Link>
            {groups.map((group) => (
              <Link
                key={group}
                className="mobile-nav-pill"
                href={`/group/${group}`}
              >
                {getGroupLabel(group)}
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

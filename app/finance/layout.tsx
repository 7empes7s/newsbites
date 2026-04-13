"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function FinanceNav() {
  const pathname = usePathname();
  const navItems = [
    { href: '/finance', label: 'Dashboard' },
    { href: '/finance/market', label: 'Market' },
    { href: '/finance/charts', label: 'Charts' },
    { href: '/finance/insights', label: 'Insights' },
    { href: '/finance/portfolio', label: 'Portfolio' },
    { href: '/finance/alerts', label: 'Alerts' },
  ];
  const isActive = (href: string) => pathname === href;

  return (
    <nav className="finance-nav">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`finance-nav-pill ${isActive(item.href) ? 'finance-nav-pill-active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="finance-frame">
      <header className="finance-header">
        <Link href="/" className="finance-brand">
          <span className="finance-brand-mark">FI</span>
          <span className="finance-brand-text">Finance Insights</span>
        </Link>
        <FinanceNav />
        <Link href="/" className="finance-back-link">
          ← Back to NewsBites
        </Link>
      </header>
      
      <main className="finance-main">
        {children}
      </main>

      <footer className="finance-footer">
        <p className="finance-footer-brand">TechInsiderBytes</p>
        <p className="finance-footer-tagline">Stay with the signal.</p>
      </footer>
    </div>
  );
}

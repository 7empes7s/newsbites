import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sports Intelligence — NewsBites",
  description: "Live standings, fixtures, predictions, and AI analysis for football, basketball, F1, and more.",
};

export default function SportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sports-dashboard">
      <header className="sports-header">
        <div className="sports-header-inner site-frame">
          <a href="/sports" className="sports-brand">
            <span className="sports-brand-icon">⚽</span>
            <span className="sports-brand-text">Sports Intelligence</span>
          </a>
          <nav className="sports-nav">
            <a href="/sports" className="sports-nav-link active">Dashboard</a>
            <a href="/category/sports" className="sports-nav-link">Articles</a>
            {["CL", "PL", "PD", "SA", "BL1"].map(code => (
              <a key={code} href={`/sports/${code}`} className="sports-nav-link">{code}</a>
            ))}
          </nav>
        </div>
      </header>
      <main className="sports-main site-frame">
        {children}
      </main>
    </div>
  );
}
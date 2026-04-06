import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="page-shell">
      <section className="about-page">
        <div className="about-copy-stack">
          <p className="about-kicker">About NewsBites</p>
          <h1>Readable briefings first. Better editorial flow everywhere else.</h1>
          <p className="about-copy">
            NewsBites is the first editorial product in the TechInsiderBytes
            stack. The format is intentionally narrow: strong headlines, fast
            summaries, and clear category lanes for AI, finance, global
            politics, and trends.
          </p>
          <p className="about-copy">
            The homepage remains the direct news surface. The dedicated app adds
            category jumps, randomized exploration, and scroll-first article
            reading without changing the underlying editorial feed.
          </p>
          <div className="about-principles">
            <div className="about-principle">
              <p className="article-meta">Principle 01</p>
              <h2>Less noise</h2>
              <p className="about-copy">
                Every page should make scanning easier, not more decorative.
              </p>
            </div>
            <div className="about-principle">
              <p className="article-meta">Principle 02</p>
              <h2>One reading rhythm</h2>
              <p className="about-copy">
                Homepage, lanes, and reader mode should feel related rather than
                like separate products.
              </p>
            </div>
            <div className="about-principle">
              <p className="article-meta">Principle 03</p>
              <h2>Mobile first</h2>
              <p className="about-copy">
                The experience is designed to stay sharp when read quickly on a
                phone, not only on a wide desktop monitor.
              </p>
            </div>
          </div>
        </div>
        <aside className="about-callout">
          <p className="about-kicker">Current Direction</p>
          <p>
            Unified editorial branding, cleaner action buttons, meaningful
            motion, and strong mobile behavior before visual excess.
          </p>
          <div className="about-callout-list">
            <div>
              <p className="article-meta">Surface</p>
              <p>Poster-style homepage with strong lead-story hierarchy.</p>
            </div>
            <div>
              <p className="article-meta">Reader</p>
              <p>Article-by-article motion and category filtering in one calm shell.</p>
            </div>
            <div>
              <p className="article-meta">Publishing</p>
              <p>Approval-first editorial workflow before any wider automation.</p>
            </div>
          </div>
          <div className="hero-actions">
            <Link className="primary-link" href="/app">
              Open reader app
            </Link>
            <Link className="secondary-link secondary-link-light" href="/">
              Back to edition
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

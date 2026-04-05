export default function AboutPage() {
  return (
    <main className="page-shell">
      <section className="about-page">
        <div>
          <p className="about-kicker">About NewsBites</p>
          <h1>Readable briefings up front, richer motion and discovery in the app.</h1>
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
        </div>
        <aside className="about-callout">
          <p>
            Design direction: unified editorial branding, cleaner action
            buttons, meaningful motion, and strong mobile behavior before visual
            excess.
          </p>
        </aside>
      </section>
    </main>
  );
}

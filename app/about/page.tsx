export default function AboutPage() {
  return (
    <main className="page-shell">
      <section className="about-page">
        <div>
          <p className="about-kicker">About NewsBites</p>
          <h1>Readable briefings for people who want signal without sludge.</h1>
          <p className="about-copy">
            NewsBites is the first editorial product in the TechInsiderBytes
            stack. The format is intentionally narrow: strong headlines, fast
            summaries, and clear category lanes for AI, finance, global
            politics, and trends.
          </p>
          <p className="about-copy">
            The initial publishing loop is approval-first. Articles are drafted
            with AI assistance, reviewed manually, and only then promoted to the
            live site.
          </p>
        </div>
        <aside className="about-callout">
          <p>
            Design direction: headline-first, editorial serif for emphasis, deep
            navy structure, amber accents, and mobile scanning before ornament.
          </p>
        </aside>
      </section>
    </main>
  );
}

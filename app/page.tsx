import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import {
  getFeaturedArticle,
  getLatestArticles,
  getVerticalLabel,
  getVerticalPreview,
  verticals,
} from "@/lib/articles";

export default function Home() {
  const featured = getFeaturedArticle();
  const latestStories = getLatestArticles(4).filter(
    (article) => article.slug !== featured?.slug,
  );

  return (
    <main className="page-shell">
      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Simple News, Built For Fast Reading</p>
          <h1>
            NewsBites turns dense headlines into sharp, readable briefings.
          </h1>
          <p className="lede">
            Editorial presentation, fast scanning, and a deliberate separation
            between serious reporting and lighter trend coverage.
          </p>
          <div className="chip-row">
            {verticals.map((vertical) => (
              <Link key={vertical} className="chip" href={`/category/${vertical}`}>
                {getVerticalLabel(vertical)}
              </Link>
            ))}
          </div>
        </div>

        {featured ? (
          <article className="hero-story">
            <p className="story-kicker">Lead Story</p>
            <p className="story-meta">
              {getVerticalLabel(featured.vertical)} • {featured.dateLabel} •{" "}
              {featured.readingTime}
            </p>
            <h2>{featured.title}</h2>
            <p>{featured.lead}</p>
            <Link className="primary-link" href={`/articles/${featured.slug}`}>
              Read the lead story
            </Link>
          </article>
        ) : null}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Latest Stories</h2>
          <Link href="/about">About NewsBites</Link>
        </div>
        <div className="headline-ribbon">
          <span>Operator note</span>
          <p>
            Approval-first publishing is still in effect. This shell is designed
            for fast reading on mobile before any wider automation is enabled.
          </p>
        </div>
        <div className="story-grid">
          {latestStories.map((article, index) => (
            <ArticleCard
              key={article.slug}
              article={article}
              compact={index > 1}
            />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Category Radar</h2>
          <span className="section-note">
            Four lanes. Clear separation. No dashboard clutter.
          </span>
        </div>
        <div className="vertical-grid">
          {verticals.map((vertical) => {
            const preview = getVerticalPreview(vertical, 2);

            return (
              <section key={vertical} className="vertical-lane">
                <div className="lane-header">
                  <div>
                    <p className="article-meta">Vertical</p>
                    <h3>{getVerticalLabel(vertical)}</h3>
                  </div>
                  <Link className="lane-link" href={`/category/${vertical}`}>
                    Open lane
                  </Link>
                </div>
                <div className="lane-stack">
                  {preview.length ? (
                    preview.map((article) => (
                      <ArticleCard
                        key={article.slug}
                        article={article}
                        compact
                      />
                    ))
                  ) : (
                    <p className="empty-state">
                      No approved stories yet. This lane is ready for the first
                      brief.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

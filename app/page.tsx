import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { getVerticalLabel } from "@/lib/article-taxonomy";
import {
  getAllVerticals,
  getFeaturedArticle,
  getLatestArticles,
  getVerticalPreview,
} from "@/lib/articles";

export default function Home() {
  const featured = getFeaturedArticle();
  const latestStories = getLatestArticles(4).filter(
    (article) => article.slug !== featured?.slug,
  );
  const verticals = getAllVerticals();

  return (
    <main className="page-shell">
      <section className="hero-poster">
        <div className="hero-poster-copy">
          <p className="eyebrow">Simple News Approach</p>
          <p className="hero-brand">NewsBites</p>
          <h1>Big stories, stripped to the signal.</h1>
          <p className="lede">
            An editorial-first daily report built for fast comprehension:
            cleaner hierarchy, fewer distractions, and article flows that stay
            readable on every screen.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" href="/app">
              Enter reader app
            </Link>
            <Link className="secondary-link secondary-link-light" href="/app?random=1">
              Start anywhere
            </Link>
          </div>
        </div>

        <div className="hero-poster-aside">
          <div className="hero-edition">
            <p className="story-kicker">Current Edition</p>
            <p className="hero-edition-date">April briefing set</p>
            <p className="hero-edition-copy">
              Four lanes. One reading rhythm. Every story can move from glance
              to deep read without changing products.
            </p>
          </div>

          <div className="chip-row">
            {verticals.map((vertical) => (
              <Link
                key={vertical}
                className="chip chip-ghost"
                href={`/category/${vertical}`}
              >
                {getVerticalLabel(vertical)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-grid" id="edition">
        {featured ? (
          <article className="hero-story">
            <p className="story-kicker">Lead Story</p>
            <p className="story-meta">
              {getVerticalLabel(featured.vertical)} • {featured.dateLabel} •{" "}
              {featured.readingTime}
            </p>
            <h2>{featured.title}</h2>
            <p>{featured.lead}</p>
            <div className="hero-story-actions">
              <Link className="primary-link" href={`/articles/${featured.slug}`}>
                Read article
              </Link>
              <Link className="secondary-link secondary-link-inverse" href={`/app?article=${featured.slug}`}>
                Read in app
              </Link>
            </div>
          </article>
        ) : null}

        <div className="hero-copy hero-copy-side">
          <p className="eyebrow">How It Reads</p>
          <h2>Homepage for triage. App for focus.</h2>
          <p className="lede">
            The front page stays sharp and skimmable while the reader app
            handles article-by-article immersion, category jumps, and random
            discovery.
          </p>
          <div className="headline-stack">
            <div>
              <p className="article-meta">Surface</p>
              <p className="headline-stack-copy">Poster-like lead story and crisp lane overviews.</p>
            </div>
            <div>
              <p className="article-meta">Reader</p>
              <p className="headline-stack-copy">Snap navigation with a single active article at a time.</p>
            </div>
            <div>
              <p className="article-meta">Pace</p>
              <p className="headline-stack-copy">Brief enough to scan, structured enough to trust.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Latest Stories</h2>
          <Link href="/app">Launch reading app</Link>
        </div>
        <div className="headline-ribbon">
          <span>Reading mode</span>
          <p>
            Use the app for category jumps, random discovery, and scroll-snapped
            article navigation without leaving the main product surface behind.
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

      <section className="section-block section-block-cta">
        <div className="section-heading">
          <h2>Built For Repeat Reading</h2>
          <span className="section-note">Designed for daily use, not one-off clicks.</span>
        </div>
        <div className="cta-band">
          <p>
            NewsBites is being prepared as a disciplined editorial product:
            clearer categories, stronger motion cues, and a calmer information
            hierarchy before the publishing pipeline scales.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" href="/app">
              Open app mode
            </Link>
            <Link className="secondary-link" href="/about">
              Read the brief
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

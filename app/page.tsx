import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { getGroupLabel, getVerticalLabel } from "@/lib/article-taxonomy";
import {
  getAllGroups,
  getFeaturedArticle,
  getGroupPreview,
  getLatestArticles,
} from "@/lib/articles";

export default function Home() {
  const featured = getFeaturedArticle();
  const latestStories = getLatestArticles(4).filter(
    (article) => article.slug !== featured?.slug,
  );
  const groups = getAllGroups();

  return (
    <main className="page-shell">
      <section className="hero-poster">
        <div className="hero-poster-copy">
          <p className="eyebrow">Daily briefing</p>
          <p className="hero-brand">NewsBites</p>
          <h1>Big stories, stripped to the signal.</h1>
          <p className="lede">
            News that respects your time. Core beats, new lanes, and only the
            stories that clear the editorial bar.
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
            <p className="story-kicker">Live now</p>
            <p className="hero-edition-date">April 2026</p>
            <p className="hero-edition-copy">
              Fresh briefings move live as they clear research, verification,
              and approval.
            </p>
          </div>

          <div className="chip-row">
            {groups.map((group) => (
              <Link
                key={group}
                className="chip chip-ghost"
                href={`/group/${group}`}
              >
                {getGroupLabel(group)}
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
          <p className="eyebrow">Two views</p>
          <h2>Skim here. Read deep in the app.</h2>
          <p className="lede">
            The homepage shows you what is worth your time. The app lets you
            sit with it — one story at a time, no distractions.
          </p>
          <div className="headline-stack">
            <div>
              <p className="article-meta">Here</p>
              <p className="headline-stack-copy">Lead story, every active lane, latest in one scan.</p>
            </div>
            <div>
              <p className="article-meta">App</p>
              <p className="headline-stack-copy">One article at a time. Swipe or scroll between them.</p>
            </div>
            <div>
              <p className="article-meta">Reads</p>
              <p className="headline-stack-copy">Three minutes or less. No filler, no follow-up bait.</p>
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
          <span>In the app</span>
          <p>
            Jump between beats, hit the surprise button for something random, or work
            through a category from newest to oldest.
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
            Active lanes update from the editorial feed.
          </span>
        </div>
        <div className="vertical-grid">
          {groups.map((group) => {
            const preview = getGroupPreview(group, 2);

            return (
              <section key={group} className="vertical-lane">
                <div className="lane-header">
                  <div>
                    <p className="article-meta">Beat</p>
                    <h3>{getGroupLabel(group)}</h3>
                  </div>
                  <Link className="lane-link" href={`/group/${group}`}>
                    All stories
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
          <h2>Worth coming back to</h2>
          <span className="section-note">Not a feed. Not a dashboard.</span>
        </div>
        <div className="cta-band">
          <p>
            NewsBites keeps a short list: stories worth reading, edited tightly,
            published as they are ready. No infinite scroll, no engagement traps,
            no 47 tabs.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" href="/app">
              Read in the app
            </Link>
            <Link className="secondary-link" href="/about">
              About
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

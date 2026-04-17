import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/article-card";

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = normalizeQuery(q);
  const articles = getAllArticles();

  const results = query
    ? articles.filter((article) => {
        const haystack = [
          article.title,
          article.lead,
          article.digest,
          article.previewText,
          article.vertical,
          ...(article.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
    : [];

  return (
    <main className="page-shell">
      <section className="section-block section-block-lane">
        <div className="lane-hero">
          <div className="lane-hero-copy">
            <p className="eyebrow">Search</p>
            <h1>Find a story</h1>
            <p className="about-copy">
              Search published NewsBites stories by title, lead, beat, or tag.
            </p>
          </div>
          <div className="lane-hero-actions">
            <Link className="primary-link" href="/app">
              Open reader app
            </Link>
            <Link className="secondary-link" href="/">
              Back to edition
            </Link>
          </div>
        </div>

        <form className="search-form" action="/search" method="get">
          <input
            aria-label="Search articles"
            className="nb-search-input"
            defaultValue={q}
            name="q"
            placeholder="Search titles, tags, and summaries"
            type="search"
          />
        </form>

        {query ? (
          results.length > 0 ? (
            <div className="story-grid">
              {results.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <p className="empty-state">No stories matched “{q}”.</p>
          )
        ) : (
          <p className="empty-state">Enter a search term to browse published stories.</p>
        )}
      </section>
    </main>
  );
}

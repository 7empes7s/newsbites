import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/article-card";
import {
  getGroupLabel,
  getVerticalLabel,
  isGroup,
  type Group,
} from "@/lib/article-taxonomy";
import {
  getAllGroups,
  getArticlesByGroup,
  getVerticalsInGroup,
} from "@/lib/articles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}): Promise<Metadata> {
  const { group } = await params;
  const label = getGroupLabel(group as Group);
  return {
    title: `${label} | NewsBites`,
    description: `Latest stories in ${label}. NewsBites covers technology, finance, world, science, wellness, and culture with sharp, readable briefings.`,
  };
}

export function generateStaticParams() {
  return getAllGroups().map((group) => ({ group }));
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;

  if (!isGroup(group)) {
    notFound();
  }

  const activeGroup: Group = group;
  const availableGroups = getAllGroups();
  if (!availableGroups.includes(activeGroup)) {
    notFound();
  }

  const articles = getArticlesByGroup(activeGroup);
  const childVerticals = getVerticalsInGroup(activeGroup);

  return (
    <main className="page-shell">
      <section className="section-block section-block-lane">
        <div className="lane-hero">
          <div className="lane-hero-copy">
            <p className="eyebrow">Beat Group</p>
            <h1>{getGroupLabel(activeGroup)}</h1>
            <p className="about-copy">
              One group for several related beats. Drill into a specific
              vertical below, or scan every story in the group.
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
        {childVerticals.length > 1 ? (
          <div className="chip-row">
            {childVerticals.map((vertical) => (
              <Link
                key={vertical}
                className="chip chip-ghost"
                href={`/category/${vertical}`}
              >
                {getVerticalLabel(vertical)}
              </Link>
            ))}
          </div>
        ) : null}
        {articles.length ? (
          <div className="story-grid">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <p className="empty-state">No published stories in this group yet.</p>
        )}
      </section>
    </main>
  );
}

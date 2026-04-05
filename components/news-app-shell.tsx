"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getVerticalLabel, verticals, type Vertical } from "@/lib/article-taxonomy";
import type { Article } from "@/lib/articles";

type AppArticle = Pick<
  Article,
  | "author"
  | "dateLabel"
  | "lead"
  | "previewText"
  | "readingTime"
  | "slug"
  | "tags"
  | "title"
  | "vertical"
>;

type FilterValue = Vertical | "all";

const filterOptions: FilterValue[] = ["all", ...verticals];

function isVertical(value: string | null): value is Vertical {
  return Boolean(value && verticals.includes(value as Vertical));
}

function getInitialState(
  articles: AppArticle[],
  queryVertical: string | null,
  queryArticle: string | null,
  wantsRandom: boolean,
) {
  const nextFilter: FilterValue = isVertical(queryVertical) ? queryVertical : "all";
  const nextVisible =
    nextFilter === "all"
      ? articles
      : articles.filter((article) => article.vertical === nextFilter);
  const nextArticle =
    nextVisible.find((article) => article.slug === queryArticle) ??
    (wantsRandom
      ? nextVisible[Math.floor(Math.random() * nextVisible.length)]
      : nextVisible[0]) ??
    articles[0];

  return {
    activeFilter: nextFilter,
    activeSlug: nextArticle?.slug ?? "",
  };
}

export function NewsAppShell({
  articles,
  initialQuery,
}: {
  articles: AppArticle[];
  initialQuery: {
    article?: string;
    random?: string;
    vertical?: string;
  };
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const articleRefs = useRef<(HTMLElement | null)[]>([]);
  const [{ activeFilter, activeSlug }, setReaderState] = useState(() =>
    getInitialState(
      articles,
      initialQuery.vertical ?? null,
      initialQuery.article ?? null,
      initialQuery.random === "1",
    ),
  );

  const visibleArticles =
    activeFilter === "all"
      ? articles
      : articles.filter((article) => article.vertical === activeFilter);

  const activeIndex = Math.max(
    0,
    visibleArticles.findIndex((article) => article.slug === activeSlug),
  );

  const syncUrl = (nextFilter: FilterValue, nextSlug: string) => {
    const nextParams = new URLSearchParams();

    if (nextFilter !== "all") {
      nextParams.set("vertical", nextFilter);
    }

    if (nextSlug) {
      nextParams.set("article", nextSlug);
    }

    const query = nextParams.toString();
    const nextUrl = query ? `/app?${query}` : "/app";
    window.history.replaceState(null, "", nextUrl);
  };

  const scrollToArticle = (slug: string, behavior: ScrollBehavior = "smooth") => {
    const index = visibleArticles.findIndex((article) => article.slug === slug);

    if (index < 0) {
      return;
    }

    setReaderState((current) => ({ ...current, activeSlug: slug }));
    articleRefs.current[index]?.scrollIntoView({
      behavior,
      block: "start",
    });
    syncUrl(activeFilter, slug);
  };

  useEffect(() => {
    articleRefs.current[activeIndex]?.scrollIntoView({
      behavior: "auto",
      block: "start",
    });
  }, [activeIndex]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const nextActive =
        visibleArticles.find((article, index) => {
          const node = articleRefs.current[index];

          if (!node) {
            return false;
          }

          const topOffset = Math.abs(node.offsetTop - container.scrollTop);
          return topOffset < node.clientHeight * 0.45;
        }) ?? visibleArticles[0];

      if (nextActive && nextActive.slug !== activeSlug) {
        setReaderState((current) => ({ ...current, activeSlug: nextActive.slug }));
        syncUrl(activeFilter, nextActive.slug);
      }
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [activeFilter, activeSlug, visibleArticles]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }

      event.preventDefault();

      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = Math.min(
        visibleArticles.length - 1,
        Math.max(0, activeIndex + delta),
      );
      const nextArticle = visibleArticles[nextIndex];

      if (nextArticle) {
        const node = articleRefs.current[nextIndex];

        setReaderState((current) => ({ ...current, activeSlug: nextArticle.slug }));
        node?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        syncUrl(activeFilter, nextArticle.slug);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeFilter, activeIndex, visibleArticles]);

  const setFilter = (nextFilter: FilterValue) => {
    startTransition(() => {
      const nextVisible =
        nextFilter === "all"
          ? articles
          : articles.filter((article) => article.vertical === nextFilter);
      const firstArticle = nextVisible[0];

      if (!firstArticle) {
        syncUrl(nextFilter, "");
        setReaderState({
          activeFilter: nextFilter,
          activeSlug: "",
        });
        return;
      }

      setReaderState({
        activeFilter: nextFilter,
        activeSlug: firstArticle.slug,
      });
      requestAnimationFrame(() => {
        articleRefs.current[0]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        syncUrl(nextFilter, firstArticle.slug);
      });
    });
  };

  const jumpRandom = () => {
    if (!visibleArticles.length) {
      return;
    }

    const candidates = visibleArticles.filter((article) => article.slug !== activeSlug);
    const pool = candidates.length ? candidates : visibleArticles;
    const nextArticle = pool[Math.floor(Math.random() * pool.length)];

    if (nextArticle) {
      scrollToArticle(nextArticle.slug);
    }
  };

  const activeArticle = visibleArticles[activeIndex] ?? visibleArticles[0];

  return (
    <section className="app-shell">
      <div className="app-stage">
        <div className="app-stage-copy">
          <p className="eyebrow">Reader App</p>
          <h1>Navigate by category. Swipe or scroll to move article by article.</h1>
          <p className="lede">
            The app turns the same editorial feed into a calmer reading mode
            with bolder motion cues, fast random discovery, and a single clear
            article focus at a time.
          </p>
          <div className="app-actions">
            <button className="primary-link button-reset" type="button" onClick={jumpRandom}>
              Random article
            </button>
            <Link className="secondary-link" href={activeArticle ? `/articles/${activeArticle.slug}` : "/"}>
              Open full article page
            </Link>
          </div>
        </div>
        <div className="app-stage-brand">
          <Image
            src="/brand-assets/ProLogoWhite.png"
            alt="NewsBites app mark"
            width={220}
            height={120}
            className="app-stage-logo"
            priority
          />
          <p>
            Scroll snaps, directional controls, and category jumps are all tied
            to the same live article set.
          </p>
        </div>
      </div>

      <div className="app-toolbar">
        <div className="filter-row">
          {filterOptions.map((option) => {
            const label = option === "all" ? "All" : getVerticalLabel(option);

            return (
              <button
                key={option}
                className={option === activeFilter ? "filter-chip is-active" : "filter-chip"}
                type="button"
                onClick={() => setFilter(option)}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="reader-meta">
          <span>
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(visibleArticles.length).padStart(2, "0")}
          </span>
          <span>{activeArticle ? getVerticalLabel(activeArticle.vertical) : "No articles"}</span>
        </div>
      </div>

      <div className="reader-layout">
        <aside className="reader-rail">
          <p className="article-meta">Now reading</p>
          <h2>{activeArticle?.title ?? "No article available"}</h2>
          <p>{activeArticle?.lead ?? "Add approved stories to populate the app experience."}</p>
          <div className="reader-rail-actions">
            <button
              className="nav-button"
              type="button"
              onClick={() => {
                const previousArticle = visibleArticles[activeIndex - 1];

                if (previousArticle) {
                  scrollToArticle(previousArticle.slug);
                }
              }}
              disabled={activeIndex <= 0}
            >
              Previous
            </button>
            <button
              className="nav-button"
              type="button"
              onClick={() => {
                const nextArticle = visibleArticles[activeIndex + 1];

                if (nextArticle) {
                  scrollToArticle(nextArticle.slug);
                }
              }}
              disabled={activeIndex >= visibleArticles.length - 1}
            >
              Next
            </button>
          </div>
          <div className="reader-progress-track" aria-hidden="true">
            <span
              className="reader-progress-fill"
              style={{
                transform: `scaleY(${visibleArticles.length ? (activeIndex + 1) / visibleArticles.length : 0})`,
              }}
            />
          </div>
        </aside>

        <div className="scroll-deck" ref={containerRef}>
          {visibleArticles.map((article, index) => (
            <article
              key={article.slug}
              ref={(node) => {
                articleRefs.current[index] = node;
              }}
              className={article.slug === activeArticle?.slug ? "app-card is-active" : "app-card"}
            >
              <div className="app-card-copy">
                <p className="article-meta">
                  {getVerticalLabel(article.vertical)} • {article.dateLabel} •{" "}
                  {article.readingTime}
                </p>
                <h2>{article.title}</h2>
                <p className="app-card-lead">{article.lead}</p>
                <p>{article.previewText}</p>
              </div>
              <div className="app-card-footer">
                <div className="tag-row">
                  {article.tags.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="app-card-actions">
                  <Link className="primary-link" href={`/articles/${article.slug}`}>
                    Read article
                  </Link>
                  <button
                    className="secondary-link button-reset"
                    type="button"
                    onClick={jumpRandom}
                  >
                    Surprise me
                  </button>
                </div>
              </div>
              <p className="app-card-author">By {article.author}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

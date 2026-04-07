"use client";

import { startTransition, useEffect, useRef, useState, type TouchEvent } from "react";
import Link from "next/link";
import { getVerticalLabel, type Vertical } from "@/lib/article-taxonomy";
import type { Article } from "@/lib/articles";

type AppArticle = Pick<
  Article,
  | "author"
  | "appDigest"
  | "dateLabel"
  | "lead"
  | "readingTime"
  | "slug"
  | "tags"
  | "title"
  | "vertical"
>;

type FilterValue = Vertical | "all" | "favorites";
type ReaderMode = "focus" | "flow";
type FlowEntry = {
  article: AppArticle;
  cycle: number;
  key: string;
};

const FAV_KEY = "newsbites-favorites";

function isVertical(value: string | null, verticals: Vertical[]): value is Vertical {
  return Boolean(value && verticals.includes(value as Vertical));
}

function getInitialMode(value: string | null): ReaderMode {
  return value === "flow" ? "flow" : "focus";
}

function getOrderedArticles(articles: AppArticle[], startSlug: string) {
  if (!articles.length) return [];
  const startIndex = Math.max(0, articles.findIndex((a) => a.slug === startSlug));
  return [...articles.slice(startIndex), ...articles.slice(0, startIndex)];
}

function buildFlowEntries(
  articles: AppArticle[],
  startSlug: string,
  cycleStart: number,
  cycleCount: number,
): FlowEntry[] {
  const orderedArticles = getOrderedArticles(articles, startSlug);
  return Array.from({ length: cycleCount }, (_, cycleOffset) => {
    const cycle = cycleStart + cycleOffset;
    return orderedArticles.map((article, articleIndex) => ({
      article,
      cycle,
      key: `${article.slug}-${cycle}-${articleIndex}`,
    }));
  }).flat();
}

function getInitialState(
  articles: AppArticle[],
  queryVertical: string | null,
  queryArticle: string | null,
  queryMode: string | null,
  wantsRandom: boolean,
  verticals: Vertical[],
) {
  const nextFilter: FilterValue = isVertical(queryVertical, verticals)
    ? queryVertical
    : queryVertical === "favorites"
    ? "favorites"
    : "all";

  const nextVisible =
    nextFilter === "all" || nextFilter === "favorites"
      ? articles
      : articles.filter((a) => a.vertical === nextFilter);

  const nextArticle =
    nextVisible.find((a) => a.slug === queryArticle) ??
    (wantsRandom ? nextVisible[Math.floor(Math.random() * nextVisible.length)] : nextVisible[0]) ??
    articles[0];

  return {
    activeFilter: nextFilter,
    activeSlug: nextArticle?.slug ?? "",
    mode: getInitialMode(queryMode),
  };
}

export function NewsAppShell({
  articles,
  initialQuery,
  verticals,
}: {
  articles: AppArticle[];
  initialQuery: { article?: string; mode?: string; random?: string; vertical?: string };
  verticals: Vertical[];
}) {
  const appShellRef = useRef<HTMLElement | null>(null);
  const [{ activeFilter, activeSlug, mode }, setReaderState] = useState(() =>
    getInitialState(
      articles,
      initialQuery.vertical ?? null,
      initialQuery.article ?? null,
      initialQuery.mode ?? null,
      initialQuery.random === "1",
      verticals,
    ),
  );
  const flowFeedRef = useRef<HTMLDivElement | null>(null);
  const [flowEntries, setFlowEntries] = useState<FlowEntry[]>([]);
  const [flowIndex, setFlowIndex] = useState(0);
  const [isFlowAnimating, setIsFlowAnimating] = useState(false);
  const [flowViewportHeight, setFlowViewportHeight] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const wheelLockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  const filterOptions: FilterValue[] = ["all", "favorites", ...verticals];
  const isFlowMode = mode === "flow";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAV_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored) as string[]));
    } catch { /* ignore */ }
  }, []);

  const toggleFavorite = (slug: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      try { localStorage.setItem(FAV_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const visibleArticles =
    activeFilter === "all"
      ? articles
      : activeFilter === "favorites"
      ? articles.filter((a) => favorites.has(a.slug))
      : articles.filter((a) => a.vertical === activeFilter);

  const searchedArticles = searchQuery.trim()
    ? visibleArticles.filter((a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.appDigest.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.appDigest.nutshell.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : visibleArticles;

  const displayArticles = searchOpen && searchQuery.trim() ? searchedArticles : visibleArticles;

  const activeIndex = Math.max(0, displayArticles.findIndex((a) => a.slug === activeSlug));

  const syncUrl = (nextFilter: FilterValue, nextSlug: string, nextMode: ReaderMode) => {
    const p = new URLSearchParams();
    if (nextFilter !== "all") p.set("vertical", nextFilter);
    if (nextMode === "flow") p.set("mode", "flow");
    if (nextSlug) p.set("article", nextSlug);
    const q = p.toString();
    window.history.replaceState(null, "", q ? `/app?${q}` : "/app");
  };

  const setActiveArticle = (slug: string, nextMode?: ReaderMode) => {
    const resolvedMode = nextMode ?? mode;
    setReaderState((c) => ({ ...c, activeSlug: slug, mode: resolvedMode }));
    syncUrl(activeFilter, slug, resolvedMode);
  };

  const setFilter = (nextFilter: FilterValue) => {
    startTransition(() => {
      const nextVisible =
        nextFilter === "all"
          ? articles
          : nextFilter === "favorites"
          ? articles.filter((a) => favorites.has(a.slug))
          : articles.filter((a) => a.vertical === nextFilter);
      const first = nextVisible[0];
      if (!first) {
        syncUrl(nextFilter, "", mode);
        setReaderState({ activeFilter: nextFilter, activeSlug: "", mode });
        return;
      }
      setReaderState({ activeFilter: nextFilter, activeSlug: first.slug, mode });
      syncUrl(nextFilter, first.slug, mode);
    });
  };

  const jumpRandom = () => {
    if (!displayArticles.length) return;
    const candidates = displayArticles.filter((a) => a.slug !== activeSlug);
    const pool = candidates.length ? candidates : displayArticles;
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (next) setActiveArticle(next.slug);
  };

  const activeArticle = displayArticles[activeIndex] ?? displayArticles[0];
  const previousArticle = displayArticles[activeIndex - 1];
  const nextArticleItem = displayArticles[activeIndex + 1];

  const setMode = (nextMode: ReaderMode) => {
    setReaderState((c) => ({ ...c, mode: nextMode }));
    setMenuOpen(false);
    setSearchOpen(false);
    syncUrl(activeFilter, activeArticle?.slug ?? "", nextMode);
  };

  const isFav = (slug: string) => favorites.has(slug);

  const filterLabel = (option: FilterValue) => {
    if (option === "all") return "All";
    if (option === "favorites") return "♥ Favourites";
    return getVerticalLabel(option);
  };

  // ── Flow mode logic ──
  useEffect(() => {
    if (!isFlowMode) {
      setFlowEntries([]);
      setFlowIndex(0);
      return;
    }
    setFlowEntries(buildFlowEntries(displayArticles, activeSlug, 0, 3));
    setFlowIndex(0);
  }, [activeFilter, activeSlug, isFlowMode]);

  useEffect(() => {
    if (!isFlowMode || flowIndex < flowEntries.length - 2) return;
    setFlowEntries((current) => {
      const nextCycleStart = current.length
        ? Math.ceil(current.length / displayArticles.length)
        : 0;
      return [...current, ...buildFlowEntries(displayArticles, activeSlug, nextCycleStart, 2)];
    });
  }, [flowIndex, isFlowMode]);

  useEffect(() => {
    if (!isFlowMode) return;
    const nextEntry = flowEntries[flowIndex];
    if (!nextEntry || nextEntry.article.slug === activeSlug) return;
    setReaderState((c) => ({ ...c, activeSlug: nextEntry.article.slug }));
    syncUrl(activeFilter, nextEntry.article.slug, "flow");
  }, [flowIndex, isFlowMode]);

  useEffect(() => {
    if (!isFlowMode || !isFlowAnimating) return;
    const id = window.setTimeout(() => {
      setIsFlowAnimating(false);
      wheelLockRef.current = false;
    }, 440);
    return () => window.clearTimeout(id);
  }, [isFlowAnimating, isFlowMode]);

  useEffect(() => {
    if (!isFlowMode || !flowFeedRef.current) return;
    const node = flowFeedRef.current;
    const syncHeight = () => setFlowViewportHeight(node.clientHeight);
    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [isFlowMode]);

  useEffect(() => {
    if (!isFlowMode || !appShellRef.current) return;
    const shellNode = appShellRef.current;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelLockRef.current || isFlowAnimating) return;
      if (Math.abs(e.deltaY) < 12) return;
      wheelLockRef.current = true;
      moveFlow(e.deltaY > 0 ? 1 : -1);
    };

    shellNode.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      shellNode.removeEventListener("wheel", onWheel);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [isFlowAnimating, isFlowMode, flowEntries.length]);

  const moveFlow = (direction: 1 | -1) => {
    if (!isFlowMode || isFlowAnimating || !flowEntries.length) return;
    setFlowIndex((current) => {
      const next = Math.max(0, Math.min(flowEntries.length - 1, current + direction));
      if (next === current) { wheelLockRef.current = false; return current; }
      setIsFlowAnimating(true);
      return next;
    });
  };

  const handleFlowTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleFlowTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!isFlowMode || isFlowAnimating || touchStartYRef.current === null) {
      touchStartYRef.current = null;
      return;
    }
    const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
    const deltaY = touchStartYRef.current - endY;
    touchStartYRef.current = null;
    if (Math.abs(deltaY) < 48) return;
    moveFlow(deltaY > 0 ? 1 : -1);
  };

  // ── Render: Focus Mode ──
  const renderFocusMode = () => (
    <>
      {/* Compact control bar — always visible at top */}
      <div className="nb-toolbar">
        <div className="nb-toolbar-brand">
          <Link href="/" className="nb-toolbar-logo" aria-label="NewsBites home">
            <span className="nb-toolbar-logo-emblem">NB</span>
            <span className="nb-toolbar-logo-text">NewsBites</span>
          </Link>
        </div>
        <div className="nb-toolbar-row">
          <button
            className="nb-btn nb-btn-icon"
            type="button"
            onClick={() => { if (previousArticle) setActiveArticle(previousArticle.slug); }}
            disabled={activeIndex <= 0}
            aria-label="Previous article"
          >
            ‹
          </button>

          <button
            className="nb-btn nb-btn-icon"
            type="button"
            onClick={() => setSearchOpen((c) => !c)}
            aria-label={searchOpen ? "Close search" : "Search articles"}
          >
            {searchOpen ? "✕" : "⌕"}
          </button>

          <button className="nb-btn nb-btn-text" type="button" onClick={jumpRandom}>
            ⟳
          </button>

          <span className="nb-toolbar-counter">
            {displayArticles.length > 0 ? `${activeIndex + 1} / ${displayArticles.length}` : "—"}
          </span>

          <button
            className="nb-btn nb-btn-menu"
            type="button"
            onClick={() => { setMenuOpen((c) => !c); setSearchOpen(false); }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          <button
            className="nb-btn nb-btn-icon"
            type="button"
            onClick={() => { if (nextArticleItem) setActiveArticle(nextArticleItem.slug); }}
            disabled={activeIndex >= displayArticles.length - 1}
            aria-label="Next article"
          >
            ›
          </button>
        </div>

        {/* Search bar — slides open */}
        {searchOpen && (
          <div className="nb-search-bar">
            <input
              className="nb-search-input"
              type="text"
              placeholder="Search articles…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Expanded menu panel */}
        {menuOpen && (
          <div className="nb-menu-panel">
            <div className="nb-menu-section">
              <span className="nb-menu-label">Filter</span>
              <div className="nb-chip-row">
                {filterOptions.map((option) => (
                  <button
                    key={option}
                    className={option === activeFilter ? "nb-chip nb-chip-active" : "nb-chip"}
                    type="button"
                    onClick={() => { setFilter(option); setMenuOpen(false); }}
                  >
                    {filterLabel(option)}
                  </button>
                ))}
              </div>
            </div>
            <div className="nb-menu-divider" />
            <div className="nb-menu-section">
              <span className="nb-menu-label">Mode</span>
              <div className="nb-chip-row">
                <button
                  className="nb-chip nb-chip-active"
                  type="button"
                  disabled
                >
                  Focus
                </button>
                <button
                  className="nb-chip"
                  type="button"
                  onClick={() => setMode("flow")}
                >
                  Flow ↕
                </button>
              </div>
            </div>
            <div className="nb-menu-divider" />
            <div className="nb-menu-section">
              <div className="nb-chip-row">
                <Link className="nb-chip" href="/">Home</Link>
                <Link className="nb-chip" href="/about">About</Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Article card — fills remaining space */}
      <div className="nb-article-area">
        {displayArticles.length === 0 ? (
          <div className="nb-empty">
            <p>
              {activeFilter === "favorites"
                ? "No favourites yet — tap ♡ on any article to save it."
                : "No articles in this category."}
            </p>
          </div>
        ) : activeArticle ? (
          <article className="nb-card" key={activeArticle.slug}>
            <div className="nb-card-body">
              <p className="nb-card-meta">
                {getVerticalLabel(activeArticle.vertical)} · {activeArticle.dateLabel} · {activeArticle.readingTime}
              </p>
              <h2 className="nb-card-title">{activeArticle.appDigest.headline}</h2>
              <p className="nb-card-lead">{activeArticle.appDigest.nutshell}</p>
              <div className="nb-digest">
                {activeArticle.appDigest.sections.map((section) => (
                  <div key={section.title} className="nb-digest-block">
                    <p className="nb-digest-label">{section.title}</p>
                    <p className="nb-digest-text">{section.summary}</p>
                  </div>
                ))}
                <div className="nb-digest-block nb-digest-takeaway">
                  <p className="nb-digest-label">Why it matters</p>
                  <p className="nb-digest-text">{activeArticle.appDigest.takeaway}</p>
                </div>
              </div>
            </div>
            <div className="nb-image-slot" aria-hidden="true">
              <span className="nb-image-slot-label">Image</span>
            </div>
            <div className="nb-card-footer">
              <Link className="nb-btn-read" href={`/articles/${activeArticle.slug}`}>
                Read full article →
              </Link>
              <button
                className={isFav(activeArticle.slug) ? "nb-btn-fav nb-btn-fav-active" : "nb-btn-fav"}
                type="button"
                aria-label={isFav(activeArticle.slug) ? "Remove from favourites" : "Add to favourites"}
                onClick={() => toggleFavorite(activeArticle.slug)}
              >
                {isFav(activeArticle.slug) ? "♥" : "♡"}
              </button>
            </div>
          </article>
        ) : null}
      </div>
    </>
  );

  // ── Render: Flow Mode ──
  const renderFlowMode = () => (
    <>
      {/* Floating logo + menu button — top right */}
      <div className="nb-flow-header">
        <button
          className="nb-flow-logo"
          type="button"
          onClick={() => { setMenuOpen((c) => !c); }}
          aria-label="Open menu"
        >
          <span className="nb-flow-logo-emblem">NB</span>
          <span className="nb-flow-logo-text">NewsBites</span>
          <span className="nb-flow-logo-menu">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Flow overlay menu — same expanded panel as focus mode */}
      {menuOpen && (
        <div className="nb-flow-menu-overlay">
          <div className="nb-menu-section">
            <span className="nb-menu-label">Filter</span>
            <div className="nb-chip-row">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  className={option === activeFilter ? "nb-chip nb-chip-active" : "nb-chip"}
                  type="button"
                  onClick={() => { setFilter(option); setMenuOpen(false); }}
                >
                  {filterLabel(option)}
                </button>
              ))}
            </div>
          </div>
          <div className="nb-menu-divider" />
          <div className="nb-menu-section">
            <span className="nb-menu-label">Mode</span>
            <div className="nb-chip-row">
              <button
                className="nb-chip"
                type="button"
                onClick={() => setMode("focus")}
              >
                Focus ◫
              </button>
              <button className="nb-chip nb-chip-active" type="button" disabled>
                Flow ↕
              </button>
            </div>
          </div>
          <div className="nb-menu-divider" />
          <div className="nb-menu-section">
            <div className="nb-chip-row">
              <Link className="nb-chip" href="/">Home</Link>
              <Link className="nb-chip" href="/about">About</Link>
            </div>
          </div>
          <div className="nb-menu-divider" />
          <div className="nb-menu-section">
            <div className="nb-chip-row">
              <button className="nb-chip" type="button" onClick={() => { jumpRandom(); setMenuOpen(false); }}>
                ⟳ Surprise me
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flow feed — full screen snapping cards */}
      <div
        className="nb-flow-feed"
        ref={flowFeedRef}
        onTouchStart={handleFlowTouchStart}
        onTouchEnd={handleFlowTouchEnd}
      >
        {displayArticles.length === 0 ? (
          <div className="nb-empty nb-empty-flow">
            <p>
              {activeFilter === "favorites"
                ? "No favourites yet — tap ♡ on any article to save it."
                : "No articles in this category."}
            </p>
          </div>
        ) : (
          <div
            className={isFlowAnimating ? "nb-flow-track nb-flow-animating" : "nb-flow-track"}
            style={{ transform: `translate3d(0, -${flowIndex * flowViewportHeight}px, 0)` }}
          >
            {flowEntries.map(({ article, key }) => (
              <div
                key={key}
                className="nb-flow-card"
                style={flowViewportHeight ? { height: `${flowViewportHeight}px` } : undefined}
              >
                <div className="nb-flow-card-inner">
                  <div className="nb-flow-card-body">
                    <p className="nb-card-meta nb-card-meta-flow">
                      {getVerticalLabel(article.vertical)} · {article.dateLabel} · {article.readingTime}
                    </p>
                    <h2 className="nb-card-title nb-card-title-flow">{article.appDigest.headline}</h2>
                    <p className="nb-card-lead nb-card-lead-flow">{article.appDigest.nutshell}</p>
                    <div className="nb-digest nb-digest-flow">
                      {article.appDigest.sections.map((section) => (
                        <div key={`${key}-${section.title}`} className="nb-digest-block nb-digest-block-flow">
                          <p className="nb-digest-label">{section.title}</p>
                          <p className="nb-digest-text">{section.summary}</p>
                        </div>
                      ))}
                      <div className="nb-digest-block nb-digest-block-flow nb-digest-takeaway-flow">
                        <p className="nb-digest-label">Why it matters</p>
                        <p className="nb-digest-text">{article.appDigest.takeaway}</p>
                      </div>
                    </div>
                  </div>
                  <div className="nb-image-slot nb-image-slot-flow" aria-hidden="true">
                    <span className="nb-image-slot-label">Image</span>
                  </div>
                  <div className="nb-flow-card-footer">
                    <Link className="nb-btn-read nb-btn-read-flow" href={`/articles/${article.slug}`}>
                      Read full article →
                    </Link>
                    <button
                      className={isFav(article.slug) ? "nb-btn-fav nb-btn-fav-flow nb-btn-fav-active" : "nb-btn-fav nb-btn-fav-flow"}
                      type="button"
                      aria-label={isFav(article.slug) ? "Remove from favourites" : "Add to favourites"}
                      onClick={() => toggleFavorite(article.slug)}
                    >
                      {isFav(article.slug) ? "♥" : "♡"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flow nav hint */}
      <div className="nb-flow-hint">
        <span>↕ Scroll for next</span>
      </div>
    </>
  );

  return (
    <section
      className={isFlowMode ? "nb-shell nb-shell-flow" : "nb-shell"}
      ref={appShellRef}
    >
      {isFlowMode ? renderFlowMode() : renderFocusMode()}
    </section>
  );
}

"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import Link from "next/link";
import { getVerticalLabel, type Vertical } from "@/lib/article-taxonomy";
import type { Article } from "@/lib/articles";

type AppArticle = Pick<
  Article,
  | "author"
  | "appDigest"
  | "coverImage"
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
const EMPTY_FLOW_ENTRIES: FlowEntry[] = [];

function isVertical(value: string | null, verticals: Vertical[]): value is Vertical {
  return Boolean(value && verticals.includes(value as Vertical));
}

function getInitialMode(value: string | null): ReaderMode {
  return value === "flow" ? "flow" : "focus";
}

function pickPseudoRandomIndex(length: number, seed: number) {
  if (length <= 1) return 0;
  const nextSeed = (seed * 1664525 + 1013904223) >>> 0;
  return nextSeed % length;
}

function readInitialFavorites() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const stored = localStorage.getItem(FAV_KEY);
    if (!stored) return new Set<string>();
    return new Set(JSON.parse(stored) as string[]);
  } catch {
    return new Set<string>();
  }
}

function replaceReaderUrl(nextFilter: FilterValue, nextSlug: string, nextMode: ReaderMode) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  if (nextFilter !== "all") p.set("vertical", nextFilter);
  if (nextMode === "flow") p.set("mode", "flow");
  if (nextSlug) p.set("article", nextSlug);
  const q = p.toString();
  window.history.replaceState(null, "", q ? `/app?${q}` : "/app");
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
  const [flowAnchorSlug, setFlowAnchorSlug] = useState(() => activeSlug || articles[0]?.slug || "");
  const [flowCycleCount, setFlowCycleCount] = useState(3);
  const [flowIndex, setFlowIndex] = useState(0);
  const [isFlowAnimating, setIsFlowAnimating] = useState(false);
  const [flowViewportHeight, setFlowViewportHeight] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(() => readInitialFavorites());
  const wheelLockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const randomSeedRef = useRef(0x9e3779b9);

  const filterOptions: FilterValue[] = ["all", "favorites", ...verticals];
  const isFlowMode = mode === "flow";

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
  const trimmedSearchQuery = searchQuery.trim();
  const hasSearchNoResults = Boolean(searchOpen && trimmedSearchQuery && searchedArticles.length === 0);

  const activeIndex = Math.max(0, displayArticles.findIndex((a) => a.slug === activeSlug));

  const resetFlowState = (slug: string) => {
    setFlowAnchorSlug(slug);
    setFlowCycleCount(3);
    setFlowIndex(0);
    setIsFlowAnimating(false);
    wheelLockRef.current = false;
  };

  const setActiveArticle = (slug: string, nextMode?: ReaderMode) => {
    const resolvedMode = nextMode ?? mode;
    if (resolvedMode === "flow") {
      resetFlowState(slug);
    }
    setReaderState((c) => ({ ...c, activeSlug: slug, mode: resolvedMode }));
    replaceReaderUrl(activeFilter, slug, resolvedMode);
  };

  const getReaderContextQuery = (slug: string) => {
    const p = new URLSearchParams();
    p.set("from", "app");
    p.set("article", slug);
    if (mode === "flow") p.set("mode", "flow");
    if (activeFilter !== "all") p.set("vertical", activeFilter);
    return p.toString();
  };

  const getArticleHref = (slug: string) => `/articles/${slug}?${getReaderContextQuery(slug)}`;

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
        replaceReaderUrl(nextFilter, "", mode);
        setReaderState({ activeFilter: nextFilter, activeSlug: "", mode });
        if (mode === "flow") {
          resetFlowState("");
        }
        return;
      }
      setReaderState({ activeFilter: nextFilter, activeSlug: first.slug, mode });
      if (mode === "flow") {
        resetFlowState(first.slug);
      }
      replaceReaderUrl(nextFilter, first.slug, mode);
    });
  };

  const jumpRandom = () => {
    if (!displayArticles.length) return;
    const candidates = displayArticles.filter((a) => a.slug !== activeSlug);
    const pool = candidates.length ? candidates : displayArticles;
    randomSeedRef.current = (randomSeedRef.current * 1664525 + 1013904223) >>> 0;
    const next = pool[pickPseudoRandomIndex(pool.length, randomSeedRef.current)];
    if (next) setActiveArticle(next.slug);
  };

  const activeArticle = displayArticles[activeIndex] ?? displayArticles[0];
  const previousArticle = displayArticles[activeIndex - 1];
  const nextArticleItem = displayArticles[activeIndex + 1];

  const flowEntries =
    !isFlowMode || !displayArticles.length || !flowAnchorSlug
      ? []
      : buildFlowEntries(displayArticles, flowAnchorSlug, 0, flowCycleCount);

  const flowPosition = Math.min(flowIndex, Math.max(0, flowEntries.length - 1));

  const setMode = (nextMode: ReaderMode) => {
    const nextSlug = activeArticle?.slug ?? "";
    if (nextMode === "flow") {
      resetFlowState(nextSlug);
    } else {
      setIsFlowAnimating(false);
      wheelLockRef.current = false;
    }
    setReaderState((c) => ({ ...c, activeSlug: nextSlug || c.activeSlug, mode: nextMode }));
    setMenuOpen(false);
    setSearchOpen(false);
    replaceReaderUrl(activeFilter, nextSlug, nextMode);
  };

  const isFav = (slug: string) => favorites.has(slug);

  const filterLabel = (option: FilterValue) => {
    if (option === "all") return "All";
    if (option === "favorites") return "♥ Favourites";
    return getVerticalLabel(option);
  };

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
    document.documentElement.classList.add("nb-flow-lock");
    const orderedForWheel =
      displayArticles.length && flowAnchorSlug
        ? getOrderedArticles(displayArticles, flowAnchorSlug)
        : EMPTY_FLOW_ENTRIES.map((entry) => entry.article);
    const orderedLength = orderedForWheel.length;
    const totalEntries = orderedLength * flowCycleCount;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelLockRef.current || isFlowAnimating) return;
      if (Math.abs(e.deltaY) < 12) return;
      if (!orderedLength || totalEntries < 1) return;
      wheelLockRef.current = true;
      const direction: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(totalEntries - 1, flowPosition + direction));
      if (next === flowPosition) {
        wheelLockRef.current = false;
        return;
      }

      if (direction === 1 && next >= totalEntries - 2 && orderedLength > 0) {
        setFlowCycleCount((current) => current + 2);
      }

      const nextArticle = orderedForWheel[next % orderedLength];
      if (!nextArticle) {
        wheelLockRef.current = false;
        return;
      }

      setReaderState((current) => ({ ...current, activeSlug: nextArticle.slug }));
      replaceReaderUrl(activeFilter, nextArticle.slug, "flow");
      setIsFlowAnimating(true);
      setFlowIndex(next);
    };

    shellNode.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      shellNode.removeEventListener("wheel", onWheel);
      document.documentElement.classList.remove("nb-flow-lock");
    };
  }, [
    activeFilter,
    displayArticles,
    flowAnchorSlug,
    flowCycleCount,
    flowPosition,
    isFlowAnimating,
    isFlowMode,
  ]);

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
    const direction: 1 | -1 = deltaY > 0 ? 1 : -1;
    const next = Math.max(0, Math.min(flowEntries.length - 1, flowPosition + direction));
    if (next === flowPosition) {
      wheelLockRef.current = false;
      return;
    }

    if (direction === 1 && next >= flowEntries.length - 2 && displayArticles.length > 0) {
      setFlowCycleCount((current) => current + 2);
    }

    const nextEntry = flowEntries[next];
    if (!nextEntry) {
      wheelLockRef.current = false;
      return;
    }

    setReaderState((current) => ({ ...current, activeSlug: nextEntry.article.slug }));
    replaceReaderUrl(activeFilter, nextEntry.article.slug, "flow");
    setIsFlowAnimating(true);
    setFlowIndex(next);
  };

  // ── Render: Focus Mode ──
  const renderFocusMode = () => (
    <>
      {/* Compact control bar — always visible at top */}
      <div className="nb-toolbar">
        <div className="nb-toolbar-row">
          <div className="nb-toolbar-controls nb-toolbar-controls-left">
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

            <button className="nb-btn nb-btn-text" type="button" onClick={jumpRandom} aria-label="Random article">
              ⟳
            </button>
          </div>

          <Link href="/" className="nb-toolbar-logo nb-toolbar-logo-inline" aria-label="NewsBites home">
            <span className="nb-toolbar-logo-emblem">NB</span>
            <span className="nb-toolbar-logo-text">NewsBites</span>
          </Link>

          <div className="nb-toolbar-controls nb-toolbar-controls-right">
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
              {hasSearchNoResults
                ? `No matches for "${trimmedSearchQuery}".`
                : activeFilter === "favorites"
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
            {activeArticle.coverImage ? (
              <div
                className="nb-image-slot nb-image-slot-filled"
                aria-hidden="true"
                style={{ backgroundImage: `url("${activeArticle.coverImage}")` }}
              />
            ) : (
              <div className="nb-image-slot" aria-hidden="true">
                <span className="nb-image-slot-label">Image</span>
              </div>
            )}
            <div className="nb-card-footer">
              <Link className="nb-btn-read" href={getArticleHref(activeArticle.slug)}>
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
        <span className="nb-flow-counter" aria-live="polite">
          {displayArticles.length > 0 ? `${activeIndex + 1} / ${displayArticles.length}` : "—"}
        </span>
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
              {hasSearchNoResults
                ? `No matches for "${trimmedSearchQuery}".`
                : activeFilter === "favorites"
                ? "No favourites yet — tap ♡ on any article to save it."
                : "No articles in this category."}
            </p>
          </div>
        ) : (
          <div
            className={isFlowAnimating ? "nb-flow-track nb-flow-animating" : "nb-flow-track"}
            style={{ transform: `translate3d(0, -${flowPosition * flowViewportHeight}px, 0)` }}
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
                  {article.coverImage ? (
                    <div
                      className="nb-image-slot nb-image-slot-flow nb-image-slot-filled"
                      aria-hidden="true"
                      style={{ backgroundImage: `url("${article.coverImage}")` }}
                    />
                  ) : (
                    <div className="nb-image-slot nb-image-slot-flow" aria-hidden="true">
                      <span className="nb-image-slot-label">Image</span>
                    </div>
                  )}
                  <div className="nb-flow-card-footer">
                    <Link className="nb-btn-read nb-btn-read-flow" href={getArticleHref(article.slug)}>
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

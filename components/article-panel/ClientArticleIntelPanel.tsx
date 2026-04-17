"use client";

import { useState, useEffect } from "react";
import type { Article } from "@/lib/articles";

interface Props {
  article: Article;
}

export function ClientArticleIntelPanel({ article }: Props) {
  const [content, setContent] = useState<React.ReactNode>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { getPanelSections } = await import("@/lib/panels/registry");
        const configs = getPanelSections(article);

        if (cancelled || configs.length === 0) {
          setLoading(false);
          return;
        }

        const sections: React.ReactNode[] = [];
        
        for (const config of configs.slice(0, 3)) {
          try {
            const result = await config.component(article);
            if (result && !cancelled) {
              sections.push(result);
            }
          } catch (e) {
            // Skip failed panels
          }
        }

        if (!cancelled) {
          setContent(sections.length > 0 ? sections : null);
        }
      } catch (e) {
        console.error("Panel load error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [article.slug]);

  if (loading) {
    return (
      <div className="nb-panel-inline">
        <div className="nb-panel-loading">
          <span className="nb-panel-spinner" />
          Loading...
        </div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="nb-panel-inline">
      {Array.isArray(content) ? content.map((c, i) => (
        <div key={i} className="nb-panel-section">{c}</div>
      )) : <div className="nb-panel-section">{content}</div>}
    </div>
  );
}

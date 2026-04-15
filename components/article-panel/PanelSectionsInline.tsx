"use client";

import { useState, useEffect } from "react";
import type { Article } from "@/lib/articles";

interface Props {
  article: Article;
  maxSections?: number;
}

export function PanelSectionsInline({ article, maxSections = 3 }: Props) {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadPanels() {
      setLoading(true);
      
      // Dynamically import and call the panel registry
      const { getPanelSections } = await import("@/lib/panels/registry");
      const configs = getPanelSections(article);
      
      if (cancelled) return;
      
      if (configs.length === 0) {
        setSections([]);
        setLoading(false);
        return;
      }

      const loaded: React.ReactNode[] = [];
      
      for (const config of configs.slice(0, maxSections)) {
        try {
          // These are async server components - call them and wait
          const content = await config.component(article);
          if (content && !cancelled) {
            loaded.push(content);
          }
        } catch (error) {
          console.error(`Panel ${config.id} error:`, error);
        }
      }

      if (!cancelled) {
        setSections(loaded);
        setLoading(false);
      }
    }

    loadPanels();

    return () => {
      cancelled = true;
    };
  }, [article.slug, article.vertical, maxSections]);

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

  if (sections.length === 0) {
    return (
      <div className="nb-panel-inline">
        <p className="nb-panel-empty">No data available for this article</p>
      </div>
    );
  }

  return (
    <div className="nb-panel-inline">
      {sections.map((content, i) => (
        <div key={i} className="nb-panel-section">
          {content}
        </div>
      ))}
    </div>
  );
}

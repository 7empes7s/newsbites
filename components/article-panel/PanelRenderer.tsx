"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  sections: { id: string; content: React.ReactNode }[];
  loading?: boolean;
}

export function PanelRenderer({ sections: initialSections, loading: initialLoading = false }: Props) {
  const [loading, setLoading] = useState(initialLoading);
  const [sections] = useState(initialSections);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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
        <p className="nb-panel-empty">No data available</p>
      </div>
    );
  }

  return (
    <div className="nb-panel-inline">
      {sections.map((section) => (
        <div key={section.id} className="nb-panel-section">
          {section.content}
        </div>
      ))}
    </div>
  );
}

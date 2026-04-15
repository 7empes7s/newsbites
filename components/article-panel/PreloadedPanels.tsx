"use client";

interface Props {
  panels: string[];
}

export function PreloadedPanels({ panels }: Props) {
  if (!panels || panels.length === 0) {
    return (
      <div className="nb-panel-inline">
        <p className="nb-panel-empty">No data available</p>
      </div>
    );
  }

  return (
    <div className="nb-panel-inline">
      {panels.map((html, i) => (
        <div 
          key={i} 
          className="nb-panel-section"
          dangerouslySetInnerHTML={{ __html: html }} 
        />
      ))}
    </div>
  );
}

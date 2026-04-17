"use client";

interface Props {
  panels: string[];
}

export function PreloadedPanels({ panels }: Props) {
  if (!panels || panels.length === 0) {
    return null;
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

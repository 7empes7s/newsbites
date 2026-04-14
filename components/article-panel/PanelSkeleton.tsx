export function PanelSkeleton() {
  return (
    <div className="intel-panel-skeleton" aria-hidden="true">
      <div className="intel-panel-skeleton-line short" />
      <div className="intel-panel-skeleton-line" />
      <div className="intel-panel-skeleton-line medium" />
    </div>
  );
}

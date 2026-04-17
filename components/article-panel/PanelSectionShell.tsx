"use client";

import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  canHide?: boolean;
  onHide?: () => void;
}

export function PanelSectionShell({
  title,
  children,
  canHide = false,
  onHide,
}: Props) {
  return (
    <div className="panel-section-shell">
      <div className="panel-section-shell-header">
        <h3 className="panel-section-shell-title">{title}</h3>
        {canHide && onHide ? (
          <button
            className="panel-section-shell-action"
            type="button"
            onClick={onHide}
          >
            Hide this section
          </button>
        ) : null}
      </div>
      <div className="panel-section-shell-body">{children}</div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { PanelDrawer } from "./PanelDrawer";

type PanelSectionPayload = {
  id: string;
  html: string;
};

interface Props {
  slug: string;
  desktopClassName?: string;
  showDesktop?: boolean;
  showSpacer?: boolean;
}

function buildDrawerContent(section: PanelSectionPayload) {
  return <div dangerouslySetInnerHTML={{ __html: section.html }} />;
}

export function AppArticleIntelPanel({
  slug,
  desktopClassName = "",
  showDesktop = true,
  showSpacer = true,
}: Props) {
  const [sections, setSections] = useState<PanelSectionPayload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSections() {
      setLoading(true);
      try {
        const response = await fetch(
          `/panel-fragment/${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Panel request failed: ${response.status}`);
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const nextSections = Array.from(doc.querySelectorAll<HTMLElement>("[data-app-panel-id]")).map(
          (node) => ({
            id: node.dataset.appPanelId ?? "",
            html: node.innerHTML,
          }),
        ).filter((section) => section.id && section.html.trim());

        setSections(nextSections);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("App panel load error:", error);
          setSections([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSections();

    return () => controller.abort();
  }, [slug]);

  const drawerSections = useMemo(
    () =>
      sections.map((section) => ({
        id: section.id,
        priority: 0,
        content: buildDrawerContent(section),
      })),
    [sections],
  );

  if (!loading && sections.length === 0) {
    return null;
  }

  return (
    <>
      {showDesktop ? (
        <div className={`intel-panel-desktop nb-app-intel-panel-desktop ${desktopClassName}`.trim()}>
          {loading ? (
            <div className="intel-panel-section">
              <div className="intel-panel-skeleton">
                <div className="intel-panel-skeleton-line medium" />
                <div className="intel-panel-skeleton-line" />
                <div className="intel-panel-skeleton-line short" />
              </div>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.id} className="intel-panel-section">
                <div dangerouslySetInnerHTML={{ __html: section.html }} />
              </div>
            ))
          )}
        </div>
      ) : null}

      {!loading && sections.length > 0 && showSpacer ? (
        <div className="nb-app-intel-spacer" aria-hidden="true" />
      ) : null}
      {loading ? null : <PanelDrawer sections={drawerSections} />}
    </>
  );
}

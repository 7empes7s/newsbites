import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/articles";
import { resolveArticlePanelSections } from "@/lib/panels/resolve";
import { PanelErrorBoundary } from "@/components/article-panel/PanelErrorBoundary";

export const dynamic = "force-dynamic";

export default async function PanelFragmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const sections = await resolveArticlePanelSections(article);

  return (
    <main id="app-intel-fragment" hidden>
      {sections.map(({ id, content, cta }) => (
        <div key={id} data-app-panel-id={id}>
          <PanelErrorBoundary fallback={null}>
            {content}
          </PanelErrorBoundary>
          {cta ? (
            <div className="panel-cta">
              <Link href={cta.href} className="panel-cta-link">
                {cta.label}
              </Link>
            </div>
          ) : null}
        </div>
      ))}
    </main>
  );
}

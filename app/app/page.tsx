import { NewsAppShell } from "@/components/news-app-shell";
import { getAllArticles, getAllVerticals } from "@/lib/articles";

export default async function ReaderAppPage({
  searchParams,
}: {
  searchParams: Promise<{
    article?: string;
    mode?: string;
    random?: string;
    vertical?: string;
  }>;
}) {
  const articles = getAllArticles();
  const verticals = getAllVerticals();
  const initialQuery = await searchParams;

  return (
    <main className="page-shell app-page-shell">
      <NewsAppShell
        articles={articles}
        initialQuery={initialQuery}
        verticals={verticals}
      />
    </main>
  );
}

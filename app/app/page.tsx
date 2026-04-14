import { NewsAppShell } from "@/components/news-app-shell";
import { getAllArticles, getAllGroups } from "@/lib/articles";

export default async function ReaderAppPage({
  searchParams,
}: {
  searchParams: Promise<{
    article?: string;
    mode?: string;
    random?: string;
    group?: string;
  }>;
}) {
  const articles = getAllArticles();
  const groups = getAllGroups();
  const initialQuery = await searchParams;

  return (
    <main className="page-shell app-page-shell">
      <NewsAppShell
        articles={articles}
        initialQuery={initialQuery}
        groups={groups}
      />
    </main>
  );
}

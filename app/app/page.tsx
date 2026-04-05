import { NewsAppShell } from "@/components/news-app-shell";
import { getAllArticles } from "@/lib/articles";

export default async function ReaderAppPage({
  searchParams,
}: {
  searchParams: Promise<{
    article?: string;
    random?: string;
    vertical?: string;
  }>;
}) {
  const articles = getAllArticles();
  const initialQuery = await searchParams;

  return (
    <main className="page-shell">
      <NewsAppShell articles={articles} initialQuery={initialQuery} />
    </main>
  );
}

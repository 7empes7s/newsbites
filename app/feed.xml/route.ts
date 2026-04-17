import { getAllArticles } from "@/lib/articles";

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const articles = getAllArticles().slice(0, 50);
  const base = "https://news.techinsiderbytes.com";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>NewsBites — TechInsiderBytes</title>
    <link>${base}</link>
    <description>Sharp briefings across tech, finance, politics, culture, and more.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    ${articles.map((a) => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${base}/articles/${a.slug}</link>
      <description>${escapeXml(a.lead)}</description>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      <guid isPermaLink="true">${base}/articles/${a.slug}</guid>
      <category>${escapeXml(a.vertical)}</category>
      ${a.tags.map((t) => `<category>${escapeXml(t)}</category>`).join("")}
    </item>`).join("")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

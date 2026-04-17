import type { MetadataRoute } from "next";
import { getAllArticles, getAllGroups } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://news.techinsiderbytes.com";
  const competitions = ["cl", "pl", "pd", "sa", "bl1"];

  const articles = getAllArticles().map((a) => ({
    url: `${base}/articles/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const groups = getAllGroups().map((g) => ({
    url: `${base}/group/${g}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/app`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/finance`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.7 },
    { url: `${base}/sports`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.7 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    ...competitions.map((competition) => ({
      url: `${base}/sports/${competition}`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.6,
    })),
    ...groups,
    ...articles,
  ];
}

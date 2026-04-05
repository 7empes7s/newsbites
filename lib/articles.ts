import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const articlesDirectory = path.join(process.cwd(), "content/articles");

export const verticals = ["ai", "finance", "global-politics", "trends"] as const;
export type Vertical = (typeof verticals)[number];

type Frontmatter = {
  title: string;
  slug: string;
  date: string;
  vertical: Vertical;
  tags: string[];
  status: "draft" | "approved" | "published";
  lead: string;
  coverImage?: string;
  author: string;
};

export type Article = Frontmatter & {
  content: string;
  dateLabel: string;
  readingTime: string;
};

const verticalLabels: Record<Vertical, string> = {
  ai: "AI",
  finance: "Finance",
  "global-politics": "Global Politics",
  trends: "Trends",
};

export function getVerticalLabel(vertical: Vertical) {
  return verticalLabels[vertical];
}

function getReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function readArticleFile(fileName: string): Article {
  const filePath = path.join(articlesDirectory, fileName);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const frontmatter = data as Frontmatter;

  return {
    ...frontmatter,
    content,
    dateLabel: formatDate(frontmatter.date),
    readingTime: getReadingTime(content),
  };
}

export function getAllArticles() {
  return fs
    .readdirSync(articlesDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map(readArticleFile)
    .filter((article) => article.status === "approved" || article.status === "published")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getFeaturedArticle() {
  return getAllArticles()[0] ?? null;
}

export function getLatestArticles(limit?: number) {
  const articles = getAllArticles();
  return typeof limit === "number" ? articles.slice(0, limit) : articles;
}

export function getArticleBySlug(slug: string) {
  return getAllArticles().find((article) => article.slug === slug) ?? null;
}

export function getArticlesByVertical(vertical: Vertical) {
  return getAllArticles().filter((article) => article.vertical === vertical);
}

export function getVerticalPreview(vertical: Vertical, limit = 2) {
  return getArticlesByVertical(vertical).slice(0, limit);
}

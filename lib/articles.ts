import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  GROUP_ORDER,
  getGroupForVertical,
  type Group,
  type Vertical,
} from "@/lib/article-taxonomy";
import type { PanelHints } from "@/lib/panels/types";

const articlesDirectory = path.join(process.cwd(), "content/articles");

type Frontmatter = {
  title: string;
  slug: string;
  date: string;
  vertical: Vertical;
  tags: string[];
  status: "draft" | "approved" | "published";
  lead: string;
  digest?: string;
  coverImage?: string;
  author: string;
  panel_hints?: PanelHints;
};

export type Article = Frontmatter & {
  appDigest: {
    headline: string;
    nutshell: string;
    sections: {
      title: string;
      summary: string;
    }[];
    takeaway: string;
  };
  content: string;
  dateLabel: string;
  readingTime: string;
  previewText: string;
};

function getReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getPreviewText(content: string, maxLength = 220) {
  const cleaned = content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength).trimEnd()}…`;
}

function getCleanParagraphs(content: string) {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`>-]/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function normalizeInline(text: string) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDigestSentence(text: string) {
  return text.match(/.+?[.!?](?=\s|$)/)?.[0]?.trim() ?? text.trim();
}

function getAppHeadline(title: string) {
  return title.split(/ -- |: |\| /)[0]?.trim() || title.trim();
}

function getDigestSections(content: string) {
  const lines = content.split("\n");
  const sections: { title: string; paragraphs: string[] }[] = [];
  let current: { title: string; paragraphs: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (line.startsWith("## ")) {
      current = {
        title: normalizeInline(line.replace(/^##\s+/, "")),
        paragraphs: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      continue;
    }

    if (line.startsWith("- ")) {
      current.paragraphs.push(normalizeInline(line.replace(/^- /, "")));
      continue;
    }

    current.paragraphs.push(normalizeInline(line));
  }

  return sections
    .map((section) => ({
      title: section.title,
      summary: getDigestSentence(section.paragraphs.join(" ")),
    }))
    .filter((section) => section.title && section.summary);
}

function getAppDigest(title: string, lead: string, content: string, digest?: string) {
  const paragraphs = getCleanParagraphs(content);
  const uniqueParagraphs = paragraphs.filter(
    (paragraph) => paragraph.toLowerCase() !== lead.toLowerCase(),
  );
  const sections = getDigestSections(content);
  const digestSections = sections.slice(0, 1);
  const takeawaySource =
    sections.at(-1)?.summary ??
    [...uniqueParagraphs].reverse()[0] ??
    lead;

  return {
    headline: getAppHeadline(title),
    nutshell: digest ?? getDigestSentence(lead),
    sections: digestSections.length
      ? digestSections
      : [
          {
            title: "Key point",
            summary: getDigestSentence(uniqueParagraphs[0] ?? lead),
          },
        ],
    takeaway: getDigestSentence(takeawaySource),
  };
}

function readArticleFile(fileName: string): Article {
  const filePath = path.join(articlesDirectory, fileName);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const frontmatter = data as Frontmatter;

  return {
    ...frontmatter,
    appDigest: getAppDigest(frontmatter.title, frontmatter.lead, content, frontmatter.digest),
    content,
    dateLabel: formatDate(frontmatter.date),
    readingTime: getReadingTime(content),
    previewText: getPreviewText(content),
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

export function getAllVerticals() {
  return Array.from(
    new Set(getAllArticles().map((article) => article.vertical).filter(Boolean)),
  ).sort();
}

export function getAllGroups(): Group[] {
  const present = new Set<Group>();
  for (const article of getAllArticles()) {
    const group = getGroupForVertical(article.vertical);
    if (group) {
      present.add(group);
    }
  }
  return GROUP_ORDER.filter((group) => present.has(group));
}

export function getArticlesByGroup(group: Group) {
  return getAllArticles().filter(
    (article) => getGroupForVertical(article.vertical) === group,
  );
}

export function getGroupPreview(group: Group, limit = 2) {
  return getArticlesByGroup(group).slice(0, limit);
}

export function getVerticalsInGroup(group: Group): Vertical[] {
  const seen = new Set<Vertical>();
  for (const article of getAllArticles()) {
    if (getGroupForVertical(article.vertical) === group) {
      seen.add(article.vertical);
    }
  }
  return Array.from(seen).sort();
}

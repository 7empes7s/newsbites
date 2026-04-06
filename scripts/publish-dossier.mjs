#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content/articles");

function usage() {
  console.error("Usage: node scripts/publish-dossier.mjs <absolute-dossier-path> [--status=published]");
  process.exit(2);
}

function parseArgs(argv) {
  const dossierPath = argv[2];
  if (!dossierPath) usage();

  const statusFlag = argv.find((arg) => arg.startsWith("--status="));

  return {
    dossierPath,
    status: statusFlag ? statusFlag.split("=")[1] : "published",
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeVertical(vertical) {
  return String(vertical || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function buildArticleFrontmatter(frontmatter, status) {
  const tags = normalizeTags(frontmatter.tags);
  const article = {
    title: String(frontmatter.title || "").trim(),
    slug: String(frontmatter.slug || "").trim(),
    date: String(frontmatter.date || "").trim(),
    vertical: normalizeVertical(frontmatter.vertical),
    tags,
    status,
    lead: String(frontmatter.lead || "").trim(),
    coverImage: String(frontmatter.coverImage || ""),
    author: String(frontmatter.author || "NewsBites Desk").trim(),
  };

  assert(article.title, "publish.md frontmatter is missing `title`");
  assert(article.slug, "publish.md frontmatter is missing `slug`");
  assert(article.date, "publish.md frontmatter is missing `date`");
  assert(article.vertical, "publish.md frontmatter is missing `vertical`");
  assert(article.tags.length > 0, "publish.md frontmatter is missing `tags`");
  assert(article.lead, "publish.md frontmatter is missing `lead`");

  return article;
}

function toMarkdown(frontmatter, body) {
  const tagsBlock = frontmatter.tags.map((tag) => `  - ${JSON.stringify(tag)}`).join("\n");
  return [
    "---",
    `title: ${JSON.stringify(frontmatter.title)}`,
    `slug: ${JSON.stringify(frontmatter.slug)}`,
    `date: ${JSON.stringify(frontmatter.date)}`,
    `vertical: ${JSON.stringify(frontmatter.vertical)}`,
    "tags:",
    tagsBlock,
    `status: ${JSON.stringify(frontmatter.status)}`,
    `lead: ${JSON.stringify(frontmatter.lead)}`,
    `coverImage: ${JSON.stringify(frontmatter.coverImage)}`,
    `author: ${JSON.stringify(frontmatter.author)}`,
    "---",
    "",
    body.trim(),
    "",
  ].join("\n");
}

function main() {
  const { dossierPath, status } = parseArgs(process.argv);
  assert(path.isAbsolute(dossierPath), "dossier path must be absolute");

  const publishPath = path.join(dossierPath, "publish.md");
  assert(fs.existsSync(publishPath), `publish.md not found at ${publishPath}`);

  const fileContents = fs.readFileSync(publishPath, "utf8");
  const { data, content } = matter(fileContents);
  assert(content.trim(), "publish.md body is empty");

  const article = buildArticleFrontmatter(data, status);
  const outputPath = path.join(ARTICLES_DIR, `${article.slug}.md`);
  const output = toMarkdown(article, content);

  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  fs.writeFileSync(outputPath, output, "utf8");

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        outputPath,
        slug: article.slug,
        status: article.status,
      },
      null,
      2,
    ) + "\n",
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

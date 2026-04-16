#!/usr/bin/env node

import { getPanelSections } from '../lib/panels/registry.js';
import { getArticleBySlug } from '../lib/articles.js';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, 'content/panels/cache');

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node warm-panel-cache.mjs <slug>');
  process.exit(1);
}

const article = getArticleBySlug(slug);
if (!article) {
  console.error(`Article not found: ${slug}`);
  process.exit(1);
}

const sections = getPanelSections(article);
fs.mkdirSync(CACHE_DIR, { recursive: true });

console.log(`Warming ${sections.length} panel sections for: ${slug}`);

for (const section of sections) {
  try {
    const data = await section.fetchData(article);
    const cachePath = path.join(CACHE_DIR, `${slug}-${section.id}.json`);
    fs.writeFileSync(cachePath, JSON.stringify({ data, ts: Date.now() }));
    console.log(`  ✓ ${section.id}`);
  } catch (err) {
    console.log(`  ✗ ${section.id}: ${err.message}`);
  }
}

console.log('Done.');
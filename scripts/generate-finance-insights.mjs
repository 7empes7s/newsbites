#!/usr/bin/env node
/**
 * generate-finance-insights.mjs
 * Nightly finance insight generation for TechInsiderBytes.
 *
 * Flow:
 *   1. Fetch current market snapshot from Yahoo Finance
 *   2. Read recent finance articles from content/articles/
 *   3. Call LiteLLM (editorial-fast → gemma4:26b) to produce 5 insights
 *   4. Write each insight to content/finance-insights/insight-<uuid>.json
 *
 * Run:  node scripts/generate-finance-insights.mjs
 * Cron: finance-insights.timer → daily 02:00 UTC
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "content/articles");
const INSIGHTS_DIR = path.join(ROOT, "content/finance-insights");

const LITELLM_URL = process.env.LITELLM_URL || "http://localhost:4000";
const LITELLM_KEY =
  process.env.LITELLM_MASTER_KEY ||
  process.env.LITELLM_API_KEY ||
  "sk-litellm-26cd8f943bccd9306d2fe68476c8292dcbfe2bd5f98e9f08";
const MODEL = process.env.FINANCE_INSIGHTS_MODEL || "editorial-fast";
const INSIGHT_COUNT = 5;

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  process.stdout.write(`[finance-insights] ${msg}\n`);
}

/** Parse YAML-like frontmatter from a markdown file. Returns { meta, body }. */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  for (const line of match[1].split("\n")) {
    const [k, ...rest] = line.split(":");
    if (k && rest.length) {
      meta[k.trim()] = rest.join(":").trim().replace(/^["']|["']$/g, "");
    }
  }
  return { meta, body: match[2] };
}

/** Fetch market snapshot directly from Yahoo Finance. */
async function fetchMarketSnapshot() {
  const symbols = ["SPY", "EURUSD=X", "GC=F", "BTC-USD"];
  const results = [];

  for (const symbol of symbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TIB-finance-bot/1.0)" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) { log(`Yahoo Finance ${symbol}: HTTP ${res.status}`); continue; }
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) continue;
      results.push({
        symbol: meta.symbol || symbol,
        price: (meta.regularMarketPrice || 0).toFixed(2),
        changePercent: (meta.regularMarketChangePercent || 0).toFixed(2),
      });
    } catch (err) {
      log(`Yahoo Finance ${symbol} error: ${err.message}`);
    }
  }
  return results;
}

/** Read finance articles published in the last 14 days. */
function readFinanceArticles() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  const articles = [];
  for (const file of fs.readdirSync(ARTICLES_DIR)) {
    if (!file.endsWith(".md")) continue;
    const content = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8");
    const { meta } = parseFrontmatter(content);
    if (meta.vertical !== "finance") continue;
    if (!["approved", "published"].includes(meta.status)) continue;
    if (meta.date && new Date(meta.date) < cutoff) continue;
    articles.push({
      slug: meta.slug || file.replace(".md", ""),
      title: meta.title || "",
      lead: meta.lead || meta.digest || "",
    });
  }
  return articles;
}

/** POST to LiteLLM chat completions. Returns the assistant message text. */
function callLiteLLM(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a concise financial analyst. Respond ONLY with a valid JSON array — no markdown, no prose outside the array.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    const url = new URL("/v1/chat/completions", LITELLM_URL);
    const req = http.request(
      {
        hostname: url.hostname,
        port: Number(url.port) || 80,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          Authorization: `Bearer ${LITELLM_KEY}`,
        },
        timeout: 120_000,
      },
      (res) => {
        let chunks = "";
        res.on("data", (d) => { chunks += d; });
        res.on("end", () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`LiteLLM HTTP ${res.statusCode}: ${chunks.slice(0, 300)}`));
          }
          try {
            const parsed = JSON.parse(chunks);
            const text = parsed?.choices?.[0]?.message?.content ?? "";
            resolve(text);
          } catch {
            reject(new Error(`LiteLLM non-JSON: ${chunks.slice(0, 300)}`));
          }
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("LiteLLM timed out")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/** Parse the LLM's JSON array response; tolerate markdown code fences. */
function parseInsightsFromLLM(raw, articleSlugs) {
  // Strip potential ```json fences
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Cannot parse LLM JSON: ${cleaned.slice(0, 200)}`);
  }
  if (!Array.isArray(parsed)) throw new Error("LLM response is not a JSON array");

  return parsed.slice(0, INSIGHT_COUNT).map((item) => {
    // Validate and normalise each insight
    const confidence = ["high", "medium", "low"].includes(item.confidence)
      ? item.confidence
      : "medium";

    // Map source slugs back to real article slugs where possible
    const sourceArticleSlugs = (item.sourceArticleSlugs || [])
      .filter((s) => typeof s === "string" && articleSlugs.includes(s))
      .slice(0, 3);

    return {
      id: crypto.randomUUID(),
      title: String(item.title || "").slice(0, 120),
      summary: String(item.summary || "").slice(0, 400),
      sourceArticleSlugs,
      confidence,
      timestamp: new Date().toISOString(),
      status: "published",
    };
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log("Starting nightly insight generation…");

  fs.mkdirSync(INSIGHTS_DIR, { recursive: true });

  // 1. Market snapshot
  log("Fetching market data from Yahoo Finance…");
  const market = await fetchMarketSnapshot();
  if (market.length === 0) {
    log("No market data available — aborting.");
    process.exit(1);
  }
  log(`Got ${market.length} symbols: ${market.map((m) => m.symbol).join(", ")}`);

  // 2. Finance articles
  const articles = readFinanceArticles();
  log(`Found ${articles.length} recent finance article(s)`);

  // 3. Build prompt
  const marketBlock = market
    .map((m) => `- ${m.symbol}: $${m.price} (${m.changePercent > 0 ? "+" : ""}${m.changePercent}%)`)
    .join("\n");

  const articleBlock =
    articles.length > 0
      ? articles
          .map((a) => `- slug: "${a.slug}"\n  title: ${a.title}\n  summary: ${a.lead}`)
          .join("\n")
      : "- No recent finance articles available.";

  const prompt = `You are a financial analyst for TechInsiderBytes.

Current market snapshot:
${marketBlock}

Recent finance articles (use slugs as sourceArticleSlugs where relevant):
${articleBlock}

Produce exactly ${INSIGHT_COUNT} brief market insights. Each insight must:
- Have a clear, actionable title (max 100 chars)
- Have a 2-sentence summary citing observable data
- Cite 0–3 article slugs from the list above that support the insight
- Assign a confidence: "high" (strong data), "medium" (mixed signals), or "low" (speculative)

Respond ONLY with a JSON array (no markdown, no prose):
[
  {
    "title": "...",
    "summary": "...",
    "sourceArticleSlugs": ["slug-one"],
    "confidence": "high"
  }
]`;

  // 4. Call LiteLLM
  log(`Calling LiteLLM (model: ${MODEL})…`);
  const raw = await callLiteLLM(prompt);
  log(`LiteLLM responded (${raw.length} chars)`);

  // 5. Parse and validate
  const articleSlugs = articles.map((a) => a.slug);
  const insights = parseInsightsFromLLM(raw, articleSlugs);
  log(`Parsed ${insights.length} insight(s)`);

  // 6. Write to disk
  for (const insight of insights) {
    const file = path.join(INSIGHTS_DIR, `insight-${insight.id}.json`);
    fs.writeFileSync(file, JSON.stringify(insight, null, 2) + "\n");
    log(`Wrote ${path.basename(file)} — "${insight.title}"`);
  }

  log(`Done. ${insights.length} insights written to content/finance-insights/`);
}

main().catch((err) => {
  process.stderr.write(`[finance-insights] ERROR: ${err.message}\n`);
  process.exit(1);
});

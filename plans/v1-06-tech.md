# V1 Block 6 — AI / Tech Panels
**Phases 17–20 | Depends on: Block 0 (panel infrastructure)**

> **Read `CONTEXT.md` first.**

---

## What You're Building

AI and tech articles show **GitHub repo cards**, **HuggingFace model cards**, **AI leaderboard position**, and **tech ecosystem signals**. An article about OpenAI's new model shows where it ranks on benchmarks. An article about a new library shows its GitHub stars and recent activity.

---

## Phase 17 — GitHub Repo Card

**File: `lib/panels/fetchers/tech.ts`**

```typescript
export async function fetchGitHubRepo(owner: string, repo: string) {
  const headers: Record<string, string> = {};
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

// Detect repos from panel_hints or article content
export function detectGitHubRepos(
  content: string,
  panelHints?: { github_repos?: string[] }
): string[] {
  if (panelHints?.github_repos?.length) return panelHints.github_repos;
  // Regex scan for github.com/owner/repo links
  const matches = content.matchAll(/github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/g);
  return [...new Set([...matches].map(m => m[1]))].slice(0, 3);
}
```

**File: `components/panels/tech/GithubRepoCard.tsx`**

Shows: repo name, description (truncated to 2 lines), star count, fork count, primary language (with color dot), "last commit X days ago", license badge. CTA: "View on GitHub →" link.

Register for `ai`, `trends`, `cybersecurity` verticals.

---

## Phase 18 — HuggingFace Model Card + Paper Abstract

**File: `lib/panels/fetchers/tech.ts` — Add:**

```typescript
export async function fetchHFModel(modelId: string) {
  const res = await fetch(`https://huggingface.co/api/models/${modelId}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchPaperWithCode(title: string) {
  const encoded = encodeURIComponent(title);
  const res = await fetch(`https://paperswithcode.com/api/v1/papers/?q=${encoded}&items_per_page=1`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] || null;
}
```

**File: `components/panels/tech/ModelLeaderboardWidget.tsx`**

For AI model articles: HuggingFace card showing downloads, likes, tags, task type, last modified date.

**File: `components/panels/tech/PaperCard.tsx`**

Paper title, abstract snippet (first 200 chars), link to implementation on GitHub, stars count.

---

## Phase 19 — AI Leaderboard Widget

Enhance `ModelLeaderboardWidget.tsx` to show where the discussed model ranks among the top 5 on the LMSYS Chatbot Arena leaderboard.

Data source: LMSYS publishes their leaderboard as a HuggingFace dataset. Fetch from `https://huggingface.co/api/datasets/lmsys/chatbot_arena_leaderboard` or cache a snapshot in `content/panels/ai-leaderboard.json` (refreshed weekly by editorial pipeline).

Shows: ranked list of top 5 models with Elo scores. The article's discussed model is **highlighted in amber** if it's in the top 5.

---

## Phase 20 — Tech Ecosystem Signal Card

**File: `components/panels/tech/TechSignalCard.tsx`**

Shows trending activity around the technology discussed in the article:
- "X repos created this month using [technology]" — from GitHub search API
- Trending repos in the technology area — from GitHub trending (scrape or API)
- Stack Overflow tag activity (static annual data, cached as JSON)

### How to test
1. Open the `openai-amd-ai-infrastructure-partnership` article
2. Add `panel_hints: { github_repos: ["openai/openai-python"] }` to frontmatter
3. Panel should show the GitHub repo card with stars, forks, language
4. If the article discusses a specific model, the leaderboard widget should appear

---

## Done Checklist

- [ ] Phase 17: `GithubRepoCard.tsx` shows repo info with stars/forks/language
- [ ] Phase 17: GitHub repo auto-detection from content and panel_hints works
- [ ] Phase 17: `GITHUB_TOKEN` added to `.env.local`
- [ ] Phase 18: `ModelLeaderboardWidget.tsx` shows HuggingFace model info
- [ ] Phase 18: `PaperCard.tsx` shows paper abstract and implementation link
- [ ] Phase 19: AI leaderboard shows top 5 models with article's model highlighted
- [ ] Phase 20: `TechSignalCard.tsx` shows trending repos and ecosystem signals
- [ ] All tech panels register for `ai`, `trends`, `cybersecurity` verticals

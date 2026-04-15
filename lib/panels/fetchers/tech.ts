export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  license: { spdx_id: string } | null;
}

export async function fetchGitHubRepo(owner: string, repo: string): Promise<GitHubRepo | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`Error fetching GitHub repo ${owner}/${repo}:`, error);
    return null;
  }
}

export function detectGitHubRepos(
  content: string,
  panelHints?: { github_repos?: string[] }
): string[] {
  if (panelHints?.github_repos?.length) return panelHints.github_repos;
  const matches = content.matchAll(/github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/g);
  return [...new Set([...matches].map((m) => m[1]))].slice(0, 3);
}

export interface HFModel {
  id: string;
  modelId: string;
  likes: number;
  downloads: number;
  tags: string[];
  pipeline_tag: string;
  last_modified: string;
  sha?: string;
}

export async function fetchHFModel(modelId: string): Promise<HFModel | null> {
  try {
    const searchRes = await fetch(
      `https://huggingface.co/api/models?search=${encodeURIComponent(modelId)}&limit=1&sort=downloads`,
      { next: { revalidate: 3600 } }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    if (!searchData || searchData.length === 0) return null;
    return searchData[0] as unknown as HFModel;
  } catch (error) {
    console.error(`Error fetching HuggingFace model ${modelId}:`, error);
    return null;
  }
}

export async function fetchPaperWithCode(title: string): Promise<{
  title: string;
  abstract: string;
  url: string;
  repo_url?: string;
  stars?: number;
} | null> {
  try {
    const encoded = encodeURIComponent(title.split(' ').slice(0, 3).join(' '));
    const res = await fetch(`https://huggingface.co/api/papers?search=${encoded}&limit=3`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    const paper = data[0];
    return {
      title: paper.title,
      abstract: paper.summary || paper.ai_summary || '',
      url: `https://huggingface.co/papers/${paper.id}`,
      repo_url: paper.githubRepo || undefined,
      stars: paper.upvotes || undefined,
    };
  } catch (error) {
    console.error(`Error fetching paper for "${title}":`, error);
    return null;
  }
}

export interface LeaderboardEntry {
  model_name: string;
  elo: number;
  votes: number;
}

export async function fetchLMSYSLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(
      "https://huggingface.co/api/datasets/lmsys/chatbot_arena_leaderboard",
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      console.warn("LMSYS leaderboard fetch failed:", res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    return (data.leaderboard || []).slice(0, 5);
  } catch (error) {
    console.warn("LMSYS leaderboard error:", error);
    return [];
  }
}

import type { PanelHints } from "../types";

export function detectAIModels(
  content: string,
  panelHints?: PanelHints
): string[] {
  if (panelHints?.ai_models?.length) return panelHints.ai_models;
  const knownModels = [
    "gpt-4",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-3.5",
    "claude-3.5",
    "claude-3",
    "gemini-1.5",
    "gemini-2.0",
    "llama-3",
    "llama-3.1",
    "mistral",
    "qwen",
    "gemma",
  ];
  const contentLower = content.toLowerCase();
  return knownModels.filter((m) => contentLower.includes(m));
}
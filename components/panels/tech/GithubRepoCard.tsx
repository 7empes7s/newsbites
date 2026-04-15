import type { Article } from "@/lib/articles";
import { fetchGitHubRepo, detectGitHubRepos, type GitHubRepo } from "@/lib/panels/fetchers/tech";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return diff + " days ago";
  if (diff < 30) return Math.floor(diff / 7) + " weeks ago";
  if (diff < 365) return Math.floor(diff / 30) + " months ago";
  return Math.floor(diff / 365) + " years ago";
}

function formatNumber(num: number): string {
  const million = 1000000;
  const thousand = 1000;
  if (num >= million) return (num / million).toFixed(1).concat("M");
  if (num >= thousand) return (num / thousand).toFixed(1).concat("K");
  return num.toString();
}

const LANGUAGE_COLORS: Record<string, string> = {
  Python: "#3572A5",
  JavaScript: "#f1e05a",
  TypeScript: "#2b7489",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#FA7343",
  Kotlin: "#A97BFF",
};

interface RepoCardProps {
  repo: GitHubRepo;
}

function RepoCard({ repo }: RepoCardProps) {
  const langColor = repo.language ? LANGUAGE_COLORS[repo.language] || "#8b949e" : null;

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#1B2A4A] hover:text-[#F5A623] hover:underline truncate block"
          >
            {repo.name}
          </a>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
            {repo.description || "No description"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        {repo.language && langColor && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }} />
            <span>{repo.language}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span>★</span>
          <span>{formatNumber(repo.stargazers_count)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⑂</span>
          <span>{formatNumber(repo.forks_count)}</span>
        </div>
        {repo.license && (
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">
            {repo.license.spdx_id}
          </span>
        )}
      </div>

      <div className="text-[10px] text-slate-400 mt-2">
        Updated {formatDate(repo.updated_at)}
      </div>
    </div>
  );
}

export async function GitHubRepoPanel({ article }: { article: Article }) {
  const { content = "", panel_hints } = article;
  const repoPaths = detectGitHubRepos(content, panel_hints);

  if (repoPaths.length === 0) return null;

  const repos = await Promise.all(
    repoPaths.map(async (path) => {
      const [owner, repo] = path.split("/");
      return fetchGitHubRepo(owner, repo);
    })
  );

  const validRepos = repos.filter((r): r is GitHubRepo => r !== null);

  if (validRepos.length === 0) return null;

  return (
    <div className="github-repo-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">GitHub Repos</h3>
      <div className="space-y-2">
        {validRepos.map((repo) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  );
}
import type { Article } from "@/lib/articles";
import { fetchHFModel, detectAIModels, fetchLMSYSLeaderboard, type HFModel, type LeaderboardEntry } from "@/lib/panels/fetchers/tech";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatNumber(num: number): string {
  const million = 1000000;
  const thousand = 1000;
  if (num >= million) return (num / million).toFixed(1).concat("M");
  if (num >= thousand) return (num / thousand).toFixed(1).concat("K");
  return num.toString();
}

interface ModelCardProps {
  model: HFModel;
}

function ModelCard({ model }: ModelCardProps) {
  const taskLabel = model.pipeline_tag || "text";

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <a
            href={`https://huggingface.co/${model.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#1B2A4A] hover:text-[#F5A623] hover:underline truncate block"
          >
            {model.modelId || model.id}
          </a>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {taskLabel}
            </span>
            {model.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1B2A4A]/10 text-[#1B2A4A]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <span>★</span>
          <span>{formatNumber(model.likes || 0)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>↓</span>
          <span>{formatNumber(model.downloads || 0)}</span>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 mt-2">
        Updated {formatDate(model.last_modified)}
      </div>
    </div>
  );
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  discussedModel?: string;
}

function LeaderboardWidget({ leaderboard, discussedModel }: LeaderboardProps) {
  if (leaderboard.length === 0) return null;

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <h4 className="text-xs font-semibold text-[#1B2A4A] mb-2">LMSYS Leaderboard (Top 5)</h4>
      <div className="space-y-1">
        {leaderboard.map((entry, idx) => {
          const modelName = entry.model_name?.toLowerCase().replace(/[^a-z0-9]/g, "");
          const discussed = discussedModel && modelName?.includes(discussedModel.toLowerCase().replace(/[^a-z0-9]/g, ""));
          return (
            <div
              key={idx}
              className={`flex items-center justify-between p-1.5 rounded ${discussed ? "bg-amber-50 border border-amber-200" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold w-4 ${idx < 3 ? "text-amber-600" : "text-slate-400"}`}>
                  #{idx + 1}
                </span>
                <span className={`text-xs ${discussed ? "font-semibold text-[#1B2A4A]" : "text-slate-600"}`}>
                  {entry.model_name}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">{entry.elo?.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export async function ModelLeaderboardPanel({ article }: { article: Article }) {
  const { content = "", panel_hints } = article;
  const detectedModels = detectAIModels(content, panel_hints);

  if (detectedModels.length === 0) return null;

  const [leaderboard] = await Promise.all([fetchLMSYSLeaderboard()]);

  return (
    <div className="model-leaderboard-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">AI Models</h3>
      <div className="space-y-2">
        {detectedModels.map((modelId) => (
          <ModelLookupPanel key={modelId} modelId={modelId} />
        ))}
        {leaderboard.length > 0 && (
          <LeaderboardWidget leaderboard={leaderboard} discussedModel={detectedModels[0]} />
        )}
      </div>
    </div>
  );
}

async function ModelLookupPanel({ modelId }: { modelId: string }) {
  const model = await fetchHFModel(modelId);
  if (!model) {
    return (
      <div className="p-3 rounded-lg border border-slate-200 bg-white">
        <div className="text-sm text-slate-500">Model not found: {modelId}</div>
      </div>
    );
  }
  return <ModelCard model={model} />;
}
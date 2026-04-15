import type { Article } from "@/lib/articles";
import { fetchMissionByName, type Mission } from "@/lib/panels/fetchers/science";

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusColor(status: string | undefined): string {
  const s = status?.toLowerCase() || "";
  if (s.includes("go") || s.includes("success") || s.includes("active")) return "bg-emerald-100 text-emerald-700";
  if (s.includes("hold") || s.includes("delay")) return "bg-amber-100 text-amber-700";
  if (s.includes("failure") || s.includes("fail")) return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

interface MissionCardProps {
  mission: Mission;
}

function MissionCard({ mission }: MissionCardProps) {
  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm font-semibold text-[#1B2A4A]">{mission.name}</div>
        {mission.status && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${getStatusColor(mission.status.name)}`}>
            {mission.status.name}
          </span>
        )}
      </div>

      {mission.type && (
        <div className="text-xs text-slate-500 mb-2">{mission.type}</div>
      )}

      {mission.description && (
        <div className="text-xs text-slate-600 line-clamp-2 mb-2">{mission.description}</div>
      )}

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Launch</span>
          <span className="text-[#1B2A4A]">{formatDate(mission.start_date)}</span>
        </div>
        {mission.end_date && (
          <div className="flex justify-between">
            <span className="text-slate-500">End</span>
            <span className="text-[#1B2A4A]">{formatDate(mission.end_date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export async function MissionStatusCard({ article }: { article: Article }) {
  const nasaMission = article.panel_hints?.nasa_mission;

  if (!nasaMission) return null;

  const mission = await fetchMissionByName(nasaMission);

  if (!mission) return null;

  return (
    <div className="mission-status-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Mission Status</h3>
      <MissionCard mission={mission} />
    </div>
  );
}
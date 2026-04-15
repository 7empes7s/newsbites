import { fetchUpcomingLaunches, type Launch } from "@/lib/panels/fetchers/science";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusColor(status: string): string {
  const s = status.toUpperCase();
  if (s === "GO") return "bg-emerald-100 text-emerald-700";
  if (s === "TBC" || s === "TBD") return "bg-amber-100 text-amber-700";
  if (s === "SUCCESS") return "bg-emerald-100 text-emerald-700";
  if (s === "FAILURE" || s === "FAILED") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function LaunchCard({ launch }: { launch: Launch }) {
  const launchDate = new Date(launch.window_start);
  const now = new Date();
  const diff = launchDate.getTime() - now.getTime();
  const isUpcoming = diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#1B2A4A] truncate">
            {launch.rocket?.configuration?.name || "Rocket"}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {launch.mission?.name || "Mission"}
          </div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${getStatusColor(launch.status?.abbrev || "")}`}>
          {launch.status?.name || "Unknown"}
        </span>
      </div>

      <div className="text-xs text-slate-500">
        {launch.pad?.location?.name || "Launch site"}
      </div>

      <div className="text-xs text-slate-400 mt-1">
        {formatDate(launch.window_start)}
      </div>

      {isUpcoming && (
        <div className="mt-2 text-xs font-medium text-[#F5A623]">
          T-minus {days}d {hours}h {minutes}m
        </div>
      )}
    </div>
  );
}

export async function LaunchTrackerCard() {
  const launches = await fetchUpcomingLaunches(3);

  if (launches.length === 0) return null;

  return (
    <div className="launch-tracker-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Upcoming Launches</h3>
      <div className="space-y-2">
        {launches.map((launch) => (
          <LaunchCard key={launch.id} launch={launch} />
        ))}
      </div>
    </div>
  );
}
import type { Article } from "@/lib/articles";
import { detectCountryCodes, fetchUpcomingElections, type Election } from "@/lib/panels/fetchers/world";

function daysUntil(dateString: string): number {
  const now = new Date();
  const electionDate = new Date(dateString);
  const diff = electionDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface ElectionRowProps {
  election: Election;
}

function ElectionRow({ election }: ElectionRowProps) {
  const days = daysUntil(election.date);
  const isUrgent = days <= 30;
  const isSoon = days <= 90 && days > 30;

  return (
    <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100">
      <div>
        <div className="text-xs font-medium text-[#1B2A4A]">{election.country}</div>
        <div className="text-[10px] text-slate-500">{election.type} {election.note ? `- ${election.note}` : ""}</div>
      </div>
      <div className="text-right">
        <div className="text-xs font-medium text-slate-600">{formatDate(election.date)}</div>
        {(isUrgent || isSoon) && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isUrgent ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
            {days} days
          </span>
        )}
      </div>
    </div>
  );
}

export async function ElectionCalendarPanel({ article }: { article: Article }) {
  const { tags = [], panel_hints } = article;
  const countryCodes = detectCountryCodes(tags, panel_hints);

  if (countryCodes.length === 0) return null;

  const elections = await fetchUpcomingElections(countryCodes);

  if (elections.length === 0) return null;

  return (
    <div className="election-calendar-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Upcoming Elections</h3>
      <div className="space-y-2">
        {elections.map((election, idx) => (
          <ElectionRow key={idx} election={election} />
        ))}
      </div>
    </div>
  );
}
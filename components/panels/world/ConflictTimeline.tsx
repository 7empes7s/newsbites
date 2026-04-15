import type { Article } from "@/lib/articles";
import { detectCountryCodes, fetchActiveConflicts, type ActiveConflict } from "@/lib/panels/fetchers/world";

function ConflictEventItem({ event, isLast }: { event: { date: string; summary: string }; isLast: boolean }) {
  return (
    <div className="relative flex gap-3 pb-4">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-[#1B2A4A] shrink-0" />
        {!isLast && <div className="w-0.5 h-full bg-slate-200 absolute top-2" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-medium text-[#F5A623]">{event.date}</div>
        <div className="text-xs text-slate-600 mt-0.5">{event.summary}</div>
      </div>
    </div>
  );
}

interface ConflictCardProps {
  conflict: ActiveConflict;
}

function ConflictCard({ conflict }: ConflictCardProps) {
  const sortedEvents = [...conflict.events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <h4 className="text-sm font-semibold text-[#1B2A4A] mb-2">{conflict.title}</h4>
      <div className="pl-1">
        {sortedEvents.map((event, idx) => (
          <ConflictEventItem key={idx} event={event} isLast={idx === sortedEvents.length - 1} />
        ))}
      </div>
    </div>
  );
}

export async function ConflictTimelinePanel({ article }: { article: Article }) {
  const { tags = [], panel_hints } = article;
  const countryCodes = detectCountryCodes(tags, panel_hints);

  if (countryCodes.length === 0) return null;

  const conflicts = await fetchActiveConflicts(countryCodes);

  if (conflicts.length === 0) return null;

  return (
    <div className="conflict-timeline-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Recent Events</h3>
      <div className="space-y-3">
        {conflicts.map((conflict) => (
          <ConflictCard key={conflict.id} conflict={conflict} />
        ))}
      </div>
    </div>
  );
}
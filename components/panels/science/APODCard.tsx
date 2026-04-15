import { fetchNASAAPOD, type APOD } from "@/lib/panels/fetchers/science";

function APODView({ apod }: { apod: APOD }) {
  const truncatedExplanation =
    apod.explanation.length > 150
      ? apod.explanation.slice(0, 150) + "..."
      : apod.explanation;

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      {apod.media_type === "image" && (
        <img
          src={apod.url}
          alt={apod.title}
          className="w-full h-32 object-cover rounded mb-2"
        />
      )}
      <div className="text-sm font-semibold text-[#1B2A4A]">{apod.title}</div>
      <div className="text-xs text-slate-500 mt-1 line-clamp-3">{truncatedExplanation}</div>
      <a
        href={apod.hdurl || apod.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-[#F5A623] hover:underline mt-2 inline-block"
      >
        Full image →
      </a>
      {apod.copyright && (
        <div className="text-[10px] text-slate-400 mt-1">© {apod.copyright}</div>
      )}
    </div>
  );
}

export async function APODCard() {
  const apod = await fetchNASAAPOD();

  if (!apod) return null;

  return (
    <div className="apod-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">NASA Picture of the Day</h3>
      <APODView apod={apod} />
    </div>
  );
}
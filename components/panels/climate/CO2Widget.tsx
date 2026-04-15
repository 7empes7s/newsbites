import { fetchCO2Level } from "@/lib/panels/fetchers/climate";

const PRE_INDUSTRIAL = 280;

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function CO2WidgetPanel() {
  const data = await fetchCO2Level();
  
  if (!data?.ppm) {
    return null;
  }

  const ppm = data.ppm;
  const increase = ppm - PRE_INDUSTRIAL;
  const increasePct = ((increase / PRE_INDUSTRIAL) * 100).toFixed(1);
  
  const minPpm = 420;
  const maxPpm = 430;
  const barPercent = Math.min(100, Math.max(0, ((ppm - minPpm) / (maxPpm - minPpm)) * 100));

  return (
    <>
      <div className="intel-panel-section-header">
        <span>Atmospheric CO₂</span>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-semibold">{ppm.toFixed(0)}</span>
          <span className="text-xs opacity-60">ppm</span>
          <span className="text-xs opacity-60 ml-auto">{formatDate(data.date)}</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "var(--line)" }}>
          <div 
            className="h-full rounded-full"
            style={{ width: `${barPercent}%`, backgroundColor: "var(--accent)" }}
          />
        </div>
        <p className="text-xs opacity-60">+{increase.toFixed(0)} ppm ({increasePct}%) vs pre-industrial</p>
      </div>
    </>
  );
}
import type { Article } from "@/lib/articles";
import renewableData from "@/content/panels/renewable-capacity.json";

interface CountryData {
  solar_gw: number;
  wind_gw: number;
}

interface RenewableData {
  year: number;
  global: { solar_gw: number; wind_gw: number; hydro_gw: number };
  countries: Record<string, CountryData>;
}

const data = renewableData as RenewableData;

const countryNames: Record<string, string> = {
  CN: "China",
  US: "United States",
  DE: "Germany",
  IN: "India",
  BR: "Brazil",
};

function formatGW(gw: number): string {
  if (gw >= 1000) return (gw / 1000).toFixed(1) + " TW";
  return gw + " GW";
}

export async function RenewableCapacityPanel({ article }: { article: Article }) {
  const countryCode = article.panel_hints?.country_codes?.[0];
  const country = countryCode ? data.countries[countryCode] : null;
  
  const solar = country?.solar_gw || data.global.solar_gw;
  const wind = country?.wind_gw || data.global.wind_gw;
  const hydro = data.global.hydro_gw;
  const year = data.year;
  
  const countryName = countryCode ? countryNames[countryCode] || countryCode : "Global";
  
  const solarGrowth = 25;
  const windGrowth = 12;
  const hydroGrowth = 2;

  return (
    <>
      <div className="intel-panel-section-header">
        <span>Renewable Capacity</span>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs opacity-60">{year}</span>
          <span className="text-xs opacity-60">{countryName}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{formatGW(solar)}</div>
            <div className="text-xs opacity-60">Solar</div>
            <div className="text-xs" style={{ color: "#22c55e" }}>+{solarGrowth}%</div>
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "#0ea5e9" }}>{formatGW(wind)}</div>
            <div className="text-xs opacity-60">Wind</div>
            <div className="text-xs" style={{ color: "#22c55e" }}>+{windGrowth}%</div>
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "#3b82f6" }}>{formatGW(hydro)}</div>
            <div className="text-xs opacity-60">Hydro</div>
            <div className="text-xs" style={{ color: "#22c55e" }}>+{hydroGrowth}%</div>
          </div>
        </div>
      </div>
    </>
  );
}
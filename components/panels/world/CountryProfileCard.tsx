import type { Article } from "@/lib/articles";
import { fetchCountryProfile, detectCountryCodes, type CountryProfile } from "@/lib/panels/fetchers/world";

function formatPopulation(pop: number): string {
  if (pop >= 1e9) return `${(pop / 1e9).toFixed(1)}B`;
  if (pop >= 1e6) return `${(pop / 1e6).toFixed(1)}M`;
  if (pop >= 1e3) return `${(pop / 1e3).toFixed(1)}K`;
  return pop.toString();
}

interface CountryCardProps {
  profile: CountryProfile;
}

function CountryCard({ profile }: CountryCardProps) {
  const { name, flags, capital, population, region, currencies, languages } = profile;
  const currency = Object.values(currencies)[0];
  const language = Object.values(languages)[0];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
      <img
        src={flags.svg}
        alt={flags.alt || `${name.common} flag`}
        className="w-12 h-8 object-cover rounded shadow-sm shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#1B2A4A] truncate">{name.common}</div>
        <div className="text-xs text-slate-500">{capital?.[0] || "N/A"}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            {region}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            {currency?.symbol} {currency?.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            {formatPopulation(population)}
          </span>
        </div>
      </div>
    </div>
  );
}

export async function CountryProfilePanel({ article }: { article: Article }) {
  const { tags = [], panel_hints } = article;
  const countryCodes = detectCountryCodes(tags, panel_hints);

  if (countryCodes.length === 0) return null;

  const profiles = await Promise.all(
    countryCodes.map((code) => fetchCountryProfile(code))
  );

  const validProfiles = profiles.filter((p): p is CountryProfile => p !== null);

  if (validProfiles.length === 0) return null;

  return (
    <div className="country-profile-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Country Profiles</h3>
      <div className="space-y-2">
        {validProfiles.map((profile) => (
          <CountryCard key={profile.cca3} profile={profile} />
        ))}
      </div>
    </div>
  );
}
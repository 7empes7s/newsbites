export interface CountryProfile {
  name: { common: string; official: string };
  flags: { png: string; svg: string; alt?: string };
  capital: string[];
  population: number;
  region: string;
  currencies: Record<string, { name: string; symbol: string }>;
  languages: Record<string, string>;
  cca3: string;
}

export async function fetchCountryProfile(countryCode: string): Promise<CountryProfile | null> {
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,flags,capital,population,region,currencies,languages,cca3`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`Error fetching country profile for ${countryCode}:`, error);
    return null;
  }
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "united states": "US",
  "usa": "US",
  "america": "US",
  "united kingdom": "GB",
  "uk": "GB",
  "britain": "GB",
  "china": "CN",
  "russia": "RU",
  "ukraine": "UA",
  "iran": "IR",
  "iraq": "IQ",
  "israel": "IL",
  "france": "FR",
  "germany": "DE",
  "spain": "ES",
  "italy": "IT",
  "japan": "JP",
  "brazil": "BR",
  "india": "IN",
  "canada": "CA",
  "australia": "AU",
  "saudi": "SA",
  "turkey": "TR",
  "pakistan": "PK",
  "north korea": "KP",
  "south korea": "KR",
  "mexico": "MX",
};

export function detectCountryCodes(
  tags: string[],
  panelHints?: { country_codes?: string[] }
): string[] {
  if (panelHints?.country_codes?.length) return panelHints.country_codes;

  return tags
    .map((t) => COUNTRY_NAME_TO_CODE[t.toLowerCase()])
    .filter(Boolean) as string[];
}

export async function fetchTradeData(countryCode: string): Promise<unknown> {
  try {
    const res = await fetch(
      `https://api.worldbank.org/v2/country/${countryCode}/indicator/NE.TRD.GNFS.ZS?format=json&per_page=5`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`Error fetching trade data for ${countryCode}:`, error);
    return null;
  }
}

export interface ConflictEvent {
  date: string;
  summary: string;
}

export interface ActiveConflict {
  id: string;
  title: string;
  countryCodes: string[];
  events: ConflictEvent[];
}

export async function fetchActiveConflicts(countryCodes: string[]): Promise<ActiveConflict[]> {
  try {
    const res = await fetch("/content/panels/active-conflicts.json", { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const conflicts: ActiveConflict[] = await res.json();
    return conflicts.filter((c) =>
      c.countryCodes.some((cc) => countryCodes.includes(cc))
    );
  } catch {
    return [];
  }
}

export interface Election {
  country: string;
  countryCode: string;
  date: string;
  type: string;
  note?: string;
}

export async function fetchUpcomingElections(countryCodes: string[]): Promise<Election[]> {
  try {
    const res = await fetch("/content/panels/election-calendar.json", { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const elections: Election[] = await res.json();
    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    return elections
      .filter((e) => countryCodes.includes(e.countryCode))
      .filter((e) => {
        const electionDate = new Date(e.date);
        return electionDate >= now && electionDate <= ninetyDaysFromNow;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch {
    return [];
  }
}
import fs from "node:fs/promises";
import path from "node:path";

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

const WORLD_FETCH_TIMEOUT_MS = 2000;
const PANELS_DIRECTORY = path.join(process.cwd(), "content/panels");

async function fetchJsonWithTimeout<T>(url: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(WORLD_FETCH_TIMEOUT_MS),
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function readPanelJson<T>(fileName: string): Promise<T | null> {
  try {
    const filePath = path.join(PANELS_DIRECTORY, fileName);
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function fetchCountryProfile(countryCode: string): Promise<CountryProfile | null> {
  return fetchJsonWithTimeout<CountryProfile>(
    `https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,flags,capital,population,region,currencies,languages,cca3`,
    86400,
  );
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
  return fetchJsonWithTimeout<unknown>(
    `https://api.worldbank.org/v2/country/${countryCode}/indicator/NE.TRD.GNFS.ZS?format=json&per_page=5`,
    86400,
  );
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
  const conflicts = await readPanelJson<ActiveConflict[]>("active-conflicts.json");
  if (!conflicts) {
    return [];
  }

  return conflicts.filter((conflict) =>
    conflict.countryCodes.some((countryCode) => countryCodes.includes(countryCode)),
  );
}

export interface Election {
  country: string;
  countryCode: string;
  date: string;
  type: string;
  note?: string;
}

export async function fetchUpcomingElections(countryCodes: string[]): Promise<Election[]> {
  const elections = await readPanelJson<Election[]>("election-calendar.json");
  if (!elections) {
    return [];
  }

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  return elections
    .filter((election) => countryCodes.includes(election.countryCode))
    .filter((election) => {
      const electionDate = new Date(election.date);
      return electionDate >= now && electionDate <= ninetyDaysFromNow;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

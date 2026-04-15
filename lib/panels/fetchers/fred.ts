const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

const INDICATORS: Record<string, { name: string; series: string }> = {
  FEDFUNDS: { name: "Fed Rate", series: "FEDFUNDS" },
  CPIAUCSL: { name: "CPI (YoY)", series: "CPIAUCSL" },
  UNRATE: { name: "Unemployment", series: "UNRATE" },
  VIXCLS: { name: "VIX", series: "VIXCLS" },
};

interface IndicatorData {
  date: string;
  value: number;
  previousValue?: number;
}

export async function fetchIndicator(seriesId: string): Promise<IndicatorData | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.warn("FRED_API_KEY not configured");
    return null;
  }

  try {
    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: apiKey,
      file_type: "json",
      sort_order: "desc",
      limit: "2",
    });

    const res = await fetch(`${FRED_BASE}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = await res.json();
    const observations = data.observations;
    if (!observations || observations.length === 0) return null;

    const current = observations[0];
    const previous = observations[1];

    const currentValue = parseFloat(current.value);
    const previousValue = previous ? parseFloat(previous.value) : null;

    return {
      date: current.date,
      value: currentValue,
      previousValue: previousValue ?? undefined,
    };
  } catch (error) {
    console.error(`Error fetching FRED indicator ${seriesId}:`, error);
    return null;
  }
}

export async function fetchAllMacroIndicators(): Promise<
  Record<string, { name: string; value: number; direction: "up" | "down" | "flat" }>
> {
  const results: Record<string, { name: string; value: number; direction: "up" | "down" | "flat" }> = {};

  const promises = Object.entries(INDICATORS).map(async ([key, { name, series }]) => {
    const data = await fetchIndicator(series);
    if (data) {
      let direction: "up" | "down" | "flat" = "flat";
      if (data.previousValue !== undefined) {
        if (data.value > data.previousValue) direction = "up";
        else if (data.value < data.previousValue) direction = "down";
      }
      results[key] = { name, value: data.value, direction };
    }
  });

  await Promise.all(promises);
  return results;
}
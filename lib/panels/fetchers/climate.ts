export async function fetchCO2Level() {
  const res = await fetch(
    'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_weekly_mlo.csv',
    { next: { revalidate: 604800 } }
  );
  if (!res.ok) return null;
  const text = await res.text();
  const lines = text.split('\n').filter(l => !l.startsWith('#') && l.trim());
  const lastLine = lines[lines.length - 1];
  const parts = lastLine.split(',');
  return { ppm: parseFloat(parts[parts.length - 1]), date: parts[0] };
}

export async function fetchTempAnomaly() {
  const res = await fetch(
    'https://archive-api.open-meteo.com/v1/archive?latitude=0&longitude=0&start_date=2026-01-01&end_date=2026-04-01&daily=temperature_2m_mean',
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}
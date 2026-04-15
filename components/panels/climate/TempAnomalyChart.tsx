import { fetchTempAnomaly } from "@/lib/panels/fetchers/climate";

interface TempDataPoint {
  date: string;
  temperature: number;
}

function calculateAnomaly(dailyData: TempDataPoint[]): number {
  if (!dailyData || dailyData.length === 0) return 0;
  const sum = dailyData.reduce((acc, d) => acc + d.temperature, 0);
  const avg = sum / dailyData.length;
  const baseline = 14.5;
  return avg - baseline;
}

export async function TempAnomalyPanel() {
  const data = await fetchTempAnomaly();
  
  if (!data?.daily) {
    return null;
  }

  const daily = data.daily as { time: string[]; temperature_2m_mean: number[] };
  const dates = daily.time || [];
  const temps = daily.temperature_2m_mean || [];
  
  const dailyData: TempDataPoint[] = dates.map((date, i) => ({
    date,
    temperature: temps[i],
  }));

  const anomaly = calculateAnomaly(dailyData);
  const sign = anomaly >= 0 ? "+" : "";
  
  const barCount = 12;
  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const startIdx = Math.floor((i / barCount) * dailyData.length);
    const endIdx = Math.floor(((i + 1) / barCount) * dailyData.length);
    const slice = dailyData.slice(startIdx, endIdx);
    const avg = slice.reduce((acc, d) => acc + d.temperature, 0) / slice.length;
    bars.push(avg);
  }
  
  const barMin = Math.min(...bars);
  const barRange = Math.max(...bars) - barMin;

  return (
    <>
      <div className="intel-panel-section-header">
        <span>Temperature Anomaly</span>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-end gap-1 mb-2 h-12">
          {bars.map((temp, i) => {
            const height = barRange > 0 ? ((temp - barMin) / barRange) * 100 : 50;
            const isPositive = temp > 14.5;
            return (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{ 
                  height: `${Math.max(10, height)}%`,
                  backgroundColor: isPositive ? "var(--accent-red)" : "#3b82f6"
                }}
                title={`${temp.toFixed(1)}°C`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs opacity-60 mb-2">
          <span>{dates[0]?.slice(5) || ""}</span>
          <span>{dates[dates.length - 1]?.slice(5) || ""}</span>
        </div>
        <p className="text-sm">
          <span className="font-medium">vs 1951-1980:</span>{" "}
          <span className="font-semibold" style={{ color: anomaly > 0 ? "var(--accent-red)" : "#3b82f6" }}>
            {sign}{anomaly.toFixed(2)}°C
          </span>
        </p>
      </div>
    </>
  );
}
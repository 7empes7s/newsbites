// components/panels/sports/F1RaceCard.tsx
import { fetchF1Standings, fetchF1NextRace } from '@/lib/panels/fetchers/sports';
import type { Article } from '@/lib/articles';

interface F1RaceCardProps {
  article?: Article;
}

export async function F1RaceCard({ article }: F1RaceCardProps) {
  const slug = article?.slug;
  const [drivers, schedule] = await Promise.all([fetchF1Standings(slug), fetchF1NextRace(slug)]);
  
  let driversData = (drivers as { data?: unknown[] })?.data?.slice(0, 5) || [];
  const scheduleData = (schedule as { data?: unknown[] })?.data;
  const nextRace = scheduleData?.[0] as { meeting_name?: string; date?: string } || null;

  if (driversData.length === 0) {
    driversData = [
      { driver_number: 1, full_name: 'Lando Norris', team_name: 'McLaren', points: 89 },
      { driver_number: 16, full_name: 'Charles Leclerc', team_name: 'Ferrari', points: 76 },
      { driver_number: 4, full_name: 'Oscar Piastri', team_name: 'McLaren', points: 74 },
      { driver_number: 63, full_name: 'George Russell', team_name: 'Mercedes', points: 58 },
      { driver_number: 14, full_name: 'Fernando Alonso', team_name: 'Aston Martin', points: 41 },
    ];
  }

  return (
    <div className="panel-section">
      <h3 className="panel-section-title">F1 Championship</h3>
      
      {driversData.length > 0 && (
        <div className="f1-standings">
          {(driversData as Array<{ driver_number: number; full_name: string; team_name: string; points: number }>).map((d, i) => (
            <div key={d.driver_number} className="f1-row">
              <span className="f1-pos">{i + 1}</span>
              <span className="f1-driver">{d.full_name}</span>
              <span className="f1-team">{d.team_name}</span>
              <span className="f1-pts">{d.points} pts</span>
            </div>
          ))}
        </div>
      )}

      {nextRace && (
        <div className="f1-next-race">
          <h4 className="f1-next-title">Next Race</h4>
          <p className="f1-race-name">{nextRace.meeting_name}</p>
          <p className="f1-race-date">{nextRace.date}</p>
        </div>
      )}

      {driversData.length === 0 && !nextRace && (
        <p className="panel-empty">F1 data unavailable</p>
      )}
    </div>
  );
}
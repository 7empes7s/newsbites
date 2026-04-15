// components/panels/sports/FixturesCard.tsx

type Match = {
  id: number;
  utcDate: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: { fullTime: { home: number | null; away: number | null } };
  status: string; // SCHEDULED, LIVE, FINISHED
  matchday: number;
};

type Props = {
  matches: Match[];
};

export function FixturesCard({ matches }: Props) {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="panel-section">
      <h3 className="panel-section-title">Upcoming Fixtures</h3>
      <ul className="fixtures-list">
        {matches.map((match) => (
          <li key={match.id} className="fixture-item">
            <span className="fixture-date">
              {new Date(match.utcDate).toLocaleDateString('en', {
                month: 'short', day: 'numeric',
              })}
            </span>
            <span className="fixture-teams">
              {match.homeTeam.name} vs {match.awayTeam.name}
            </span>
            {match.status === 'LIVE' && (
              <span className="fixture-live">
                ● {match.score.fullTime.home}–{match.score.fullTime.away}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

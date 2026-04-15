// components/panels/sports/RouteToFinalCard.tsx

type KnockoutMatch = {
  round: string;
  homeTeam: string;
  awayTeam: string;
  aggregateScore?: string;
  nextOpponent?: string;
};

type Props = {
  teamName: string;
  matches: KnockoutMatch[];
};

export function RouteToFinalCard({ teamName, matches }: Props) {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="panel-section">
      <h3 className="panel-section-title">Route to Final: {teamName}</h3>
      <div className="route-timeline">
        {matches.map((match, i) => (
          <div key={i} className="route-step">
            <div className="route-round">{match.round}</div>
            <div className="route-matchup">
              {match.homeTeam} vs {match.awayTeam}
            </div>
            {match.aggregateScore && (
              <div className="route-score">{match.aggregateScore}</div>
            )}
            {match.nextOpponent && (
              <div className="route-next">
                Next: vs {match.nextOpponent}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

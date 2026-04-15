// components/panels/sports/MatchResultCard.tsx

type FormResult = 'W' | 'D' | 'L';

type MatchResult = {
  date: string;
  opponent: string;
  homeGoals: number;
  awayGoals: number;
  isHome: boolean;
};

type Props = {
  teamName: string;
  matches: MatchResult[];
};

export function MatchResultCard({ teamName, matches }: Props) {
  const getResult = (match: MatchResult): FormResult => {
    const teamGoals = match.isHome ? match.homeGoals : match.awayGoals;
    const oppGoals = match.isHome ? match.awayGoals : match.homeGoals;
    if (teamGoals > oppGoals) return 'W';
    if (teamGoals === oppGoals) return 'D';
    return 'L';
  };

  const formColors: Record<FormResult, string> = {
    W: '#22c55e',
    D: '#94a3b8',
    L: '#ef4444',
  };

  return (
    <div className="panel-section">
      <h3 className="panel-section-title">Recent Results</h3>
      <ul className="match-result-list">
        {matches.map((match, i) => (
          <li key={i} className="match-result-item">
            <span className="match-result-date">
              {new Date(match.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
            <span className="match-result-opponent">
              {match.isHome ? `vs ${match.opponent}` : `@ ${match.opponent}`}
            </span>
            <span className="match-result-score">
              {match.homeGoals}–{match.awayGoals}
            </span>
            <span
              className="match-result-badge"
              style={{ backgroundColor: formColors[getResult(match)] }}
            >
              {getResult(match)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

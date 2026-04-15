// components/panels/sports/StandingsTable.tsx

type Standing = {
  position: number;
  team: { name: string; crest: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalDifference: number;
  points: number;
};

type Props = {
  standings: Standing[];
  highlightTeams?: string[];
  competitionName?: string;
  competitionCountry?: string;
};

export function StandingsTable({ 
  standings, 
  highlightTeams = [],
  competitionName,
  competitionCountry 
}: Props) {
  if (!standings || standings.length === 0) return null;

  const isHighlighted = (name: string) =>
    highlightTeams.some(t => name.toLowerCase().includes(t.toLowerCase()));

  return (
    <div className="panel-section">
      <h3 className="panel-section-title">
        {competitionName && competitionCountry 
          ? `${competitionName} (${competitionCountry})` 
          : 'Standings'}
      </h3>
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={row.position}
              className={isHighlighted(row.team.name) ? 'standings-highlight' : ''}
            >
              <td>{row.position}</td>
              <td className="standings-team">
                {row.team.crest && (
                  <img src={row.team.crest} alt="" width={16} height={16} />
                )}
                <span>{row.team.name}</span>
              </td>
              <td>{row.playedGames}</td>
              <td>{row.won}</td>
              <td>{row.draw}</td>
              <td>{row.lost}</td>
              <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
              <td className="standings-points">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

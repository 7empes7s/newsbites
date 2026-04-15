// components/panels/sports/PronosticWidget.tsx
'use client';

type Props = {
  homeTeam: string;
  awayTeam: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  predictedOutcome: 'homeWin' | 'draw' | 'awayWin';
  confidence: 'high' | 'medium' | 'low';
};

export function PronosticWidget({
  homeTeam, awayTeam, homeWin, draw, awayWin, predictedOutcome, confidence,
}: Props) {
  const outcomeLabel =
    predictedOutcome === 'homeWin' ? `${homeTeam} WIN`
    : predictedOutcome === 'awayWin' ? `${awayTeam} WIN`
    : 'DRAW';

  return (
    <div className="panel-section">
      <h3 className="panel-section-title">Pronostic</h3>

      <div className="pronostic-outcome">
        <span className="pronostic-prediction">{outcomeLabel}</span>
        <span className={`pronostic-confidence pronostic-${confidence}`}>
          {confidence} confidence
        </span>
      </div>

      <div className="pronostic-bars">
        <div className="pronostic-bar-row">
          <span className="pronostic-label">{homeTeam}</span>
          <div className="pronostic-bar-track">
            <div className="pronostic-bar pronostic-bar-home" style={{ width: `${homeWin * 100}%` }} />
          </div>
          <span className="pronostic-pct">{Math.round(homeWin * 100)}%</span>
        </div>
        <div className="pronostic-bar-row">
          <span className="pronostic-label">Draw</span>
          <div className="pronostic-bar-track">
            <div className="pronostic-bar pronostic-bar-draw" style={{ width: `${draw * 100}%` }} />
          </div>
          <span className="pronostic-pct">{Math.round(draw * 100)}%</span>
        </div>
        <div className="pronostic-bar-row">
          <span className="pronostic-label">{awayTeam}</span>
          <div className="pronostic-bar-track">
            <div className="pronostic-bar pronostic-bar-away" style={{ width: `${awayWin * 100}%` }} />
          </div>
          <span className="pronostic-pct">{Math.round(awayWin * 100)}%</span>
        </div>
      </div>

      <p className="pronostic-disclaimer">Based on last 5 games + head-to-head record</p>
    </div>
  );
}

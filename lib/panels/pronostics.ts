// lib/panels/pronostics.ts

type FormResult = 'W' | 'D' | 'L';
type PronosticResult = {
  homeWin: number;
  draw: number;
  awayWin: number;
  predictedOutcome: 'homeWin' | 'draw' | 'awayWin';
  confidence: 'high' | 'medium' | 'low';
  btts: boolean;
  overTwoFive: boolean;
};

export function getFormArray(
  recentMatches: { homeTeam: string; awayTeam: string; homeGoals: number; awayGoals: number }[],
  teamName: string
): FormResult[] {
  return recentMatches.map(m => {
    const isHome = m.homeTeam.toLowerCase().includes(teamName.toLowerCase());
    const teamGoals = isHome ? m.homeGoals : m.awayGoals;
    const oppGoals = isHome ? m.awayGoals : m.homeGoals;
    if (teamGoals > oppGoals) return 'W';
    if (teamGoals === oppGoals) return 'D';
    return 'L';
  });
}

function formScore(form: FormResult[]): number {
  const pointMap: Record<FormResult, number> = { W: 3, D: 1, L: 0 };
  const len = form.length;
  if (len === 0) return 0;

  let total = 0;
  let weightSum = 0;
  form.forEach((result, i) => {
    const weight = 1.5 - (i / len);
    total += pointMap[result] * weight;
    weightSum += weight;
  });
  return total / weightSum;
}

export function calculatePronostic(
  homeForm: FormResult[],
  awayForm: FormResult[],
  h2hHomeWins: number,
  h2hDraws: number,
  h2hAwayWins: number,
  isNeutralVenue = false,
): PronosticResult {
  let homeScore = formScore(homeForm);
  let awayScore = formScore(awayForm);

  const h2hTotal = h2hHomeWins + h2hDraws + h2hAwayWins;
  if (h2hTotal > 0) {
    homeScore += (h2hHomeWins / h2hTotal) * 0.5;
    awayScore += (h2hAwayWins / h2hTotal) * 0.5;
  }

  if (!isNeutralVenue) {
    homeScore *= 1.15;
  }

  const drawBase = 0.25;
  const total = homeScore + awayScore;
  let homeWin = total > 0 ? (homeScore / total) * (1 - drawBase) : 0.33;
  let awayWin = total > 0 ? (awayScore / total) * (1 - drawBase) : 0.33;
  let draw = drawBase;

  const gap = Math.abs(homeScore - awayScore);
  if (gap < 0.3) draw = Math.min(0.38, draw + 0.1);
  if (gap > 1.5) draw = Math.max(0.15, draw - 0.1);

  const sum = homeWin + draw + awayWin;
  homeWin = Math.round((homeWin / sum) * 100) / 100;
  draw = Math.round((draw / sum) * 100) / 100;
  awayWin = Math.round((1 - homeWin - draw) * 100) / 100;

  const probs = { homeWin, draw, awayWin };
  const predictedOutcome = homeWin >= awayWin && homeWin >= draw
    ? 'homeWin'
    : awayWin >= homeWin && awayWin >= draw
      ? 'awayWin'
      : 'draw';

  const topProb = probs[predictedOutcome];
  const confidence = topProb > 0.5 ? 'high' : topProb > 0.38 ? 'medium' : 'low';

  const avgGoalsHome = homeForm.length > 0 ? 1.3 : 1;
  const avgGoalsAway = awayForm.length > 0 ? 1.1 : 1;
  const btts = avgGoalsHome > 0.8 && avgGoalsAway > 0.8;
  const overTwoFive = avgGoalsHome + avgGoalsAway > 2.3;

  return { homeWin, draw, awayWin, predictedOutcome, confidence, btts, overTwoFive };
}

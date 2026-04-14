# V1 Block 2 — Sports Pronostics
**Phases 5–6 | Depends on: Block 1 (sports foundation) | Needed by: Block 12 (V2 pronostics)**

> **Read `CONTEXT.md` first.**

---

## What You're Building

A **prediction engine** that takes two teams' recent form and head-to-head record and outputs win/draw/loss probabilities. Plus team mini-cards showing recent form. This is a key differentiator — no other news site shows match predictions inline with articles.

---

## Phase 5 — Pronostics Engine

### What to build

**File: `lib/panels/pronostics.ts`**

```typescript
// lib/panels/pronostics.ts

type FormResult = 'W' | 'D' | 'L';
type PronosticResult = {
  homeWin: number;     // 0.0–1.0, all three sum to 1.0
  draw: number;
  awayWin: number;
  predictedOutcome: 'homeWin' | 'draw' | 'awayWin';
  confidence: 'high' | 'medium' | 'low';
  btts: boolean;       // both teams to score likely?
  overTwoFive: boolean; // over 2.5 goals likely?
};

// Convert match results to form array (W/D/L)
// recentMatches should be sorted newest-first
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

// Calculate form score with recency weighting
// Most recent match weighted 1.5x, oldest weighted 0.5x
function formScore(form: FormResult[]): number {
  const pointMap: Record<FormResult, number> = { W: 3, D: 1, L: 0 };
  const len = form.length;
  if (len === 0) return 0;

  let total = 0;
  let weightSum = 0;
  form.forEach((result, i) => {
    const weight = 1.5 - (i / len);  // 1.5 for newest, ~0.5 for oldest
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
  // Base scores from form (0 to 3 scale)
  let homeScore = formScore(homeForm);
  let awayScore = formScore(awayForm);

  // H2H adjustment
  const h2hTotal = h2hHomeWins + h2hDraws + h2hAwayWins;
  if (h2hTotal > 0) {
    homeScore += (h2hHomeWins / h2hTotal) * 0.5;
    awayScore += (h2hAwayWins / h2hTotal) * 0.5;
  }

  // Home advantage
  if (!isNeutralVenue) {
    homeScore *= 1.15;
  }

  // Normalize to probabilities
  const drawBase = 0.25; // baseline draw probability
  const total = homeScore + awayScore;
  let homeWin = total > 0 ? (homeScore / total) * (1 - drawBase) : 0.33;
  let awayWin = total > 0 ? (awayScore / total) * (1 - drawBase) : 0.33;
  let draw = drawBase;

  // Adjust draw probability based on how close the scores are
  const gap = Math.abs(homeScore - awayScore);
  if (gap < 0.3) draw = Math.min(0.38, draw + 0.1);
  if (gap > 1.5) draw = Math.max(0.15, draw - 0.1);

  // Re-normalize
  const sum = homeWin + draw + awayWin;
  homeWin = Math.round((homeWin / sum) * 100) / 100;
  draw = Math.round((draw / sum) * 100) / 100;
  awayWin = Math.round((1 - homeWin - draw) * 100) / 100;

  // Determine outcome and confidence
  const probs = { homeWin, draw, awayWin };
  const predictedOutcome = homeWin >= awayWin && homeWin >= draw
    ? 'homeWin'
    : awayWin >= homeWin && awayWin >= draw
      ? 'awayWin'
      : 'draw';

  const topProb = probs[predictedOutcome];
  const confidence = topProb > 0.5 ? 'high' : topProb > 0.38 ? 'medium' : 'low';

  // BTTS and over 2.5
  const avgGoalsHome = homeForm.length > 0 ? 1.3 : 1; // simplified
  const avgGoalsAway = awayForm.length > 0 ? 1.1 : 1;
  const btts = avgGoalsHome > 0.8 && avgGoalsAway > 0.8;
  const overTwoFive = avgGoalsHome + avgGoalsAway > 2.3;

  return { homeWin, draw, awayWin, predictedOutcome, confidence, btts, overTwoFive };
}
```

**File: `components/panels/sports/PronosticWidget.tsx`**

```typescript
// components/panels/sports/PronosticWidget.tsx
'use client';

type Props = {
  homeTeam: string;
  awayTeam: string;
  homeWin: number;   // 0.0 to 1.0
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
```

**Add to `app/globals.css`:**

```css
/* Pronostic */
.pronostic-outcome {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.pronostic-prediction {
  font-weight: 700;
  font-size: 0.9375rem;
}
.pronostic-confidence {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}
.pronostic-high { background: rgba(34,197,94,0.15); color: #16a34a; }
.pronostic-medium { background: rgba(245,166,35,0.15); color: #d97706; }
.pronostic-low { background: rgba(239,68,68,0.15); color: #dc2626; }

.pronostic-bars { display: flex; flex-direction: column; gap: 0.5rem; }
.pronostic-bar-row { display: flex; align-items: center; gap: 0.5rem; }
.pronostic-label { font-size: 0.75rem; min-width: 4rem; text-align: right; }
.pronostic-bar-track {
  flex: 1; height: 0.5rem; background: var(--color-border, #e5e7eb);
  border-radius: 0.25rem; overflow: hidden;
}
.pronostic-bar { height: 100%; border-radius: 0.25rem; transition: width 0.5s ease; }
.pronostic-bar-home { background: #F5A623; }
.pronostic-bar-draw { background: #94a3b8; }
.pronostic-bar-away { background: #1B2A4A; }
.pronostic-pct { font-size: 0.75rem; font-weight: 600; min-width: 2.5rem; }
.pronostic-disclaimer {
  margin-top: 0.75rem; font-size: 0.6875rem;
  color: var(--color-text-muted, #6b7280); font-style: italic;
}
```

---

## Phase 6 — Team Mini-Card + Match Result History

### What to build

**File: `components/panels/sports/TeamMiniCard.tsx`**

A compact card showing a team's crest, name, last 5 results as colored badges (W=green, D=grey, L=red), and current position.

**File: `components/panels/sports/MatchResultCard.tsx`**

A list of recent match results: date, opponent, score, and a W/D/L badge per result.

These are smaller components — follow the same pattern as `StandingsTable` and `FixturesCard`. Use the same CSS class prefix pattern (`.team-mini-*`, `.match-result-*`).

Register both as additional sports panel sections in `lib/panels/registry.ts`.

### How to test
1. Open the Champions League article
2. The panel should now have multiple sections: Standings, Pronostic, Fixtures, Team Cards
3. The pronostic widget shows probability bars for the featured match
4. Team mini-cards show the last 5 results as colored badges
5. All sections should render in both desktop sidebar and mobile drawer

---

## Done Checklist

- [ ] Phase 5: `lib/panels/pronostics.ts` exists with `calculatePronostic` and `getFormArray`
- [ ] Phase 5: `PronosticWidget.tsx` renders three probability bars with percentages
- [ ] Phase 5: Predicted outcome badge shows (e.g., "ARSENAL WIN — medium confidence")
- [ ] Phase 6: `TeamMiniCard.tsx` shows team crest, name, form badges
- [ ] Phase 6: `MatchResultCard.tsx` shows recent results with W/D/L badges
- [ ] Phase 6: All sports panel sections render in mobile drawer and desktop sidebar

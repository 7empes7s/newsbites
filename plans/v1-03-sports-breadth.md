# V1 Block 3 — Sports Breadth
**Phases 7–8 | Depends on: Blocks 1–2 (sports foundation + pronostics)**

> **Read `CONTEXT.md` first.**

---

## What You're Building

Extend sports panels beyond Champions League to **any major football competition**, and add a unique **Route-to-Final** analyzer for knockout tournaments.

---

## Phase 7 — Multi-Competition Detection

### What to build

**File: `lib/panels/fetchers/sports.ts` — Extend the existing file**

The `TAG_TO_COMPETITION` map should already exist from Phase 3. Ensure it covers all major competitions:

```typescript
const TAG_TO_COMPETITION: Record<string, string> = {
  'champions-league': 'CL',
  'premier-league': 'PL',
  'la-liga': 'PD',
  'serie-a': 'SA',
  'bundesliga': 'BL1',
  'ligue-1': 'FL1',
  'world-cup': 'WC',
  'euros': 'EC',
};
```

Add a function to get competition metadata:

```typescript
const COMPETITION_META: Record<string, { name: string; country: string }> = {
  CL: { name: 'Champions League', country: 'Europe' },
  PL: { name: 'Premier League', country: 'England' },
  PD: { name: 'La Liga', country: 'Spain' },
  SA: { name: 'Serie A', country: 'Italy' },
  BL1: { name: 'Bundesliga', country: 'Germany' },
  FL1: { name: 'Ligue 1', country: 'France' },
};

export function getCompetitionMeta(code: string) {
  return COMPETITION_META[code] || { name: code, country: 'Unknown' };
}
```

Update `StandingsTable.tsx` to show competition name + logo in the header.

Handle articles that mention teams from **two different competitions** — detect both from tags and render both panels.

Add TheSportsDB as fallback for competitions not in football-data.org free tier:
- TheSportsDB base URL: `https://www.thesportsdb.com/api/v1/json/3/`
- No API key needed for free tier
- `lookuptable.php?l={leagueId}&s={season}` for standings

### How to test
1. Create or update a Premier League article with `tags: ["premier-league"]`
2. Open it — standings should show PL table, not CL
3. An article with both `champions-league` and `premier-league` tags should show both

---

## Phase 8 — Route-to-Final Analyzer

### What to build

**File: `components/panels/sports/RouteToFinalCard.tsx`**

For **knockout competitions** (CL, WC, Euros), show where the mentioned teams are in the bracket.

```typescript
// components/panels/sports/RouteToFinalCard.tsx

type KnockoutMatch = {
  round: string;         // "Quarter-final", "Semi-final", "Final"
  homeTeam: string;
  awayTeam: string;
  aggregateScore?: string;
  nextOpponent?: string; // "If they win, they face..."
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
```

Data source: Use football-data.org `/v4/competitions/{code}/matches?stage=QUARTER_FINALS` etc. to build the bracket.

For mentioned teams, show:
1. Their current match (with aggregate score if available)
2. Who they would face in the next round if they win
3. That opponent's form (from pronostics engine)

### How to test
1. Open the Champions League article
2. Route-to-Final card should appear showing Arsenal's path (QF → potential SF opponent)
3. The card should not appear for league competition articles (PL, La Liga, etc.)

---

## Done Checklist

- [ ] Phase 7: All major competition codes mapped in `TAG_TO_COMPETITION`
- [ ] Phase 7: Competition name shows in standings header
- [ ] Phase 7: TheSportsDB fallback works for non-football-data.org competitions
- [ ] Phase 7: Articles with multiple competition tags show multiple standings
- [ ] Phase 8: `RouteToFinalCard.tsx` shows bracket path for knockout tournaments
- [ ] Phase 8: "If they win, they face..." prediction shown
- [ ] Phase 8: Card only appears for knockout competitions (not leagues)

# V1 Block 1 — Sports Foundation
**Phases 3–4 | Depends on: Block 0 (panel infrastructure) | Needed by: Blocks 2, 3**

> **Read `CONTEXT.md` first.** Then read `v1-00-panel-infrastructure.md` if you haven't built it yet.

---

## What You're Building

The first working panel vertical: **football/soccer**. When a reader opens an article about the Champions League, a panel appears showing live standings and upcoming fixtures. Data comes from the football-data.org free API.

---

## Phase 3 — Football Data Fetcher

### What to build

**File: `lib/panels/fetchers/sports.ts`**

This file fetches data from football-data.org. The free tier gives 10 requests per minute and covers major competitions.

```typescript
// lib/panels/fetchers/sports.ts

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';

// Tag → competition code mapping
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

function getHeaders() {
  return {
    'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY || '',
  };
}

export async function fetchStandings(competitionCode: string) {
  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/competitions/${competitionCode}/standings`,
    { headers: getHeaders(), next: { revalidate: 300 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchUpcomingFixtures(competitionCode: string) {
  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/competitions/${competitionCode}/matches?status=SCHEDULED&limit=10`,
    { headers: getHeaders(), next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchLiveMatches(competitionCode: string) {
  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/competitions/${competitionCode}/matches?status=LIVE`,
    { headers: getHeaders(), next: { revalidate: 60 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchTeamForm(teamId: number, last = 5) {
  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/teams/${teamId}/matches?limit=${last}&status=FINISHED`,
    { headers: getHeaders(), next: { revalidate: 300 } }
  );
  if (!res.ok) return null;
  return res.json();
}

// Detect competition code from article tags or panel_hints
export function detectCompetition(
  tags: string[],
  panelHints?: { competition?: string }
): string | null {
  if (panelHints?.competition) return panelHints.competition;
  for (const tag of tags) {
    if (TAG_TO_COMPETITION[tag]) return TAG_TO_COMPETITION[tag];
  }
  return null;
}
```

**File: `.env.local` — Add this line (get a free key from football-data.org):**

```
FOOTBALL_DATA_API_KEY=your_key_here
```

### How to test
1. Get a free API key from https://www.football-data.org/client/register
2. Add it to `.env.local`
3. Create a quick test script or use the Next.js dev server to verify:
   ```bash
   # Quick test in Node:
   FOOTBALL_DATA_API_KEY=your_key node -e "
     fetch('https://api.football-data.org/v4/competitions/CL/standings', {
       headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY }
     }).then(r => r.json()).then(d => console.log(d.standings?.[0]?.table?.length, 'teams'))
   "
   ```

---

## Phase 4 — Standings + Fixtures Panel Components

### What to build

**File: `components/panels/sports/StandingsTable.tsx`**

```typescript
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
  highlightTeams?: string[];  // team names to highlight (from panel_hints.teams)
};

export function StandingsTable({ standings, highlightTeams = [] }: Props) {
  if (!standings || standings.length === 0) return null;

  const isHighlighted = (name: string) =>
    highlightTeams.some(t => name.toLowerCase().includes(t.toLowerCase()));

  return (
    <div className="panel-section">
      <h3 className="panel-section-title">Standings</h3>
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
```

**File: `components/panels/sports/FixturesCard.tsx`**

```typescript
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
```

**Add styles to `app/globals.css`:**

```css
/* === Panel Sections === */
.panel-section {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.panel-section-title {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #6b7280);
  margin-bottom: 0.75rem;
}

/* Standings table */
.standings-table {
  width: 100%;
  font-size: 0.75rem;
  border-collapse: collapse;
}

.standings-table th {
  text-align: left;
  font-weight: 600;
  padding: 0.25rem 0.375rem;
  color: var(--color-text-muted, #6b7280);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.standings-table td {
  padding: 0.375rem;
}

.standings-team {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.standings-team img {
  flex-shrink: 0;
}

.standings-points {
  font-weight: 700;
}

.standings-highlight {
  background: rgba(245, 166, 35, 0.1);
  border-left: 2px solid #F5A623;
}

/* Fixtures */
.fixtures-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.fixture-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.fixture-date {
  color: var(--color-text-muted, #6b7280);
  font-size: 0.75rem;
  min-width: 3rem;
}

.fixture-teams {
  flex: 1;
}

.fixture-live {
  color: #ef4444;
  font-weight: 700;
  font-size: 0.75rem;
  animation: pulse 2s ease-in-out infinite;
}
```

**File: `lib/panels/registry.ts` — Register sports panels:**

Update the `sportsPanels` array to include standings and fixtures. You'll need to import the components and create `PanelConfig` entries for each.

**File: `content/articles/champions-league-quarterfinals-first-legs-return-games.md`**

Add `panel_hints` to the frontmatter:

```yaml
panel_hints:
  competition: "CL"
  teams: ["Arsenal", "Bayern Munich", "Atletico Madrid", "Paris Saint-Germain"]
```

### How to test
1. Run `npm run dev`
2. Open the Champions League article: `/articles/champions-league-quarterfinals-first-legs-return-games`
3. **Desktop:** A standings table should appear in the right panel showing CL standings, with Arsenal, Bayern, Atletico, PSG highlighted in amber
4. **Desktop:** Upcoming fixtures should appear below the standings
5. **Mobile:** The bottom drawer should show a badge with "2" (two sections). Tapping it should expand to show standings and fixtures
6. If `FOOTBALL_DATA_API_KEY` is not set, the panel should be empty (not crash)

---

## Done Checklist

- [ ] Phase 3: `lib/panels/fetchers/sports.ts` exists with `fetchStandings`, `fetchUpcomingFixtures`, `fetchLiveMatches`, `fetchTeamForm`, `detectCompetition`
- [ ] Phase 3: `FOOTBALL_DATA_API_KEY` added to `.env.local`
- [ ] Phase 3: API calls work (tested manually)
- [ ] Phase 4: `StandingsTable.tsx` renders a compact league table
- [ ] Phase 4: `FixturesCard.tsx` renders upcoming matches
- [ ] Phase 4: Sports panels registered in `registry.ts`
- [ ] Phase 4: Champions League article has `panel_hints` in frontmatter
- [ ] Phase 4: Panel renders on the CL article page (both desktop and mobile)
- [ ] Phase 4: Non-sports articles don't show any panel content

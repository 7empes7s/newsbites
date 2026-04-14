# V1 Block 7 — Science / Space Panels
**Phases 21–22 | Depends on: Block 0 (panel infrastructure)**

> **Read `CONTEXT.md` first.**

---

## What You're Building

Science and space articles feel like **Mission Control**. A rocket launch article shows a countdown timer. A space article shows the ISS position on a map. Every science article gets the NASA Astronomy Picture of the Day.

---

## Phase 21 — Launch Tracker + NASA APOD

**File: `lib/panels/fetchers/science.ts`**

```typescript
// Launch Library 2 — free, no key, 15 req/hr unauth
export async function fetchUpcomingLaunches(limit = 3) {
  const res = await fetch(
    `https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=${limit}&mode=list`,
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) return null;
  return res.json();
}

// NASA APOD — free key, very generous limits
export async function fetchNASAAPOD() {
  const key = process.env.NASA_API_KEY || 'DEMO_KEY';
  const res = await fetch(
    `https://api.nasa.gov/planetary/apod?api_key=${key}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}

// Search for a specific mission
export async function fetchMissionByName(name: string) {
  const encoded = encodeURIComponent(name);
  const res = await fetch(
    `https://ll.thespacedevs.com/2.2.0/launch/?search=${encoded}&mode=detailed&limit=1`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] || null;
}
```

**File: `components/panels/science/LaunchTrackerCard.tsx`**

Shows next 3 upcoming launches:
- Vehicle name (e.g., "Falcon 9")
- Mission/payload name
- Launch date and time
- Launch pad location
- Status badge (Go / TBD / Hold)
- **Countdown timer** for launches within 7 days (client component with `useEffect` interval)

**File: `components/panels/science/APODCard.tsx`**

NASA Astronomy Picture of the Day:
- Thumbnail image (use `<img>` with max-width: 100%)
- Title
- Explanation snippet (first 150 chars)
- "Full image →" link

Register both for `space` and `science` verticals.

---

## Phase 22 — ISS Position + Mission Status

**File: `components/panels/science/ISSPositionCard.tsx`** (client component)

```typescript
'use client';
import { useState, useEffect } from 'react';

export function ISSPositionCard() {
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    async function fetchPosition() {
      const res = await fetch('http://api.open-notify.org/iss-now.json');
      const data = await res.json();
      setPosition({
        latitude: parseFloat(data.iss_position.latitude),
        longitude: parseFloat(data.iss_position.longitude),
      });
    }
    fetchPosition();
    const interval = setInterval(fetchPosition, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!position) return <div className="panel-section"><p>Loading ISS position...</p></div>;

  return (
    <div className="panel-section">
      <h3 className="panel-section-title">ISS Position</h3>
      <div className="iss-position">
        <p>Latitude: {position.latitude.toFixed(4)}°</p>
        <p>Longitude: {position.longitude.toFixed(4)}°</p>
        <p className="iss-note">Updates every 30 seconds</p>
      </div>
    </div>
  );
}
```

**Note on maps:** A full Leaflet.js map is optional. The simple lat/lng display works fine. If you want to add a map later, use `react-leaflet` (don't add it now unless the phase says to).

**File: `components/panels/science/MissionStatusCard.tsx`**

For articles mentioning a specific mission (from `panel_hints.nasa_mission`):
- Mission name, status (Active / Planned / Completed)
- Crew names (if crewed)
- Launch date, expected landing date
- Key milestones

Add `NASA_API_KEY` to `.env.local`.

### How to test
1. Open the Artemis II article (`artemis-ii-record-lunar-flyby-return`)
2. Add `panel_hints: { nasa_mission: "Artemis II" }` to frontmatter
3. Panel should show: upcoming launches with countdown, APOD, ISS position, Artemis II mission status

---

## Done Checklist

- [ ] Phase 21: `LaunchTrackerCard.tsx` shows next 3 launches with countdown
- [ ] Phase 21: `APODCard.tsx` shows today's astronomy picture
- [ ] Phase 21: `NASA_API_KEY` added to `.env.local`
- [ ] Phase 22: `ISSPositionCard.tsx` shows live coordinates, updates every 30s
- [ ] Phase 22: `MissionStatusCard.tsx` shows details for a specific mission
- [ ] All science panels register for `space`, `science` verticals

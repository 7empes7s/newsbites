export interface Launch {
  id: string;
  name: string;
  window_start: string;
  window_end: string;
  status: { name: string; abbrev: string };
  rocket: { configuration: { name: string; family: string } };
  mission: { name: string; description?: string };
  pad: { name: string; location: { name: string } };
}

export async function fetchUpcomingLaunches(limit = 3): Promise<Launch[]> {
  try {
    const res = await fetch(
      `https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=${limit}&mode=list`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching launches:", error);
    return [];
  }
}

export interface APOD {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  copyright?: string;
}

export async function fetchNASAAPOD(): Promise<APOD | null> {
  try {
    const key = process.env.NASA_API_KEY || "DEMO_KEY";
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${key}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching NASA APOD:", error);
    return null;
  }
}

export interface Mission {
  id: string;
  name: string;
  status: { name: string };
  description?: string;
  start_date?: string;
  end_date?: string;
  type?: string;
}

export async function fetchMissionByName(name: string): Promise<Mission | null> {
  try {
    const encoded = encodeURIComponent(name);
    const res = await fetch(
      `https://ll.thespacedevs.com/2.2.0/launch/?search=${encoded}&mode=detailed&limit=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const launch = data.results?.[0];
    if (!launch) return null;
    return {
      id: launch.id,
      name: launch.name,
      status: launch.status,
      description: launch.mission?.description,
      start_date: launch.window_start,
      end_date: launch.window_end,
      type: launch.rocket?.configuration?.name,
    };
  } catch (error) {
    console.error("Error fetching mission:", error);
    return null;
  }
}

export interface ISSPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export async function fetchISSPosition(): Promise<ISSPosition | null> {
  try {
    const res = await fetch("http://api.open-notify.org/iss-now.json", {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      latitude: parseFloat(data.iss_position.latitude),
      longitude: parseFloat(data.iss_position.longitude),
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error("Error fetching ISS position:", error);
    return null;
  }
}
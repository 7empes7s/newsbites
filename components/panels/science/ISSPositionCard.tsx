"use client";

import { useState, useEffect } from "react";

interface ISSPosition {
  latitude: number;
  longitude: number;
}

export function ISSPositionCard() {
  const [position, setPosition] = useState<ISSPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosition() {
      try {
        const res = await fetch("http://api.open-notify.org/iss-now.json");
        const data = await res.json();
        setPosition({
          latitude: parseFloat(data.iss_position.latitude),
          longitude: parseFloat(data.iss_position.longitude),
        });
      } catch (error) {
        console.error("Error fetching ISS position:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosition();
    const interval = setInterval(fetchPosition, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
        <div className="animate-pulse flex items-center justify-center h-16">
          <span className="text-xs text-slate-400">Loading ISS position...</span>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="p-3 rounded-lg border border-slate-200 bg-white">
        <div className="text-xs text-slate-500">Unable to fetch ISS position</div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-2">ISS Position</h3>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Latitude</span>
          <span className="font-mono text-[#1B2A4A]">{position.latitude.toFixed(4)}°</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Longitude</span>
          <span className="font-mono text-[#1B2A4A]">{position.longitude.toFixed(4)}°</span>
        </div>
      </div>
      <div className="text-[10px] text-slate-400 mt-2">Updates every 30 seconds</div>
    </div>
  );
}
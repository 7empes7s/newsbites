// components/panels/sports/FixturesCard.tsx
"use client";

import { useState } from "react";

type Match = {
  id: number;
  utcDate: string;
  homeTeam: { name: string; crest?: string };
  awayTeam: { name: string; crest?: string };
  competition?: { name: string; emblem?: string };
  score: { fullTime: { home: number | null; away: number | null } };
  status: string;
  matchday?: number;
};

type Props = {
  matches?: Match[];
  homeTeamName?: string;
  awayTeamName?: string;
  h2hMatches?: Match[];
  homeTeamMatches?: Match[];
  awayTeamMatches?: Match[];
};

function MatchItem({ match, compact = false }: { match: Match; compact?: boolean }) {
  return (
    <li className="fixture-item">
      {!compact && match.competition?.emblem && (
        <img src={match.competition.emblem} alt="" className="fixture-comp-emblem" />
      )}
      <span className="fixture-date">
        {new Date(match.utcDate).toLocaleDateString("en", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <span className="fixture-teams">
        {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" className="fixture-team-crest" />}
        {match.homeTeam.name} vs {match.awayTeam.name}
        {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" className="fixture-team-crest" />}
      </span>
      {match.status === "LIVE" && (
        <span className="fixture-live">
          ● {match.score.fullTime.home}–{match.score.fullTime.away}
        </span>
      )}
      {!compact && match.competition?.name && (
        <span className="fixture-competition">{match.competition.name}</span>
      )}
    </li>
  );
}

export function FixturesCard({
  matches,
  homeTeamName,
  awayTeamName,
  h2hMatches,
  homeTeamMatches,
  awayTeamMatches,
}: Props) {
  const [activeTab, setActiveTab] = useState<"h2h" | "home" | "away">("h2h");

  const showTabs = h2hMatches || homeTeamMatches || awayTeamMatches;
  const showLegacy = !showTabs && matches && matches.length > 0;

  if (showLegacy) {
    return (
      <div className="panel-section">
        <h3 className="panel-section-title">Upcoming Fixtures</h3>
        <ul className="fixtures-list">
          {matches.slice(0, 5).map((match) => (
            <MatchItem key={match.id} match={match} />
          ))}
        </ul>
      </div>
    );
  }

  if (!showTabs) return null;

  const tabLabels = {
    h2h: "Head-to-Head",
    home: homeTeamName ? homeTeamName : "Home",
    away: awayTeamName ? awayTeamName : "Away",
  };

  const currentMatches =
    activeTab === "h2h" ? h2hMatches : activeTab === "home" ? homeTeamMatches : awayTeamMatches;

  return (
    <div className="panel-section">
      <h3 className="panel-section-title">Matchups & Fixtures</h3>
      <div className="fixtures-tabs">
        <button
          className={`fixtures-tab ${activeTab === "h2h" ? "active" : ""}`}
          onClick={() => setActiveTab("h2h")}
        >
          {tabLabels.h2h}
        </button>
        <button
          className={`fixtures-tab ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          {tabLabels.home}
        </button>
        <button
          className={`fixtures-tab ${activeTab === "away" ? "active" : ""}`}
          onClick={() => setActiveTab("away")}
        >
          {tabLabels.away}
        </button>
      </div>
      <ul className="fixtures-list">
        {currentMatches && currentMatches.length > 0 ? (
          currentMatches.slice(0, 5).map((match) => (
            <MatchItem key={match.id} match={match} />
          ))
        ) : (
          <li className="fixture-empty">No matches found</li>
        )}
      </ul>
    </div>
  );
}
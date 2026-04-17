"use client";

// components/panels/sports/TeamMiniCard.tsx

import { useMemo } from "react";
import { getSubscriptions } from "@/lib/subscriptions";

type FormResult = 'W' | 'D' | 'L';

type Props = {
  teamName: string;
  teamCrest?: string;
  position?: number;
  form: FormResult[];
};

export function TeamMiniCard({ teamName, teamCrest, position, form = [] }: Props) {
  const formColors: Record<FormResult, string> = {
    W: '#22c55e',
    D: '#94a3b8',
    L: '#ef4444',
  };
  const isSubscribedTeam = useMemo(
    () =>
      getSubscriptions()
        .teams.some((team) => teamName.toLowerCase().includes(team.toLowerCase())),
    [teamName],
  );

  return (
    <div className="panel-section">
      <h3 className="panel-section-title">
        {teamName}
        {isSubscribedTeam ? (
          <span className="team-mini-subscription">Subscribed</span>
        ) : null}
      </h3>
      <div className="team-mini-card">
        <div className="team-mini-header">
          {teamCrest && (
            <img src={teamCrest} alt="" width={24} height={24} className="team-mini-crest" />
          )}
          {position !== undefined && (
            <span className="team-mini-position">#{position}</span>
          )}
        </div>
        <div className="team-mini-form">
          {form.slice(0, 5).map((result, i) => (
            <span
              key={i}
              className="team-mini-form-badge"
              style={{ backgroundColor: formColors[result] }}
            >
              {result}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function getPanelTitle(id: string): string {
  const titles: Record<string, string> = {
    "fda-alerts": "FDA Alerts",
    "who-bulletin": "WHO News",
    "clinical-trials": "Clinical Trials",
    "co2-widget": "CO2 Level",
    "temp-anomaly": "Temperature",
    "renewable-capacity": "Renewables",
    "sports-standings": "Standings",
    "sports-fixtures": "Fixtures",
    "sports-pronostic": "Prediction",
    "sports-home-team": "Home Team",
    "sports-away-team": "Away Team",
    "sports-route-to-final": "Knockout",
    "finance-overview": "Finance",
    "finance-sparkline": "Ticker",
    "macro-indicators": "Macro",
    "crypto-panel": "Crypto",
    "country-profile": "Country",
    "conflict-timeline": "Conflict",
    "election-calendar": "Elections",
    "trade-data": "Trade",
    "github-repo": "GitHub",
    "model-leaderboard": "Models",
    "paper-card": "Paper",
    "tech-signal": "Tech Signal",
    "launch-tracker": "Launches",
    apod: "Astronomy",
    "iss-position": "ISS",
    "mission-status": "Mission",
    "cross-vertical-ticker": "Market Context",
    "cross-vertical-github": "Repo Context",
  };

  return (
    titles[id] ||
    id
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

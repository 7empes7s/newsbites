export type Subscriptions = {
  teams: string[];
  verticals: string[];
  tickers: string[];
};

const STORAGE_KEY = "newsbites-subscriptions";

export function getSubscriptions(): Subscriptions {
  if (typeof window === "undefined") return { teams: [], verticals: [], tickers: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { teams: [], verticals: [], tickers: [] };
    return JSON.parse(raw);
  } catch {
    return { teams: [], verticals: [], tickers: [] };
  }
}

function saveSubscriptions(subs: Subscriptions): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
  } catch {}
}

export function toggleTeam(team: string): Subscriptions {
  const subs = getSubscriptions();
  if (subs.teams.includes(team)) {
    subs.teams = subs.teams.filter(t => t !== team);
  } else {
    subs.teams = [...subs.teams, team];
  }
  saveSubscriptions(subs);
  return subs;
}

export function toggleVertical(vertical: string): Subscriptions {
  const subs = getSubscriptions();
  if (subs.verticals.includes(vertical)) {
    subs.verticals = subs.verticals.filter(v => v !== vertical);
  } else {
    subs.verticals = [...subs.verticals, vertical];
  }
  saveSubscriptions(subs);
  return subs;
}

export function toggleTicker(ticker: string): Subscriptions {
  const subs = getSubscriptions();
  if (subs.tickers.includes(ticker)) {
    subs.tickers = subs.tickers.filter(t => t !== ticker);
  } else {
    subs.tickers = [...subs.tickers, ticker];
  }
  saveSubscriptions(subs);
  return subs;
}

export function isTeamSubscribed(team: string): boolean {
  return getSubscriptions().teams.includes(team);
}

export function isVerticalSubscribed(vertical: string): boolean {
  return getSubscriptions().verticals.includes(vertical);
}

export function isTickerSubscribed(ticker: string): boolean {
  return getSubscriptions().tickers.includes(ticker);
}
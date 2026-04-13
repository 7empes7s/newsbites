import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Subscription {
  id: string;
  email: string;
  tickers: string[];
  verticals: string[];
  createdAt: string;
}

const SUBSCRIPTIONS_DIR = path.join(process.cwd(), 'content/subscriptions');

function loadSubscriptions(): Subscription[] {
  const file = path.join(SUBSCRIPTIONS_DIR, 'list.json');
  try {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function saveSubscriptions(subs: Subscription[]) {
  fs.mkdirSync(SUBSCRIPTIONS_DIR, { recursive: true });
  fs.writeFileSync(path.join(SUBSCRIPTIONS_DIR, 'list.json'), JSON.stringify(subs, null, 2));
}

export async function POST(request: NextRequest) {
  let body: { email?: string; tickers?: string[]; verticals?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const tickers: string[] = (body.tickers ?? []).map(t => t.toUpperCase().trim()).filter(Boolean);
  const verticals: string[] = (body.verticals ?? []).map(v => v.toLowerCase().trim()).filter(Boolean);

  if (tickers.length === 0 && verticals.length === 0) {
    return NextResponse.json({ error: 'Select at least one ticker or topic to track' }, { status: 400 });
  }

  const subs = loadSubscriptions();
  const existing = subs.find(s => s.email === email);

  if (existing) {
    // Merge preferences
    existing.tickers = Array.from(new Set([...existing.tickers, ...tickers]));
    existing.verticals = Array.from(new Set([...existing.verticals, ...verticals]));
    saveSubscriptions(subs);
    return NextResponse.json({ ok: true, action: 'updated', email });
  }

  const newSub: Subscription = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    tickers,
    verticals,
    createdAt: new Date().toISOString(),
  };
  subs.push(newSub);
  saveSubscriptions(subs);

  return NextResponse.json({ ok: true, action: 'subscribed', email }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase() ?? '';
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const subs = loadSubscriptions();
  const filtered = subs.filter(s => s.email !== email);
  if (filtered.length === subs.length) {
    return NextResponse.json({ error: 'Email not found' }, { status: 404 });
  }
  saveSubscriptions(filtered);
  return NextResponse.json({ ok: true, action: 'unsubscribed', email });
}

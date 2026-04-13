"use client";

import React, { useState } from 'react';
import { Bell, Mail, Send } from 'lucide-react';

const AVAILABLE_TICKERS = [
  { symbol: 'NVDA', label: 'NVIDIA' },
  { symbol: 'MSFT', label: 'Microsoft' },
  { symbol: 'GOOGL', label: 'Alphabet' },
  { symbol: 'META', label: 'Meta' },
  { symbol: 'AAPL', label: 'Apple' },
  { symbol: 'AMZN', label: 'Amazon' },
  { symbol: 'TSLA', label: 'Tesla' },
  { symbol: 'AMD', label: 'AMD' },
  { symbol: 'BTC-USD', label: 'Bitcoin' },
  { symbol: 'ETH-USD', label: 'Ethereum' },
  { symbol: 'GC=F', label: 'Gold' },
  { symbol: 'SPY', label: 'S&P 500' },
];

const AVAILABLE_TOPICS = [
  { value: 'ai', label: 'AI & Tech' },
  { value: 'finance', label: 'Finance' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'economy', label: 'Economy' },
  { value: 'global-politics', label: 'Geopolitics' },
  { value: 'energy', label: 'Energy' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function AlertsPage() {
  const [email, setEmail] = useState('');
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  function toggleTicker(symbol: string) {
    setSelectedTickers(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  }

  function toggleTopic(value: string) {
    setSelectedTopics(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || (selectedTickers.length === 0 && selectedTopics.length === 0)) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tickers: selectedTickers, verticals: selectedTopics }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(`You're subscribed! We'll notify ${email} when tracked tickers or topics have new signals.`);
        setEmail('');
        setSelectedTickers([]);
        setSelectedTopics([]);
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  return (
    <div className="space-y-10 max-w-2xl">
      <header>
        <h1 className="text-3xl font-bold font-playfair text-[#1B2A4A]">Market Alerts</h1>
        <p className="text-slate-600 mt-1">
          Get notified when our AI analyst issues new signals or relevant news breaks for your tracked stocks and topics.
        </p>
      </header>

      {/* Subscription form */}
      <form onSubmit={handleSubmit} className="space-y-8 p-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="p-2 rounded-xl bg-[#1B2A4A]/10">
            <Bell className="text-[#1B2A4A]" size={20} />
          </span>
          <h2 className="text-xl font-bold text-[#1B2A4A] font-playfair">Set up your alerts</h2>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">
            Email address
          </label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-[#F5A623] transition-colors">
            <Mail className="text-slate-400 shrink-0" size={16} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 outline-none text-sm bg-transparent"
              required
            />
          </div>
        </div>

        {/* Tickers */}
        <div>
          <label className="block text-sm font-semibold text-[#1B2A4A] mb-3">
            Track tickers <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TICKERS.map(t => (
              <button
                key={t.symbol}
                type="button"
                onClick={() => toggleTicker(t.symbol)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selectedTickers.includes(t.symbol)
                    ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#1B2A4A]'
                }`}
              >
                {t.symbol} · {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div>
          <label className="block text-sm font-semibold text-[#1B2A4A] mb-3">
            Track topics <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TOPICS.map(topic => (
              <button
                key={topic.value}
                type="button"
                onClick={() => toggleTopic(topic.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selectedTopics.includes(topic.value)
                    ? 'bg-[#F5A623] text-[#1B2A4A] border-[#F5A623]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#F5A623]'
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status messages */}
        {status === 'success' && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            {message}
          </div>
        )}
        {status === 'error' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'loading' || !email || (selectedTickers.length === 0 && selectedTopics.length === 0)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#F5A623] text-[#1B2A4A] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          {status === 'loading' ? 'Subscribing…' : 'Subscribe to alerts'}
        </button>

        <p className="text-xs text-slate-400">
          We respect your inbox. Alerts are sent only when there is something genuinely meaningful to report.
          Unsubscribe any time. Not financial advice.
        </p>
      </form>

      {/* How it works */}
      <section className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
        <h3 className="font-bold text-[#1B2A4A] mb-4">How alerts work</h3>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-[#F5A623] font-bold mt-0.5">01</span>
            <span>Our Finance Analyst agent monitors news and market data around the clock.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#F5A623] font-bold mt-0.5">02</span>
            <span>When a new article mentions your tracked ticker, or our AI issues a signal change, you get an email.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#F5A623] font-bold mt-0.5">03</span>
            <span>Each alert links directly to the article and the full AI analysis.</span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-slate-400">
          All alerts are AI-generated for informational purposes only and do not constitute financial advice.
        </p>
      </section>
    </div>
  );
}

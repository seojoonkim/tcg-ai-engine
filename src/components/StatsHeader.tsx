'use client';

import { TrendingUp, TrendingDown, BarChart3, Layers } from 'lucide-react';

interface Card {
  market_price: number | null;
  change_24h: number | null;
}

interface StatsHeaderProps {
  cards: Card[];
  total: number;
  currency: 'USD' | 'KRW';
  gainers: number;
  losers: number;
}

export default function StatsHeader({ cards, total, currency, gainers, losers }: StatsHeaderProps) {
  const priced = cards.filter(c => c.market_price != null);
  const totalVolume = priced.reduce((sum, c) => sum + (c.market_price ?? 0), 0);
  const floorPrice = priced.length > 0
    ? Math.min(...priced.map(c => c.market_price!))
    : 0;

  const fmt = (usd: number) => {
    if (currency === 'KRW') {
      const krw = usd * 1320;
      if (krw >= 1_000_000) return `₩${(krw / 1_000_000).toFixed(1)}M`;
      if (krw >= 1_000) return `₩${(krw / 1_000).toFixed(0)}K`;
      return `₩${krw.toFixed(0)}`;
    }
    if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
    if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}K`;
    return `$${usd.toFixed(2)}`;
  };

  const stats = [
    { label: 'Total Cards', value: total.toLocaleString(), icon: Layers },
    { label: 'Floor Price', value: fmt(floorPrice), icon: BarChart3 },
    { label: 'Total Volume', value: fmt(totalVolume), icon: BarChart3 },
    { label: 'Gainers', value: String(gainers), icon: TrendingUp, color: 'var(--color-positive)' },
    { label: 'Losers', value: String(losers), icon: TrendingDown, color: 'var(--color-negative)' },
  ];

  return (
    <div
      className="border-b px-4 py-3 md:px-6"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}
    >
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-6">
        {stats.map(stat => (
          <div key={stat.label} className="flex items-center gap-2">
            <stat.icon size={14} style={{ color: stat.color ?? 'var(--text-secondary)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
            <span
              className="text-sm font-bold"
              style={{ color: stat.color ?? 'var(--text-primary)' }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

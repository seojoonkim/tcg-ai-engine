'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CardData {
  id: string;
  name: string;
  set_name: string;
  rarity: string;
  image_url: string;
  market_price: number | null;
  low_price: number | null;
  high_price: number | null;
  change_24h: number | null;
  change_7d: number | null;
  sparkline: number[];
  tcgplayer_url?: string;
  ip_name?: string;
}

interface PriceHistory {
  recorded_at: string;
  market_price: number;
  low_price: number;
  high_price: number;
}

export default function CardDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [card, setCard] = useState<CardData | null>(null);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'USD' | 'KRW'>('USD');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    fetch(`/api/cards/${id}`)
      .then(r => r.json())
      .then(d => {
        setCard(d.card || null);
        setHistory(d.history || []);
      })
      .catch(() => setCard(null))
      .finally(() => setLoading(false));
  }, [id]);

  const fmtPrice = (v: number | null) => {
    if (v == null) return '—';
    if (currency === 'KRW') return `₩${Math.round(v * 1320).toLocaleString()}`;
    return `$${v.toFixed(2)}`;
  };

  const fmtPct = (v: number | null) => {
    if (v == null) return '—';
    return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
  };

  const chartData = history.map(h => ({
    date: new Date(h.recorded_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    market: currency === 'KRW' ? +(h.market_price * 1320).toFixed(0) : h.market_price,
  }));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--border-subtle)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-primary)' }}>
        <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>Card not found</span>
        <Link href="/" className="text-sm no-underline" style={{ color: 'var(--accent-primary)' }}>
          Back to marketplace
        </Link>
      </div>
    );
  }

  const is24Up = (card.change_24h ?? 0) >= 0;
  const is7dUp = (card.change_7d ?? 0) >= 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div className="border-b px-4 py-3 md:px-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm no-underline" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} />
            Back
          </Link>
          <button
            onClick={() => setCurrency(c => c === 'USD' ? 'KRW' : 'USD')}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--accent-primary)',
            }}
          >
            {currency === 'USD' ? '$ USD' : '₩ KRW'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-[320px_1fr]">
          {/* Image */}
          <div className="flex justify-center">
            <div className="w-full max-w-xs overflow-hidden rounded-xl" style={{ aspectRatio: '5/7', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              {!imgError && card.image_url ? (
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl" style={{ background: 'var(--bg-tertiary)' }}>
                  🃏
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {card.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{card.set_name}</span>
                {card.rarity && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    {card.rarity}
                  </span>
                )}
                {card.ip_name && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    {card.ip_name}
                  </span>
                )}
              </div>
            </div>

            {/* Price Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox label="Market Price" value={fmtPrice(card.market_price)} highlight />
              <StatBox
                label="24h Change"
                value={fmtPct(card.change_24h)}
                color={card.change_24h == null ? undefined : is24Up ? 'var(--color-positive)' : 'var(--color-negative)'}
              />
              <StatBox label="7d Low" value={fmtPrice(card.low_price)} />
              <StatBox label="7d High" value={fmtPrice(card.high_price)} />
            </div>

            {/* 7d Change */}
            <div className="grid grid-cols-2 gap-3">
              <StatBox
                label="7d Change"
                value={fmtPct(card.change_7d)}
                color={card.change_7d == null ? undefined : is7dUp ? 'var(--color-positive)' : 'var(--color-negative)'}
              />
              {card.tcgplayer_url && (
                <a
                  href={card.tcgplayer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl text-sm font-semibold no-underline transition-colors"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--accent-primary)',
                    padding: '12px 16px',
                  }}
                >
                  <ExternalLink size={14} />
                  View on TCGPlayer
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 30-Day Price Chart */}
        <div className="mt-8 rounded-xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            30-Day Price History
          </h2>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorMarketDetail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.72 0.18 155)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.72 0.18 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'oklch(0.62 0.02 260)', fontSize: 11 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'oklch(0.62 0.02 260)', fontSize: 11 }}
                  tickLine={false}
                  width={55}
                  tickFormatter={v => currency === 'KRW' ? `₩${(v / 1000).toFixed(0)}K` : `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'oklch(0.18 0.02 260)',
                    border: '1px solid oklch(0.28 0.02 260)',
                    borderRadius: 8,
                    color: 'oklch(0.95 0.01 260)',
                  }}
                  labelStyle={{ color: 'oklch(0.62 0.02 260)' }}
                  formatter={(v: number | undefined) => [
                    v != null ? (currency === 'KRW' ? `₩${v.toLocaleString()}` : `$${v.toFixed(2)}`) : 'N/A',
                    'Price',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="market"
                  stroke="oklch(0.72 0.18 155)"
                  fill="url(#colorMarketDetail)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="flex h-[200px] items-center justify-center rounded-lg text-sm"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
            >
              No price history available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
  color,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div
        className="mt-1 text-lg font-bold"
        style={{ color: color ?? (highlight ? 'var(--accent-primary)' : 'var(--text-primary)') }}
      >
        {value}
      </div>
    </div>
  );
}

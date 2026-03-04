'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Card {
  id: string;
  name: string;
  set_name: string;
  rarity: string;
  image_url: string;
  market_price: number | null;
  change_24h: number | null;
  change_7d: number | null;
  ip_name?: string;
}

interface CardGridItemProps {
  card: Card;
  currency: 'USD' | 'KRW';
}

const IP_EMOJI: Record<string, string> = {
  'Pokemon': '⚡',
  'Magic: The Gathering': '🔮',
  'Yu-Gi-Oh': '👁️',
  'One Piece': '⚓',
  'Lorcana': '✨',
};

export default function CardGridItem({ card, currency }: CardGridItemProps) {
  const [imgError, setImgError] = useState(false);

  const fmtPrice = (v: number | null) => {
    if (v == null) return '—';
    if (currency === 'KRW') return `₩${Math.round(v * 1320).toLocaleString()}`;
    return `$${v.toFixed(2)}`;
  };

  const fmtPct = (v: number | null) => {
    if (v == null) return null;
    return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
  };

  const change = card.change_24h;
  const isUp = (change ?? 0) >= 0;

  return (
    <Link href={`/cards/${card.id}`} className="no-underline">
      <div
        className="card-grid-item group relative flex flex-col overflow-hidden rounded-xl cursor-pointer"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Image */}
        <div className="relative w-full" style={{ aspectRatio: '5/7' }}>
          {!imgError && card.image_url ? (
            <img
              src={card.image_url}
              alt={card.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl"
              style={{ background: 'var(--bg-tertiary)' }}>
              {IP_EMOJI[card.ip_name ?? ''] ?? '🃏'}
            </div>
          )}

          {/* Hover price overlay */}
          <div
            className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background: 'linear-gradient(to top, oklch(0 0 0 / 0.8), transparent)',
            }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {fmtPrice(card.market_price)}
            </span>
            {fmtPct(change) && (
              <span
                className="rounded-md px-1.5 py-0.5 text-xs font-semibold"
                style={{
                  background: isUp ? 'oklch(0.72 0.18 155 / 0.2)' : 'oklch(0.62 0.22 25 / 0.2)',
                  color: isUp ? 'var(--color-positive)' : 'var(--color-negative)',
                }}
              >
                {fmtPct(change)}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-0.5 p-3">
          <span className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {card.name}
          </span>
          <span className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
            {card.set_name}
          </span>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {fmtPrice(card.market_price)}
            </span>
            {fmtPct(change) && (
              <span
                className="text-xs font-semibold"
                style={{ color: isUp ? 'var(--color-positive)' : 'var(--color-negative)' }}
              >
                {fmtPct(change)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

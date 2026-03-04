'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sparkline from './Sparkline';

interface Card {
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

type SortKey = 'rank' | 'price' | 'change_24h' | 'change_7d';
type SortDir = 'asc' | 'desc';

interface CardTableProps {
  cards: Card[];
  currency: 'USD' | 'KRW';
}

export default function CardTable({ cards, currency }: CardTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...cards].sort((a, b) => {
    let va = 0, vb = 0;
    if (sortKey === 'rank' || sortKey === 'price') { va = a.market_price ?? -Infinity; vb = b.market_price ?? -Infinity; }
    else if (sortKey === 'change_24h') { va = a.change_24h ?? -Infinity; vb = b.change_24h ?? -Infinity; }
    else if (sortKey === 'change_7d') { va = a.change_7d ?? -Infinity; vb = b.change_7d ?? -Infinity; }
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const fmtPrice = (v: number | null) => {
    if (v == null) return '—';
    if (currency === 'KRW') return `₩${(v * 1320).toLocaleString()}`;
    return `$${v.toFixed(2)}`;
  };

  const fmtPct = (v: number | null) => {
    if (v == null) return '—';
    return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
  };

  const SortArrow = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="ml-1" style={{ color: 'var(--border-subtle)' }}>↕</span>;
    return <span className="ml-1" style={{ color: 'var(--accent-primary)' }}>{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  const IP_EMOJI: Record<string, string> = {
    'Pokemon': '⚡', 'Magic: The Gathering': '🔮', 'Yu-Gi-Oh': '👁️',
    'One Piece': '⚓', 'Lorcana': '✨',
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-secondary)' }}>
        <span className="text-3xl mb-3">🔍</span>
        <span className="text-sm">No cards found</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
      <table className="w-full border-collapse" style={{ minWidth: 800 }}>
        <thead>
          <tr style={{ background: 'var(--bg-tertiary)' }}>
            <th className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none w-10 text-center" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }} onClick={() => handleSort('rank')}>#<SortArrow col="rank" /></th>
            <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>Card</th>
            <th className="px-3 py-2 text-right text-xs font-semibold cursor-pointer select-none" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }} onClick={() => handleSort('price')}>Price<SortArrow col="price" /></th>
            <th className="px-3 py-2 text-right text-xs font-semibold cursor-pointer select-none" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }} onClick={() => handleSort('change_24h')}>24h %<SortArrow col="change_24h" /></th>
            <th className="px-3 py-2 text-right text-xs font-semibold cursor-pointer select-none" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }} onClick={() => handleSort('change_7d')}>7d %<SortArrow col="change_7d" /></th>
            <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>7d Low</th>
            <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>7d High</th>
            <th className="px-3 py-2 text-center text-xs font-semibold w-[100px]" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>7d Chart</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((card, idx) => {
            const is24Up = (card.change_24h ?? 0) >= 0;
            const is7dUp = (card.change_7d ?? 0) >= 0;
            const sparkPos = card.sparkline.length >= 2 ? card.sparkline[card.sparkline.length - 1] >= card.sparkline[0] : true;
            return (
              <tr key={card.id} className="transition-colors hover:bg-[var(--bg-tertiary)]">
                <td className="px-3 py-1.5 text-center text-xs font-semibold" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{idx + 1}</td>
                <td className="px-3 py-1.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <Link href={`/cards/${card.id}`} className="flex items-center gap-2 no-underline">
                    <div className="w-8 h-11 shrink-0 flex items-center justify-center rounded overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                      {!imgErrors.has(card.id) && card.image_url ? (
                        <img src={card.image_url} alt={card.name} className="w-8 h-11 object-cover rounded"
                          onError={() => setImgErrors(prev => new Set([...prev, card.id]))} />
                      ) : <span className="text-base">{IP_EMOJI[card.ip_name ?? ''] ?? '🃏'}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate max-w-[220px]" style={{ color: 'var(--text-primary)' }}>{card.name}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{card.set_name}{card.ip_name ? ` · ${card.ip_name}` : ''}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-1.5 text-right text-xs font-bold" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>{fmtPrice(card.market_price)}</td>
                <td className="px-3 py-1.5 text-right text-xs font-semibold" style={{ color: card.change_24h == null ? 'var(--text-secondary)' : is24Up ? 'var(--color-positive)' : 'var(--color-negative)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {card.change_24h != null ? (is24Up ? '▲ ' : '▼ ') : ''}{fmtPct(card.change_24h)}
                </td>
                <td className="px-3 py-1.5 text-right text-xs font-semibold" style={{ color: card.change_7d == null ? 'var(--text-secondary)' : is7dUp ? 'var(--color-positive)' : 'var(--color-negative)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {card.change_7d != null ? (is7dUp ? '▲ ' : '▼ ') : ''}{fmtPct(card.change_7d)}
                </td>
                <td className="px-3 py-1.5 text-right text-xs" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{fmtPrice(card.low_price)}</td>
                <td className="px-3 py-1.5 text-right text-xs" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{fmtPrice(card.high_price)}</td>
                <td className="px-1 py-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <Sparkline data={card.sparkline} positive={sparkPos} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

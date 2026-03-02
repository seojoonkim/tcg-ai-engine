'use client';

import { useState, useEffect } from 'react';
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
}

type SortKey = 'rank' | 'price' | 'change_24h' | 'change_7d';
type SortDir = 'asc' | 'desc';

interface CardTableProps {
  cards: Card[];
  currency: 'USD' | 'KRW';
  onCardClick: (card: Card) => void;
}

export default function CardTable({ cards, currency, onCardClick }: CardTableProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tcg_favorites') || '[]');
      setFavorites(new Set(saved));
    } catch {}
  }, []);

  const toggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('tcg_favorites', JSON.stringify([...next]));
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...cards].sort((a, b) => {
    const favA = favorites.has(a.id) ? -1 : 0;
    const favB = favorites.has(b.id) ? -1 : 0;
    if (favA !== favB) return favA - favB;
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
    if (sortKey !== col) return <span style={{ color: '#2A3444', marginLeft: 4 }}>↕</span>;
    return <span style={{ color: '#F0B90B', marginLeft: 4 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', color: '#8A92A6', fontSize: 12, fontWeight: 600,
    textAlign: 'left', borderBottom: '1px solid #2A3444', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none'
  };
  const tdStyle: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid #2A3444', fontSize: 13, color: '#fff', verticalAlign: 'middle' };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr style={{ background: '#1A2332' }}>
            <th style={{ ...thStyle, width: 48, textAlign: 'center' }} onClick={() => handleSort('rank')}>#<SortArrow col="rank" /></th>
            <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>★</th>
            <th style={thStyle}>카드</th>
            <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('price')}>가격<SortArrow col="price" /></th>
            <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('change_24h')}>24h %<SortArrow col="change_24h" /></th>
            <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('change_7d')}>7d %<SortArrow col="change_7d" /></th>
            <th style={{ ...thStyle, textAlign: 'right' }}>최저가</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>최고가</th>
            <th style={{ ...thStyle, textAlign: 'center', width: 110 }}>7d 차트</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((card, idx) => {
            const is24Up = (card.change_24h ?? 0) >= 0;
            const is7dUp = (card.change_7d ?? 0) >= 0;
            const isFav = favorites.has(card.id);
            const sparkPos = card.sparkline.length >= 2 ? card.sparkline[card.sparkline.length - 1] >= card.sparkline[0] : true;
            return (
              <tr
                key={card.id}
                onClick={() => onCardClick(card)}
                style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1F2D40')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ ...tdStyle, textAlign: 'center', color: '#8A92A6', fontWeight: 600 }}>{idx + 1}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <button
                    onClick={e => toggleFav(e, card.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: isFav ? '#F0B90B' : '#2A3444', lineHeight: 1 }}
                  >★</button>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!imgErrors.has(card.id) && card.image_url ? (
                        <img
                          src={card.image_url}
                          alt={card.name}
                          style={{ maxWidth: 32, maxHeight: 44, objectFit: 'contain', borderRadius: 3 }}
                          onError={() => setImgErrors(prev => new Set([...prev, card.id]))}
                        />
                      ) : <span style={{ fontSize: 20 }}>🃏</span>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: 13, whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</div>
                      <div style={{ color: '#8A92A6', fontSize: 11 }}>{card.set_name}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#fff' }}>{fmtPrice(card.market_price)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', color: card.change_24h == null ? '#8A92A6' : is24Up ? '#16C784' : '#EA3943', fontWeight: 600 }}>
                  {card.change_24h != null ? (is24Up ? '▲ ' : '▼ ') : ''}{fmtPct(card.change_24h)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', color: card.change_7d == null ? '#8A92A6' : is7dUp ? '#16C784' : '#EA3943', fontWeight: 600 }}>
                  {card.change_7d != null ? (is7dUp ? '▲ ' : '▼ ') : ''}{fmtPct(card.change_7d)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', color: '#8A92A6' }}>{fmtPrice(card.low_price)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', color: '#8A92A6' }}>{fmtPrice(card.high_price)}</td>
                <td style={{ ...tdStyle, padding: '6px 16px' }}>
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

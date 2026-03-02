'use client';

import { useState } from 'react';
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

const IP_TABS = ['All', 'Pokémon', 'Magic: The Gathering', 'Yu-Gi-Oh!', 'One Piece', 'Lorcana'];
const IP_API_MAP: Record<string, string> = {
  'Pokémon': 'Pokemon',
  'Magic: The Gathering': 'Magic: The Gathering',
  'Yu-Gi-Oh!': 'Yu-Gi-Oh',
  'One Piece': 'One Piece',
  'Lorcana': 'Lorcana',
};

interface CardTableProps {
  cards: Card[];
  currency: 'USD' | 'KRW';
  onCardClick: (card: Card) => void;
  onIpChange?: (ip: string) => void;
  activeIp?: string;
}

export default function CardTable({ cards, currency, onCardClick, onIpChange, activeIp = '' }: CardTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  // activeTab: parent의 activeIp prop으로 동기화 (unmount 후 초기화 방지)
  const activeTab = activeIp === '' ? 'All' : (Object.entries(IP_API_MAP).find(([, v]) => v === activeIp)?.[0] || 'All');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleTabClick = (tab: string) => {
    const apiIp = tab === 'All' ? '' : (IP_API_MAP[tab] || tab);
    if (onIpChange) onIpChange(apiIp);
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
    if (sortKey !== col) return <span style={{ color: '#2A3444', marginLeft: 3 }}>↕</span>;
    return <span style={{ color: '#F0B90B', marginLeft: 3 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  const thStyle: React.CSSProperties = {
    padding: '8px 10px', color: '#8A92A6', fontSize: 11, fontWeight: 600,
    textAlign: 'left', borderBottom: '1px solid #2A3444', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none'
  };
  const tdStyle: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid #1A2332', fontSize: 12, color: '#fff', verticalAlign: 'middle' };

  return (
    <div>
      {/* IP Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid #2A3444', flexWrap: 'wrap' }}>
        {IP_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            style={{
              background: activeTab === tab ? '#F0B90B' : '#2A3444',
              color: activeTab === tab ? '#000' : '#8A92A6',
              border: 'none',
              borderRadius: 5,
              padding: '4px 10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 11,
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr style={{ background: '#131D2E' }}>
              <th style={{ ...thStyle, width: 40, textAlign: 'center' }} onClick={() => handleSort('rank')}>#<SortArrow col="rank" /></th>
              <th style={thStyle}>Card</th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('price')}>Price<SortArrow col="price" /></th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('change_24h')}>24h %<SortArrow col="change_24h" /></th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('change_7d')}>7d %<SortArrow col="change_7d" /></th>
              <th style={{ ...thStyle, textAlign: 'right' }}>7d Low</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>7d High</th>
              <th style={{ ...thStyle, textAlign: 'center', width: 100 }}>7d Chart</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((card, idx) => {
              const is24Up = (card.change_24h ?? 0) >= 0;
              const is7dUp = (card.change_7d ?? 0) >= 0;
              const sparkPos = card.sparkline.length >= 2 ? card.sparkline[card.sparkline.length - 1] >= card.sparkline[0] : true;
              return (
                <tr
                  key={card.id}
                  onClick={() => onCardClick(card)}
                  style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1F2D40')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#8A92A6', fontWeight: 600, fontSize: 11 }}>{idx + 1}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1421', borderRadius: 3, overflow: 'hidden' }}>
                        {!imgErrors.has(card.id) && card.image_url ? (
                          <img
                            src={card.image_url}
                            alt={card.name}
                            style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 3 }}
                            onError={() => setImgErrors(prev => new Set([...prev, card.id]))}
                          />
                        ) : <span style={{ fontSize: 16 }}>🃏</span>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: 12, whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</div>
                        <div style={{ color: '#8A92A6', fontSize: 10, marginTop: 1 }}>{card.set_name}{card.ip_name ? ` · ${card.ip_name}` : ''}</div>
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
                  <td style={{ ...tdStyle, padding: '4px 10px' }}>
                    <Sparkline data={card.sparkline} positive={sparkPos} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

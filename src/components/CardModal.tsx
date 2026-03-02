'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  tcgplayer_url?: string;
}

interface PriceHistory {
  recorded_at: string;
  market_price: number;
  low_price: number;
  high_price: number;
}

interface CardModalProps {
  card: Card;
  currency: 'USD' | 'KRW';
  onClose: () => void;
}

export default function CardModal({ card, currency, onClose }: CardModalProps) {
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cards/${card.id}/history`)
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [card.id]);

  const fmtUSD = (v: number | null) => {
    if (v == null) return 'N/A';
    if (currency === 'KRW') return `₩${(v * 1320).toLocaleString()}`;
    return `$${v.toFixed(2)}`;
  };

  const chartData = history.map(h => ({
    date: new Date(h.recorded_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
    market: currency === 'KRW' ? +(h.market_price * 1320).toFixed(0) : h.market_price,
  }));

  const isUp = (card.change_24h ?? 0) >= 0;
  const changeColor = isUp ? '#16C784' : '#EA3943';

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#1A2332', border: '1px solid #2A3444', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {card.image_url && (
              <img src={card.image_url} alt={card.name} style={{ width: 60, height: 84, objectFit: 'contain', borderRadius: 6 }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <div>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>{card.name}</h2>
              <p style={{ color: '#8A92A6', fontSize: 13, margin: '4px 0' }}>{card.set_name}</p>
              <span style={{ background: '#0D1421', border: '1px solid #2A3444', borderRadius: 20, padding: '2px 10px', fontSize: 11, color: '#8A92A6' }}>{card.rarity}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8A92A6', cursor: 'pointer', fontSize: 22, padding: 4 }}>✕</button>
        </div>

        {/* Price Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: '현재가', value: fmtUSD(card.market_price), highlight: true },
            { label: '24h %', value: card.change_24h != null ? `${card.change_24h >= 0 ? '+' : ''}${card.change_24h.toFixed(2)}%` : '—', color: changeColor },
            { label: '최저가', value: fmtUSD(card.low_price) },
            { label: '최고가', value: fmtUSD(card.high_price) },
          ].map(item => (
            <div key={item.label} style={{ background: '#0D1421', border: '1px solid #2A3444', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ color: '#8A92A6', fontSize: 11, marginBottom: 4 }}>{item.label}</div>
              <div style={{ color: item.color || (item.highlight ? '#F0B90B' : '#fff'), fontWeight: 700, fontSize: 15 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div>
          <h3 style={{ color: '#8A92A6', fontSize: 13, marginBottom: 12 }}>30일 가격 히스토리</h3>
          {loading ? (
            <div style={{ height: 200, background: '#0D1421', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A92A6' }}>로딩 중...</div>
          ) : chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16C784" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16C784" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3444" />
                <XAxis dataKey="date" tick={{ fill: '#8A92A6', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#8A92A6', fontSize: 10 }} tickLine={false} width={50}
                  tickFormatter={v => currency === 'KRW' ? `₩${(v/1000).toFixed(0)}K` : `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#1A2332', border: '1px solid #2A3444', borderRadius: 8 }}
                  labelStyle={{ color: '#8A92A6' }}
                  formatter={(v: number | undefined) => [v != null ? (currency === 'KRW' ? `₩${v.toLocaleString()}` : `$${v.toFixed(2)}`) : 'N/A', '가격']}
                />
                <Area type="monotone" dataKey="market" stroke="#16C784" fill="url(#colorMarket)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, background: '#0D1421', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A92A6' }}>히스토리 없음</div>
          )}
        </div>

        {card.tcgplayer_url && (
          <div style={{ marginTop: 16 }}>
            <a href={card.tcgplayer_url} target="_blank" rel="noopener noreferrer" style={{ color: '#F0B90B', fontSize: 13, textDecoration: 'none' }}>
              TCGPlayer에서 보기 →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

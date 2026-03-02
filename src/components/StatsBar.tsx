'use client';

interface Card {
  market_price: number | null;
  change_24h: number | null;
}

interface StatsBarProps {
  cards: Card[];
  total: number;
  currency: 'USD' | 'KRW';
  onCurrencyToggle: () => void;
}

export default function StatsBar({ cards, total, currency, onCurrencyToggle }: StatsBarProps) {
  const rising = cards.filter(c => (c.change_24h ?? 0) > 0).length;
  const falling = cards.filter(c => (c.change_24h ?? 0) < 0).length;
  const priced = cards.filter(c => c.market_price != null);
  const avgPrice = priced.length > 0
    ? priced.reduce((sum, c) => sum + (c.market_price ?? 0), 0) / priced.length
    : 0;
  const totalVolume = priced.reduce((sum, c) => sum + (c.market_price ?? 0), 0);

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

  return (
    <div style={{ background: '#0D1421', borderBottom: '1px solid #2A3444', padding: '10px 0' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 20px', fontSize: 13, color: '#8A92A6' }}>
        <span style={{ color: '#2A3444' }}>|</span>
        <span>Cards: <strong style={{ color: '#fff' }}>{total.toLocaleString()}</strong></span>
        <span style={{ color: '#2A3444' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#8A92A6' }}>Gainers</span>
          <strong style={{ color: '#16C784', fontSize: 20, fontWeight: 800 }}>{rising} ▲</strong>
        </span>
        <span style={{ color: '#2A3444' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#8A92A6' }}>Losers</span>
          <strong style={{ color: '#EA3943', fontSize: 20, fontWeight: 800 }}>{falling} ▼</strong>
        </span>
        <span style={{ color: '#2A3444' }}>|</span>
        <span>Total Value: <strong style={{ color: '#fff' }}>{fmt(totalVolume)}</strong></span>
        <span style={{ color: '#2A3444' }}>|</span>
        <span>Avg Price: <strong style={{ color: '#fff' }}>{fmt(avgPrice)}</strong></span>
        <span style={{ color: '#2A3444' }}>|</span>
        <button
          onClick={onCurrencyToggle}
          style={{
            background: '#1A2332', border: '1px solid #2A3444', borderRadius: 6,
            color: '#F0B90B', padding: '2px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600
          }}
        >
          {currency === 'USD' ? '$ USD' : '₩ KRW'}
        </button>
      </div>
    </div>
  );
}

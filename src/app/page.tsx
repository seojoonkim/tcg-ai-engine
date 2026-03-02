'use client';

import { useState, useEffect, useCallback } from 'react';
import StatsBar from '@/components/StatsBar';
import CardTable from '@/components/CardTable';
import CardModal from '@/components/CardModal';

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

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'KRW'>('USD');
  const [activeIp, setActiveIp] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: debouncedSearch, page: String(page), limit: '100', sort: 'price_desc' });
      if (activeIp) params.set('ip', activeIp);
      const res = await fetch(`/api/cards?${params}`);
      const data = await res.json();
      setCards(data.cards || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, activeIp]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleIpChange = (ip: string) => {
    setActiveIp(ip);
    setPage(1);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0D1421', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Top header — compact */}
      <div style={{ background: '#0D1421', borderBottom: '1px solid #2A3444' }}>
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>🃏</span>
          <span style={{ color: '#F0B90B', fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px' }}>TCG Market</span>
          <div style={{ flex: 1, position: 'relative', maxWidth: 320 }}>
            <input
              type="text"
              placeholder="Search cards..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', background: '#1A2332', border: '1px solid #2A3444',
                borderRadius: 6, padding: '6px 14px 6px 32px', color: '#fff',
                fontSize: 12, outline: 'none', boxSizing: 'border-box'
              }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8A92A6', fontSize: 12 }}>🔍</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar cards={cards} total={total} currency={currency} onCurrencyToggle={() => setCurrency(c => c === 'USD' ? 'KRW' : 'USD')} />

      {/* Table — full width, no container padding */}
      <div style={{ width: '100%' }}>
        <div style={{ background: '#1A2332', borderTop: '1px solid #2A3444', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#8A92A6' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div>Loading card data...</div>
            </div>
          ) : cards.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#8A92A6' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🃏</div>
              <div>No cards found</div>
            </div>
          ) : (
            <CardTable cards={cards} currency={currency} onCardClick={setSelectedCard} onIpChange={handleIpChange} />
          )}
        </div>

        {/* Load more */}
        {!loading && totalPages > page && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <button
              onClick={() => setPage(p => p + 1)}
              style={{
                background: '#1A2332', border: '1px solid #2A3444',
                color: '#F0B90B', padding: '10px 36px', borderRadius: 8,
                cursor: 'pointer', fontWeight: 600, fontSize: 13
              }}
            >
              Load More ({page * 100} / {total})
            </button>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>

      {/* Modal */}
      {selectedCard && (
        <CardModal card={selectedCard} currency={currency} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

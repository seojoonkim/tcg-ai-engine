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

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: debouncedSearch, page: String(page), limit: '100', sort: 'price_desc' });
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
  }, [debouncedSearch, page]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  return (
    <div style={{ minHeight: '100vh', background: '#0D1421', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Top header */}
      <div style={{ background: '#0D1421', borderBottom: '1px solid #2A3444', padding: '0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 22 }}>🃏</span>
          <span style={{ color: '#F0B90B', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>TCG Market</span>
          <div style={{ flex: 1, position: 'relative', maxWidth: 360 }}>
            <input
              type="text"
              placeholder="카드명, 세트명 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', background: '#1A2332', border: '1px solid #2A3444',
                borderRadius: 8, padding: '8px 16px 8px 36px', color: '#fff',
                fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8A92A6', fontSize: 14 }}>🔍</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar cards={cards} total={total} currency={currency} onCurrencyToggle={() => setCurrency(c => c === 'USD' ? 'KRW' : 'USD')} />

      {/* Page title */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 12px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>포켓몬 카드 시세</h1>
        <p style={{ color: '#8A92A6', fontSize: 13, marginTop: 4 }}>시가총액 순 정렬 | 행 클릭 시 상세 차트</p>
      </div>

      {/* Table */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ background: '#1A2332', border: '1px solid #2A3444', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#8A92A6' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div>카드 데이터 로딩 중...</div>
            </div>
          ) : cards.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#8A92A6' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🃏</div>
              <div>카드가 없습니다</div>
            </div>
          ) : (
            <CardTable cards={cards} currency={currency} onCardClick={setSelectedCard} />
          )}
        </div>

        {/* Load more */}
        {!loading && totalPages > page && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <button
              onClick={() => setPage(p => p + 1)}
              style={{
                background: '#1A2332', border: '1px solid #2A3444',
                color: '#F0B90B', padding: '12px 40px', borderRadius: 8,
                cursor: 'pointer', fontWeight: 600, fontSize: 14
              }}
            >
              더보기 ({page * 100} / {total})
            </button>
          </div>
        )}

        <div style={{ height: 48 }} />
      </div>

      {/* Modal */}
      {selectedCard && (
        <CardModal card={selectedCard} currency={currency} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

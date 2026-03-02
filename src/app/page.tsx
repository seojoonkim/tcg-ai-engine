'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, TrendingDown, X, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Card {
  id: string;
  name: string;
  set_name: string;
  set_code: string;
  rarity: string;
  image_url: string;
  market_price: number | null;
  low_price: number | null;
  high_price: number | null;
  change_24h: number | null;
  change_7d: number | null;
  tcgplayer_url: string;
}

interface PriceHistory {
  recorded_at: string;
  market_price: number;
  low_price: number;
  high_price: number;
}

type SortOption = 'price_desc' | 'price_asc' | 'name_asc' | 'name_desc';

function SkeletonCard() {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-800" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
        <div className="h-5 bg-gray-800 rounded w-1/3 mt-3" />
      </div>
    </div>
  );
}

function ChangeTag({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-gray-500 text-xs">—</span>;
  const isUp = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isUp ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function RarityBadge({ rarity }: { rarity: string }) {
  const colors: Record<string, string> = {
    'Common': 'bg-gray-700 text-gray-300',
    'Uncommon': 'bg-green-900 text-green-300',
    'Rare': 'bg-blue-900 text-blue-300',
    'Double Rare': 'bg-purple-900 text-purple-300',
    'Ultra Rare': 'bg-yellow-900 text-yellow-300',
    'Illustration Rare': 'bg-pink-900 text-pink-300',
    'Special Illustration Rare': 'bg-orange-900 text-orange-300',
    'Hyper Rare': 'bg-red-900 text-red-300',
    'Secret Rare': 'bg-gradient-to-r from-yellow-600 to-pink-600 text-white',
  };
  const cls = colors[rarity] || 'bg-gray-700 text-gray-300';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{rarity}</span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('price_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedSearch,
        page: String(page),
        limit: '24',
        sort,
      });
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
  }, [debouncedSearch, page, sort]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const openCard = async (card: Card) => {
    setSelectedCard(card);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  };

  const chartData = history.map(h => ({
    date: formatDate(h.recorded_at),
    market: h.market_price,
    low: h.low_price,
    high: h.high_price,
  }));

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-2xl">🃏</span>
            <h1 className="text-xl font-bold whitespace-nowrap">TCG Price Tracker</h1>
          </div>
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cards, sets, rarities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={sort}
            onChange={e => { setSort(e.target.value as SortOption); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="price_desc">Price ↓</option>
            <option value="price_asc">Price ↑</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
          </select>
          <button onClick={fetchCards} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <p className="text-gray-400 text-sm">{total.toLocaleString()} cards tracked</p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)
            : cards.map(card => (
              <div
                key={card.id}
                onClick={() => openCard(card)}
                className="bg-gray-900 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group"
              >
                <div className="relative bg-gray-800 h-40 flex items-center justify-center overflow-hidden">
                  {!imgErrors.has(card.id) ? (
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                      onError={() => setImgErrors(prev => new Set([...prev, card.id]))}
                    />
                  ) : (
                    <div className="text-4xl">🃏</div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-xs font-semibold leading-tight line-clamp-2">{card.name}</p>
                  <p className="text-xs text-gray-400 truncate">{card.set_name}</p>
                  <div className="pt-1">
                    <p className="text-sm font-bold text-blue-400">
                      {card.market_price != null ? `$${card.market_price.toFixed(2)}` : 'N/A'}
                    </p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-gray-500 text-xs">24h:</span>
                      <ChangeTag value={card.change_24h} />
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-500 text-xs">7d: </span>
                      <ChangeTag value={card.change_7d} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg bg-gray-800 disabled:opacity-40 hover:bg-gray-700 text-sm"
            >← Prev</button>
            <span className="text-gray-400 text-sm">Page {page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg bg-gray-800 disabled:opacity-40 hover:bg-gray-700 text-sm"
            >Next →</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCard(null)}>
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedCard.name}</h2>
                  <p className="text-gray-400 text-sm">{selectedCard.set_name}</p>
                  <div className="mt-1"><RarityBadge rarity={selectedCard.rarity} /></div>
                </div>
                <button onClick={() => setSelectedCard(null)} className="p-2 rounded-lg hover:bg-gray-800"><X size={20} /></button>
              </div>

              <div className="flex gap-6 mb-6">
                <div className="w-32 shrink-0">
                  {!imgErrors.has(selectedCard.id) ? (
                    <img src={selectedCard.image_url} alt={selectedCard.name} className="w-full rounded-lg"
                      onError={() => setImgErrors(prev => new Set([...prev, selectedCard.id]))} />
                  ) : <div className="w-full h-44 bg-gray-800 rounded-lg flex items-center justify-center text-5xl">🃏</div>}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['Market', selectedCard.market_price],
                      ['Low', selectedCard.low_price],
                      ['High', selectedCard.high_price],
                    ].map(([label, val]) => (
                      <div key={label as string} className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">{label}</p>
                        <p className="text-white font-bold">{val != null ? `$${(val as number).toFixed(2)}` : 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">24h Change</p>
                      <div className="text-base font-bold"><ChangeTag value={selectedCard.change_24h} /></div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">7d Change</p>
                      <div className="text-base font-bold"><ChangeTag value={selectedCard.change_7d} /></div>
                    </div>
                  </div>
                  {selectedCard.tcgplayer_url && (
                    <a href={selectedCard.tcgplayer_url} target="_blank" rel="noopener noreferrer"
                      className="inline-block text-xs text-blue-400 hover:underline">View on TCGPlayer →</a>
                  )}
                </div>
              </div>

              {/* Price Chart */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">30-Day Price History</h3>
                {historyLoading ? (
                  <div className="h-48 bg-gray-800 rounded-lg animate-pulse" />
                ) : chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} tickLine={false} tickFormatter={v => `$${v}`} width={45} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                        labelStyle={{ color: '#D1D5DB' }}
                        formatter={(v: number | undefined) => v != null ? [`$${v.toFixed(2)}`] : ["N/A"]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                      <Line type="monotone" dataKey="market" stroke="#60A5FA" dot={false} name="Market" strokeWidth={2} />
                      <Line type="monotone" dataKey="low" stroke="#34D399" dot={false} name="Low" strokeWidth={1.5} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="high" stroke="#F87171" dot={false} name="High" strokeWidth={1.5} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                    No price history available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Navbar from '@/components/Navbar';
import StatsHeader from '@/components/StatsHeader';
import CardGrid from '@/components/CardGrid';
import CardTable from '@/components/CardTable';
import FilterSidebar from '@/components/FilterSidebar';
import ViewToggle from '@/components/ViewToggle';
import SortDropdown from '@/components/SortDropdown';

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
  const [statsGainers, setStatsGainers] = useState(0);
  const [statsLosers, setStatsLosers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState<'USD' | 'KRW'>('USD');
  const [activeIp, setActiveIp] = useState('');
  const [activeRarity, setActiveRarity] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState('price_desc');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ipCounts, setIpCounts] = useState<Record<string, number>>({});
  const hasMore = page < totalPages;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setCards([]);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Debounce price filters
  const [debouncedPriceMin, setDebouncedPriceMin] = useState('');
  const [debouncedPriceMax, setDebouncedPriceMax] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedPriceMin(priceMin);
      setDebouncedPriceMax(priceMax);
      setPage(1);
      setCards([]);
    }, 600);
    return () => clearTimeout(t);
  }, [priceMin, priceMax]);

  const fetchCards = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedSearch,
        page: String(pageNum),
        limit: '50',
        sort,
      });
      if (activeIp) params.set('ip', activeIp);
      if (activeRarity) params.set('rarity', activeRarity);
      if (debouncedPriceMin) params.set('price_min', debouncedPriceMin);
      if (debouncedPriceMax) params.set('price_max', debouncedPriceMax);
      const res = await fetch(`/api/cards?${params}`);
      const data = await res.json();
      setCards(prev => append ? [...prev, ...(data.cards || [])] : (data.cards || []));
      if (!append) {
        setStatsGainers(data.gainers || 0);
        setStatsLosers(data.losers || 0);
      }
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
      if (data.ip_counts) setIpCounts(data.ip_counts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, activeIp, activeRarity, debouncedPriceMin, debouncedPriceMax, sort]);

  useEffect(() => {
    setPage(1);
    fetchCards(1, false);
  }, [fetchCards]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCards(nextPage, true);
  };

  const handleIpChange = (ip: string) => {
    setActiveIp(ip);
    setPage(1);
    setCards([]);
  };

  const handleRarityChange = (rarity: string) => {
    setActiveRarity(rarity);
    setPage(1);
    setCards([]);
  };

  const handleSortChange = (s: string) => {
    setSort(s);
    setPage(1);
    setCards([]);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar
        search={search}
        onSearchChange={setSearch}
        currency={currency}
        onCurrencyToggle={() => setCurrency(c => c === 'USD' ? 'KRW' : 'USD')}
      />

      <StatsHeader
        cards={cards}
        total={total}
        currency={currency}
        gainers={statsGainers}
        losers={statsLosers}
      />

      <div className="mx-auto flex max-w-[1600px]">
        {/* Sidebar */}
        <FilterSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeIp={activeIp}
          onIpChange={handleIpChange}
          activeRarity={activeRarity}
          onRarityChange={handleRarityChange}
          priceMin={priceMin}
          priceMax={priceMax}
          onPriceMinChange={setPriceMin}
          onPriceMaxChange={setPriceMax}
          ipCounts={ipCounts}
        />

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer lg:hidden"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>
              <SortDropdown value={sort} onChange={handleSortChange} />
            </div>
            <ViewToggle view={view} onViewChange={setView} />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-secondary)' }}>
              <div
                className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: 'var(--border-subtle)', borderTopColor: 'transparent' }}
              />
              <span className="text-sm">Loading cards...</span>
            </div>
          ) : view === 'grid' ? (
            <CardGrid cards={cards} currency={currency} />
          ) : (
            <div className="p-4 md:p-6">
              <CardTable cards={cards} currency={currency} />
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="flex justify-center pb-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-lg px-8 py-2.5 text-sm font-semibold cursor-pointer transition-opacity"
                style={{
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-primary)',
                  opacity: loadingMore ? 0.6 : 1,
                }}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {!loading && !hasMore && cards.length > 0 && (
            <div className="pb-8 text-center text-xs" style={{ color: 'var(--border-subtle)' }}>
              — {total} cards —
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

'use client';

import { Search } from 'lucide-react';

interface NavbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  currency: 'USD' | 'KRW';
  onCurrencyToggle: () => void;
}

export default function Navbar({ search, onSearchChange, currency, onCurrencyToggle }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] backdrop-blur-nav"
      style={{ background: 'oklch(0.13 0.02 260 / 0.85)' }}>
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 md:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 no-underline shrink-0">
          <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Deck<span style={{ color: 'var(--accent-primary)' }}>Alive</span>
          </span>
        </a>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
          />
          <input
            type="text"
            placeholder="Search cards..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full rounded-lg py-2 pl-9 pr-3 text-sm"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Currency Toggle */}
        <button
          onClick={onCurrencyToggle}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--accent-primary)',
          }}
        >
          {currency === 'USD' ? '$ USD' : '₩ KRW'}
        </button>
      </div>
    </header>
  );
}

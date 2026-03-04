'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

const IP_OPTIONS = [
  { value: 'Pokemon', label: 'Pokemon' },
  { value: 'Magic: The Gathering', label: 'Magic: The Gathering' },
  { value: 'Yu-Gi-Oh', label: 'Yu-Gi-Oh' },
  { value: 'One Piece', label: 'One Piece' },
  { value: 'Lorcana', label: 'Lorcana' },
];

const RARITY_OPTIONS = [
  'Common', 'Uncommon', 'Rare', 'Rare Holo',
  'Rare Holo EX', 'Rare Holo GX', 'Rare Holo V',
  'Rare Ultra', 'Rare Secret', 'Rare Rainbow',
  'Illustration Rare', 'Special Art Rare',
];

interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
  activeIp: string;
  onIpChange: (ip: string) => void;
  activeRarity: string;
  onRarityChange: (rarity: string) => void;
  priceMin: string;
  priceMax: string;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
  ipCounts?: Record<string, number>;
}

export default function FilterSidebar({
  open,
  onClose,
  activeIp,
  onIpChange,
  activeRarity,
  onRarityChange,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  ipCounts,
}: FilterSidebarProps) {
  const [ipOpen, setIpOpen] = useState(true);
  const [rarityOpen, setRarityOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r transition-transform duration-200 lg:static lg:z-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--bg-primary)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Filters</span>
          <button onClick={onClose} className="cursor-pointer" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* IP / Game */}
        <Section title="IP / Game" open={ipOpen} onToggle={() => setIpOpen(!ipOpen)}>
          <label
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
            style={{ color: activeIp === '' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            <input
              type="radio"
              name="ip"
              checked={activeIp === ''}
              onChange={() => onIpChange('')}
              className="accent-[var(--accent-primary)]"
            />
            All
          </label>
          {IP_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
              style={{ color: activeIp === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ip"
                  checked={activeIp === opt.value}
                  onChange={() => onIpChange(opt.value)}
                  className="accent-[var(--accent-primary)]"
                />
                {opt.label}
              </span>
              {ipCounts && ipCounts[opt.value] != null && (
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {ipCounts[opt.value].toLocaleString()}
                </span>
              )}
            </label>
          ))}
        </Section>

        {/* Rarity */}
        <Section title="Rarity" open={rarityOpen} onToggle={() => setRarityOpen(!rarityOpen)}>
          <label
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
            style={{ color: activeRarity === '' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            <input
              type="radio"
              name="rarity"
              checked={activeRarity === ''}
              onChange={() => onRarityChange('')}
              className="accent-[var(--accent-primary)]"
            />
            All
          </label>
          {RARITY_OPTIONS.map(r => (
            <label
              key={r}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
              style={{ color: activeRarity === r ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <input
                type="radio"
                name="rarity"
                checked={activeRarity === r}
                onChange={() => onRarityChange(r)}
                className="accent-[var(--accent-primary)]"
              />
              {r}
            </label>
          ))}
        </Section>

        {/* Price Range */}
        <Section title="Price Range" open={priceOpen} onToggle={() => setPriceOpen(!priceOpen)}>
          <div className="flex items-center gap-2 px-2">
            <input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={e => onPriceMinChange(e.target.value)}
              className="w-full rounded-md px-2 py-1.5 text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>—</span>
            <input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={e => onPriceMaxChange(e.target.value)}
              className="w-full rounded-md px-2 py-1.5 text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </Section>
      </aside>
    </>
  );
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between text-xs font-semibold uppercase tracking-wider"
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
      >
        {title}
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div className="mt-2 flex flex-col gap-0.5">{children}</div>}
    </div>
  );
}

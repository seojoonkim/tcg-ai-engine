'use client';

import { ArrowUpDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'change_24h_desc', label: '24h Change: High to Low' },
  { value: 'change_24h_asc', label: '24h Change: Low to High' },
  { value: 'change_7d_desc', label: '7d Change: High to Low' },
  { value: 'change_7d_asc', label: '7d Change: Low to High' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
];

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="relative flex items-center gap-1.5">
      <ArrowUpDown size={14} style={{ color: 'var(--text-secondary)' }} />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="cursor-pointer rounded-lg py-1.5 pl-2 pr-6 text-xs font-medium appearance-none"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

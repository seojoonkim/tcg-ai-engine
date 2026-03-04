'use client';

import { Grid3X3, List } from 'lucide-react';

interface ViewToggleProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  const btnBase = "flex items-center justify-center rounded-md p-1.5 cursor-pointer transition-colors";

  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
      <button
        onClick={() => onViewChange('grid')}
        className={btnBase}
        style={{
          background: view === 'grid' ? 'var(--bg-tertiary)' : 'transparent',
          color: view === 'grid' ? 'var(--text-primary)' : 'var(--text-secondary)',
          border: 'none',
        }}
        title="Grid view"
      >
        <Grid3X3 size={16} />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={btnBase}
        style={{
          background: view === 'list' ? 'var(--bg-tertiary)' : 'transparent',
          color: view === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)',
          border: 'none',
        }}
        title="List view"
      >
        <List size={16} />
      </button>
    </div>
  );
}

'use client';

import CardGridItem from './CardGridItem';

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

interface CardGridProps {
  cards: Card[];
  currency: 'USD' | 'KRW';
}

export default function CardGrid({ cards, currency }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-secondary)' }}>
        <span className="text-3xl mb-3">🔍</span>
        <span className="text-sm">No cards found</span>
      </div>
    );
  }

  return (
    <div
      className="grid gap-4 p-4 md:p-6"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
    >
      {cards.map(card => (
        <CardGridItem key={card.id} card={card} currency={currency} />
      ))}
    </div>
  );
}

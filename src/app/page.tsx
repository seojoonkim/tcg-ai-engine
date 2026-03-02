'use client';

import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, X } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Card {
  id: string; name: string; set_name: string; rarity: string;
  image_url: string; market_price: number; change_24h: number;
  price_history: { date: string; price: number }[];
}

const MOCK_CARDS: Card[] = [
  { id: '1', name: 'Charizard ex', set_name: 'Obsidian Flames', rarity: 'Double Rare',
    image_url: 'https://images.pokemontcg.io/sv3/215_hires.png', market_price: 42.5, change_24h: 3.2,
    price_history: [{ date: '02/24', price: 38 },{ date: '02/25', price: 39.5 },{ date: '02/26', price: 41 },{ date: '02/27', price: 40.5 },{ date: '02/28', price: 41.8 },{ date: '03/01', price: 41.2 },{ date: '03/02', price: 42.5 }] },
  { id: '2', name: 'Pikachu ex', set_name: 'Paldean Fates', rarity: 'Special Illustration Rare',
    image_url: 'https://images.pokemontcg.io/sv4pt5/30_hires.png', market_price: 18.3, change_24h: -1.5,
    price_history: [{ date: '02/24', price: 20 },{ date: '02/25', price: 19.8 },{ date: '02/26', price: 19.5 },{ date: '02/27', price: 19.2 },{ date: '02/28', price: 18.9 },{ date: '03/01', price: 18.6 },{ date: '03/02', price: 18.3 }] },
  { id: '3', name: 'Mewtwo ex', set_name: '151', rarity: 'Ultra Rare',
    image_url: 'https://images.pokemontcg.io/sv3pt5/205_hires.png', market_price: 55.0, change_24h: 5.8,
    price_history: [{ date: '02/24', price: 48 },{ date: '02/25', price: 49.5 },{ date: '02/26', price: 51 },{ date: '02/27', price: 52.5 },{ date: '02/28', price: 53 },{ date: '03/01', price: 54 },{ date: '03/02', price: 55 }] },
  { id: '4', name: 'Umbreon VMAX', set_name: 'Evolving Skies', rarity: 'Ultra Rare',
    image_url: 'https://images.pokemontcg.io/swsh7/215_hires.png', market_price: 89.99, change_24h: -0.8,
    price_history: [{ date: '02/24', price: 92 },{ date: '02/25', price: 91.5 },{ date: '02/26', price: 91 },{ date: '02/27', price: 90.5 },{ date: '02/28', price: 90.2 },{ date: '03/01', price: 90.5 },{ date: '03/02', price: 89.99 }] },
  { id: '5', name: 'Rayquaza VMAX', set_name: 'Evolving Skies', rarity: 'Ultra Rare',
    image_url: 'https://images.pokemontcg.io/swsh7/218_hires.png', market_price: 62.0, change_24h: 2.1,
    price_history: [{ date: '02/24', price: 58 },{ date: '02/25', price: 59 },{ date: '02/26', price: 60 },{ date: '02/27', price: 60.5 },{ date: '02/28', price: 61 },{ date: '03/01', price: 61.5 },{ date: '03/02', price: 62 }] },
  { id: '6', name: 'Lugia V', set_name: 'Silver Tempest', rarity: 'Ultra Rare',
    image_url: 'https://images.pokemontcg.io/swsh12/186_hires.png', market_price: 12.5, change_24h: 0.4,
    price_history: [{ date: '02/24', price: 12 },{ date: '02/25', price: 12.1 },{ date: '02/26', price: 12.2 },{ date: '02/27', price: 12.3 },{ date: '02/28', price: 12.3 },{ date: '03/01', price: 12.4 },{ date: '03/02', price: 12.5 }] },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const filtered = MOCK_CARDS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.set_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🃏</span>
            <h1 className="text-xl font-bold">TCG Price Tracker</h1>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search cards..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map(card => (
            <div key={card.id} onClick={() => setSelectedCard(card)}
              className="bg-gray-900 border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition-all">
              <div className="aspect-[3/4] bg-gray-800 rounded-lg mb-3 overflow-hidden">
                <img src={card.image_url} alt={card.name} className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x280/1f2937/6b7280?text=No+Image'; }} />
              </div>
              <p className="text-xs font-semibold text-white truncate">{card.name}</p>
              <p className="text-xs text-gray-500 truncate mb-2">{card.set_name}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">${card.market_price.toFixed(2)}</span>
                <span className={`text-xs flex items-center gap-0.5 ${card.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {card.change_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(card.change_24h)}%
                </span>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div className="text-center text-gray-500 py-20">No cards found.</div>}
      </div>

      {selectedCard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCard(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedCard.name}</h2>
                <p className="text-gray-400 text-sm">{selectedCard.set_name}</p>
                <p className="text-gray-500 text-xs">{selectedCard.rarity}</p>
              </div>
              <button onClick={() => setSelectedCard(null)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold">${selectedCard.market_price.toFixed(2)}</span>
              <span className={`text-sm flex items-center gap-1 px-2 py-1 rounded-full ${selectedCard.change_24h >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                {selectedCard.change_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {selectedCard.change_24h >= 0 ? '+' : ''}{selectedCard.change_24h}% (24h)
              </span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedCard.price_history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} domain={['auto', 'auto']} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} formatter={(v: number) => [`$${v}`, 'Price']} />
                  <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

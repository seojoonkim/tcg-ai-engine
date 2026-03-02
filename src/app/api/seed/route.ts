import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SEED_SECRET = 'tcg-seed-2026';
const TCG_API_BASE = 'https://api.pokemontcg.io/v2/cards';

interface TcgCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  rarity?: string;
  set?: { id: string; name: string; series: string };
  images?: { small: string; large: string };
  tcgplayer?: {
    url?: string;
    prices?: Record<string, { low?: number; mid?: number; high?: number; market?: number } | undefined>;
  };
}

function extractPrice(prices: Record<string, { low?: number; mid?: number; high?: number; market?: number } | undefined> | null | undefined) {
  if (!prices) return null;
  const variant = prices['holofoil'] || prices['1stEditionHolofoil'] || prices['normal'] || prices['reverseHolofoil'];
  if (!variant) return null;
  return {
    market: variant.market ?? null,
    low: variant.low ?? null,
    high: variant.high ?? null,
  };
}

function generatePriceHistory(cardId: string, market: number, low: number | null, high: number | null) {
  const rows = [];
  let currentMarket = market;
  let currentLow = low ?? market * 0.9;
  let currentHigh = high ?? market * 1.1;
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const factor = 1 + (Math.random() * 0.06 - 0.03);
    currentMarket = Math.max(0.01, currentMarket * factor);
    currentLow = Math.max(0.01, currentLow * factor);
    currentHigh = Math.max(0.01, currentHigh * factor);

    const date = new Date(today);
    date.setDate(today.getDate() - i);

    rows.push({
      card_id: cardId,
      market_price: parseFloat(currentMarket.toFixed(2)),
      low_price: parseFloat(currentLow.toFixed(2)),
      high_price: parseFloat(currentHigh.toFixed(2)),
      recorded_at: date.toISOString().split('T')[0],
    });
  }
  return rows;
}

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pageParam = searchParams.get('page');
  const truncate = searchParams.get('truncate') === '1';

  // Step 0: truncate (call with ?truncate=1 first)
  if (truncate) {
    await supabase.from('price_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return NextResponse.json({ success: true, action: 'truncated' });
  }

  const page = parseInt(pageParam || '1');
  if (isNaN(page) || page < 1 || page > 4) {
    return NextResponse.json({ error: 'page must be 1-4' }, { status: 400 });
  }

  const url = `${TCG_API_BASE}?q=supertype:Pokemon&pageSize=250&page=${page}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `TCG API HTTP ${res.status}` }, { status: 502 });
  }

  const data = await res.json();
  const cards: TcgCard[] = data.data || [];

  if (cards.length === 0) {
    return NextResponse.json({ success: true, page, cards: 0, price_history: 0 });
  }

  const cardRows = cards.map((card) => ({
    id: card.id,
    name: card.name,
    supertype: card.supertype,
    subtypes: card.subtypes || [],
    hp: card.hp ? parseInt(card.hp) : null,
    types: card.types || [],
    rarity: card.rarity || null,
    set_id: card.set?.id || null,
    set_name: card.set?.name || null,
    set_series: card.set?.series || null,
    image_small: card.images?.small || null,
    image_large: card.images?.large || null,
    tcgplayer_url: card.tcgplayer?.url || null,
  }));

  const { error: cardError } = await supabase
    .from('cards')
    .upsert(cardRows, { onConflict: 'id' });

  if (cardError) {
    return NextResponse.json({ error: cardError.message }, { status: 500 });
  }

  const historyRows: object[] = [];
  for (const card of cards) {
    const price = extractPrice(card.tcgplayer?.prices);
    if (!price || price.market == null) continue;
    historyRows.push(...generatePriceHistory(card.id, price.market, price.low, price.high));
  }

  let totalHistory = 0;
  const errors: string[] = [];
  for (let i = 0; i < historyRows.length; i += 500) {
    const chunk = historyRows.slice(i, i + 500);
    const { error: histError } = await supabase.from('price_history').insert(chunk);
    if (histError) {
      errors.push(histError.message);
    } else {
      totalHistory += chunk.length;
    }
  }

  return NextResponse.json({
    success: true,
    page,
    cards: cardRows.length,
    price_history: totalHistory,
    errors: errors.length > 0 ? errors : undefined,
  });
}

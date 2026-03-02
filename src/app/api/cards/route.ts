import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 300; // 5-min edge cache

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const ip = searchParams.get('ip') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const sort = searchParams.get('sort') || 'price_desc';
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('cards_with_prices')
      .select('*', { count: 'exact' });

    if (q) {
      query = query.or(`name.ilike.%${q}%,set_name.ilike.%${q}%,rarity.ilike.%${q}%`);
    }

    if (ip) {
      query = query.eq('ip_name', ip);
    }

    switch (sort) {
      case 'price_desc':
        query = query.order('market_price', { ascending: false, nullsFirst: false });
        break;
      case 'price_asc':
        query = query.order('market_price', { ascending: true, nullsFirst: false });
        break;
      case 'change_24h_desc':
        query = query.order('change_24h', { ascending: false, nullsFirst: false });
        break;
      case 'change_24h_asc':
        query = query.order('change_24h', { ascending: true, nullsFirst: false });
        break;
      case 'change_7d_desc':
        query = query.order('change_7d', { ascending: false, nullsFirst: false });
        break;
      case 'change_7d_asc':
        query = query.order('change_7d', { ascending: true, nullsFirst: false });
        break;
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      default:
        query = query.order('market_price', { ascending: false, nullsFirst: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: cards, error, count } = await query;
    if (error) throw error;

    // Batch-fetch 7-day sparkline for returned cards (single query, not N+1)
    const cardIds = (cards || []).map((c: { id: string }) => c.id);
    const sparklineMap: Record<string, number[]> = {};

    if (cardIds.length > 0) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: histRows } = await supabase
        .from('price_history')
        .select('card_id, market_price, recorded_at')
        .in('card_id', cardIds)
        .gte('recorded_at', sevenDaysAgo)
        .order('recorded_at', { ascending: true });

      if (histRows) {
        for (const row of histRows) {
          if (!sparklineMap[row.card_id]) sparklineMap[row.card_id] = [];
          if (row.market_price != null) sparklineMap[row.card_id].push(row.market_price);
        }
      }
    }

    const enriched = (cards || []).map((card: Record<string, unknown>) => ({
      ...card,
      sparkline: sparklineMap[card.id as string] || [],
    }));

    return NextResponse.json(
      {
        cards: enriched,
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

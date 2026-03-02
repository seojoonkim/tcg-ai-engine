import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Cache-Control header below handles edge caching

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
      .from('cards')
      .select('*', { count: 'exact' });

    if (q) {
      query = query.or(`name.ilike.%${q}%,set_name.ilike.%${q}%,rarity.ilike.%${q}%`);
    }

    if (ip) {
      query = query.eq('ip_name', ip);
    }

    switch (sort) {
      case 'price_desc':
        query = query.order('loose_price', { ascending: false, nullsFirst: false });
        break;
      case 'price_asc':
        query = query.order('loose_price', { ascending: true, nullsFirst: false });
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
        query = query.order('loose_price', { ascending: false, nullsFirst: false });
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

    const enriched = (cards || []).map((card: Record<string, unknown>) => {
      const sparkline = sparklineMap[card.id as string] || [];
      // price_history 기준으로 통일 (loose_price와 불일치 방지)
      const currentPrice = sparkline.length > 0 ? sparkline[sparkline.length - 1] : ((card.loose_price as number) || 0);
      
      // 24h 변화율: sparkline 마지막-1 기준
      let change24h: number | null = null;
      if (sparkline.length >= 2) {
        const prev = sparkline[sparkline.length - 2];
        if (prev > 0) change24h = +((currentPrice - prev) / prev * 100).toFixed(2);
      }
      
      // 7d 변화율: sparkline 첫 값 기준
      let change7d: number | null = null;
      if (sparkline.length >= 2) {
        const prev7 = sparkline[0];
        if (prev7 > 0) change7d = +((currentPrice - prev7) / prev7 * 100).toFixed(2);
      }
      
      return {
        ...card,
        market_price: +currentPrice.toFixed(2),
        change_24h: change24h,
        change_7d: change7d,
        sparkline,
      };
    });

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

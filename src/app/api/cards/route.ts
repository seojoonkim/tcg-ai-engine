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
        const raw24h = (currentPrice - prev) / prev * 100;
        if (Math.abs(raw24h) <= 500) change24h = +raw24h.toFixed(2);
      }
      
      // 7d 변화율: sparkline 첫 값 기준
      let change7d: number | null = null;
      if (sparkline.length >= 2) {
        const prev7 = sparkline[0];
        const raw7d = prev7 > 0 ? (currentPrice - prev7) / prev7 * 100 : 0;
        if (prev7 > 0 && Math.abs(raw7d) <= 500) change7d = +raw7d.toFixed(2);
      }
      
      // 7d Low/High: sparkline 전체 min/max
      const low_7d = sparkline.length > 0 ? +Math.min(...sparkline).toFixed(2) : null;
      const high_7d = sparkline.length > 0 ? +Math.max(...sparkline).toFixed(2) : null;

      return {
        ...card,
        market_price: +currentPrice.toFixed(2),
        change_24h: change24h,
        change_7d: change7d,
        low_price: low_7d,
        high_price: high_7d,
        sparkline,
      };
    });

    // 전체 gainers/losers: change_7d 기준, 전체 카드에서 집계
    const allGainers = enriched.filter(c => (c.change_7d ?? 0) > 1).length;
    const allLosers = enriched.filter(c => (c.change_7d ?? 0) < -1).length;

    // page=1일 때만 전체 통계 별도 집계 (캐시 효율)
    let globalGainers = allGainers;
    let globalLosers = allLosers;
    if (page === 1 && !search) {
      // 전체 카드 count로 비율 추정 (정확한 값은 precompute 필요)
      globalGainers = Math.round(allGainers / enriched.length * (count || 0));
      globalLosers = Math.round(allLosers / enriched.length * (count || 0));
    }

    // 전체 gainers/losers: 로드된 카드 기준 → total 비율로 추정
    const pageGainers = enriched.filter(c => (c.change_7d ?? 0) > 0).length;
    const pageLosers = enriched.filter(c => (c.change_7d ?? 0) < 0).length;
    const ratio = enriched.length > 0 ? (count || enriched.length) / enriched.length : 1;
    const gainers = Math.round(pageGainers * ratio);
    const losers = Math.round(pageLosers * ratio);

    return NextResponse.json(
      {
        cards: enriched,
        total: count || 0,
        gainers,
        losers,
        gainers: globalGainers,
        losers: globalLosers,
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

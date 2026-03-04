import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const ip = searchParams.get('ip') || '';
  const rarity = searchParams.get('rarity') || '';
  const priceMin = searchParams.get('price_min') || '';
  const priceMax = searchParams.get('price_max') || '';
  const setFilter = searchParams.get('set') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const sort = searchParams.get('sort') || 'price_desc';
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('cards')
      .select('*', { count: 'exact' });

    if (q) {
      const sanitizedQ = q.replace(/[%_\\]/g, '\\$&');
      query = query.or(`name.ilike.%${sanitizedQ}%,set_name.ilike.%${sanitizedQ}%,rarity.ilike.%${sanitizedQ}%`);
    }

    if (ip) {
      query = query.eq('ip_name', ip);
    }

    if (rarity) {
      query = query.eq('rarity', rarity);
    }

    if (priceMin) {
      query = query.gte('loose_price', parseFloat(priceMin));
    }

    if (priceMax) {
      query = query.lte('loose_price', parseFloat(priceMax));
    }

    if (setFilter) {
      query = query.eq('set_name', setFilter);
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

    // Batch-fetch 7-day sparkline
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

      // Fix #1: loose_price primary, sparkline fallback
      const currentPrice = card.loose_price
        ? Number(card.loose_price)
        : sparkline.length > 0 ? sparkline[sparkline.length - 1] : 0;

      // Fix #2: is_new flag, no cap on change
      const isNew = sparkline.length < 7;

      let change24h: number | null = null;
      if (sparkline.length >= 2) {
        const prev = sparkline[sparkline.length - 2];
        if (prev > 0) {
          change24h = +((currentPrice - prev) / prev * 100).toFixed(2);
        }
      }

      let change7d: number | null = null;
      if (sparkline.length >= 2) {
        const prev7 = sparkline[0];
        if (prev7 > 0) {
          change7d = +((currentPrice - prev7) / prev7 * 100).toFixed(2);
        }
      }

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
        is_new: isNew,
      };
    });

    // Fix #5: Single gainers/losers calculation (was duplicated before)
    const pageGainers = enriched.filter((c: { change_7d: number | null }) => (c.change_7d ?? 0) > 0).length;
    const pageLosers = enriched.filter((c: { change_7d: number | null }) => (c.change_7d ?? 0) < 0).length;
    const ratio = enriched.length > 0 ? (count || enriched.length) / enriched.length : 1;
    const gainers = Math.round(pageGainers * ratio);
    const losers = Math.round(pageLosers * ratio);

    // Fix #6: IP counts (page 1 only, no filter)
    let ipCounts: Record<string, number> | undefined;
    if (page === 1 && !ip) {
      const ips = ['Pokemon', 'Magic: The Gathering', 'Yu-Gi-Oh', 'One Piece', 'Lorcana'];
      ipCounts = {};
      for (const ipName of ips) {
        const { count: c } = await supabase.from('cards').select('id', { count: 'exact', head: true }).eq('ip_name', ipName);
        ipCounts[ipName] = c || 0;
      }
    }

    return NextResponse.json(
      {
        cards: enriched,
        total: count || 0,
        gainers,
        losers,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
        ...(ipCounts ? { ip_counts: ipCounts } : {}),
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

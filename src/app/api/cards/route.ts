import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const sort = searchParams.get('sort') || 'name_asc';
  const offset = (page - 1) * limit;

  try {
    // Get latest prices via a subquery approach
    // First get cards with latest price
    let query = supabase
      .from('cards_with_prices')
      .select('*', { count: 'exact' });

    if (q) {
      query = query.or(`name.ilike.%${q}%,set_name.ilike.%${q}%,rarity.ilike.%${q}%`);
    }

    // Sorting
    switch (sort) {
      case 'price_desc':
        query = query.order('market_price', { ascending: false, nullsFirst: false });
        break;
      case 'price_asc':
        query = query.order('market_price', { ascending: true, nullsFirst: false });
        break;
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      default:
        query = query.order('name', { ascending: true });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      cards: data || [],
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

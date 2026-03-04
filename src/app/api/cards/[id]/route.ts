import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data: card, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Fetch 30-day sparkline
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: history } = await supabase
      .from('price_history')
      .select('market_price, low_price, high_price, recorded_at')
      .eq('card_id', id)
      .gte('recorded_at', thirtyDaysAgo)
      .order('recorded_at', { ascending: true });

    const sparkline = (history || []).map((h: { market_price: number }) => h.market_price).filter(Boolean);
    const currentPrice = card.loose_price
      ? Number(card.loose_price)
      : sparkline.length > 0 ? sparkline[sparkline.length - 1] : 0;

    let change24h: number | null = null;
    if (sparkline.length >= 2) {
      const prev = sparkline[sparkline.length - 2];
      if (prev > 0) change24h = +((currentPrice - prev) / prev * 100).toFixed(2);
    }

    let change7d: number | null = null;
    const sevenDayIdx = Math.max(0, sparkline.length - 7);
    if (sparkline.length >= 2) {
      const prev7 = sparkline[sevenDayIdx];
      if (prev7 > 0) change7d = +((currentPrice - prev7) / prev7 * 100).toFixed(2);
    }

    const low7d = sparkline.length > 0 ? +Math.min(...sparkline.slice(-7)).toFixed(2) : null;
    const high7d = sparkline.length > 0 ? +Math.max(...sparkline.slice(-7)).toFixed(2) : null;

    return NextResponse.json({
      card: {
        ...card,
        market_price: +currentPrice.toFixed(2),
        change_24h: change24h,
        change_7d: change7d,
        low_price: low7d,
        high_price: high7d,
        sparkline,
      },
      history: history || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

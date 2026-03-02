CREATE OR REPLACE VIEW cards_with_prices AS
SELECT 
  c.id, c.name, c.set_name, c.set_code, c.rarity, c.image_url, c.tcgplayer_url, c.created_at,
  ph.market_price, ph.low_price, ph.mid_price, ph.high_price, ph.recorded_at AS price_updated_at,
  ROUND(((ph.market_price - ph2.market_price) / NULLIF(ph2.market_price, 0)) * 100, 2) AS change_24h,
  ROUND(((ph.market_price - ph7.market_price) / NULLIF(ph7.market_price, 0)) * 100, 2) AS change_7d
FROM cards c
LEFT JOIN LATERAL (
  SELECT * FROM price_history WHERE card_id = c.id ORDER BY recorded_at DESC LIMIT 1
) ph ON true
LEFT JOIN LATERAL (
  SELECT * FROM price_history WHERE card_id = c.id AND recorded_at <= NOW() - INTERVAL '24 hours' ORDER BY recorded_at DESC LIMIT 1
) ph2 ON true
LEFT JOIN LATERAL (
  SELECT * FROM price_history WHERE card_id = c.id AND recorded_at <= NOW() - INTERVAL '7 days' ORDER BY recorded_at DESC LIMIT 1
) ph7 ON true;

-- Allow anon to read
GRANT SELECT ON cards_with_prices TO anon, authenticated;

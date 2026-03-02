CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  set_name TEXT,
  set_code TEXT,
  rarity TEXT,
  image_url TEXT,
  tcgplayer_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_history (
  id BIGSERIAL PRIMARY KEY,
  card_id TEXT REFERENCES cards(id),
  market_price NUMERIC(10,2),
  low_price NUMERIC(10,2),
  mid_price NUMERIC(10,2),
  high_price NUMERIC(10,2),
  source TEXT DEFAULT 'tcgplayer',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_card_id ON price_history(card_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at DESC);

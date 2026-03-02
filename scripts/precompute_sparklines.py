#!/usr/bin/env python3
"""
Precompute sparkline_data, change_24h, change_7d, current_price into cards table.
Run this after applying migration: supabase/migrations/20260302000003_sparkline_columns.sql

Usage:
  pip install supabase
  SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python3 scripts/precompute_sparklines.py
"""

import os, json, sys
from datetime import datetime, timedelta, timezone

try:
    from supabase import create_client
except ImportError:
    print("Run: pip install supabase")
    sys.exit(1)

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # Try loading from .env.local
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    if os.path.exists(env_path):
        for line in open(env_path):
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()
        SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

now = datetime.now(timezone.utc)
ago_24h = (now - timedelta(hours=24)).isoformat()
ago_7d  = (now - timedelta(days=7)).isoformat()

print("Fetching all cards...")
cards_res = supabase.table("cards").select("id").execute()
cards = cards_res.data
print(f"  {len(cards)} cards found")

BATCH = 50
updates = []

for i in range(0, len(cards), BATCH):
    batch_ids = [c["id"] for c in cards[i:i+BATCH]]
    print(f"  Processing cards {i+1}–{min(i+BATCH, len(cards))}...")

    # Fetch recent price history (7d)
    hist_res = supabase.table("price_history") \
        .select("card_id, market_price, recorded_at") \
        .in_("card_id", batch_ids) \
        .gte("recorded_at", ago_7d) \
        .order("recorded_at", desc=False) \
        .execute()

    hist_by_card: dict[str, list] = {}
    for row in (hist_res.data or []):
        cid = row["card_id"]
        if cid not in hist_by_card:
            hist_by_card[cid] = []
        if row["market_price"] is not None:
            hist_by_card[cid].append({"price": row["market_price"], "at": row["recorded_at"]})

    for card_id in batch_ids:
        rows = hist_by_card.get(card_id, [])
        prices = [r["price"] for r in rows]
        sparkline = prices[-20:] if len(prices) > 20 else prices  # max 20 points

        current_price = prices[-1] if prices else None

        # 24h change
        change_24h = None
        rows_24h_ago = [r for r in rows if r["at"] >= ago_24h]
        if rows_24h_ago and current_price is not None:
            oldest_24h = rows_24h_ago[0]["price"]
            if oldest_24h and oldest_24h != 0:
                change_24h = round((current_price - oldest_24h) / oldest_24h * 100, 2)

        # 7d change
        change_7d = None
        if len(rows) >= 2 and current_price is not None:
            oldest_7d = rows[0]["price"]
            if oldest_7d and oldest_7d != 0:
                change_7d = round((current_price - oldest_7d) / oldest_7d * 100, 2)

        updates.append({
            "id": card_id,
            "sparkline_data": json.dumps(sparkline),
            "current_price": current_price,
            "change_24h": change_24h,
            "change_7d": change_7d,
        })

print(f"Upserting {len(updates)} cards...")
for i in range(0, len(updates), BATCH):
    chunk = updates[i:i+BATCH]
    supabase.table("cards").upsert(chunk).execute()
    print(f"  Upserted {i+len(chunk)}/{len(updates)}")

print("Done! Sparklines precomputed.")

#!/usr/bin/env python3
"""Seed expensive TCG cards from PriceCharting into Supabase."""

import requests
import random
import re
import time
from datetime import datetime, timedelta, timezone

PRICECHARTING_TOKEN = "c0b53bce27c1bdab90b1605249e600dc43dfd1d5"
SUPABASE_URL = "https://vlrygkxgugpeekxikpnq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscnlna3hndWdwZWVreGlrcG5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQyNjM2NiwiZXhwIjoyMDg4MDAyMzY2fQ.fQeHYYlkGMHMaiBStRKKg_KXZdnxG3BliaOyr3k4DT4"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
VALID_CONSOLES = ["pokemon", "magic", "yugioh", "one-piece"]

# (label, api_query, console_slug, product_slug)
TARGETS = [
    ("Charizard 1st Ed Base Set", "charizard 1st edition base set pokemon", "pokemon-base-set", "charizard-1st-edition-4"),
    ("Charizard Shadowless Base Set", "charizard shadowless pokemon base set", "pokemon-base-set", "charizard-shadowless-4"),
    ("Pikachu Illustrator Promo", "pikachu illustrator pokemon promo", "pokemon-promo", "pikachu-illustrator"),
    ("Lugia 1st Ed Neo Genesis", "lugia 1st edition neo genesis pokemon", "pokemon-neo-genesis", "lugia-1st-edition-9"),
    ("Blastoise 1st Ed Base Set", "blastoise 1st edition base set pokemon", "pokemon-base-set", "blastoise-1st-edition-2"),
    ("Venusaur 1st Ed Base Set", "venusaur 1st edition base set pokemon", "pokemon-base-set", "venusaur-1st-edition-15"),
    ("Mewtwo 1st Ed Base Set", "mewtwo 1st edition base set pokemon", "pokemon-base-set", "mewtwo-1st-edition-10"),
    ("Umbreon Gold Star POP5", "umbreon gold star pop series 5 pokemon", "pokemon-pop-series-5", "umbreon-gold-star-17"),
    ("Espeon Gold Star POP5", "espeon gold star pop series 5 pokemon", "pokemon-pop-series-5", "espeon-gold-star-16"),
    ("Charizard Holo Base Set", "charizard holo base set pokemon", "pokemon-base-set", "charizard-4"),
    ("Charizard GX Rainbow Rare", "charizard gx rainbow rare burning shadows", "pokemon-burning-shadows", "charizard-gx-150"),
    ("Charizard VMAX Golden", "charizard vmax golden champions path", "pokemon-champions-path", "charizard-vmax-74"),
    ("Black Lotus Alpha", "black lotus alpha magic", "magic-alpha", "black-lotus"),
    ("Black Lotus Beta", "black lotus beta magic", "magic-beta", "black-lotus"),
    ("Mox Ruby Alpha", "mox ruby alpha magic", "magic-alpha", "mox-ruby"),
    ("Underground Sea Revised", "underground sea revised magic", "magic-revised", "underground-sea"),
    ("Volcanic Island Revised", "volcanic island revised magic", "magic-revised", "volcanic-island"),
]

def scrape_price(console_slug, product_slug):
    url = f"https://www.pricecharting.com/game/{console_slug}/{product_slug}"
    try:
        resp = requests.get(url, headers={"User-Agent": UA}, timeout=15)
        resp.raise_for_status()
        html = resp.text
        m = re.search(r'id="used_price"[^>]*>.*?<span class="price js-price">\s*([\$\d,\.]+)', html, re.DOTALL)
        if m:
            price_str = m.group(1).replace("$", "").replace(",", "").strip()
            return float(price_str), url
    except Exception as e:
        print(f"    Scrape error: {e}")
    return None, url

def search_card_api(query):
    url = f"https://www.pricecharting.com/api/products?t={PRICECHARTING_TOKEN}&q={query}"
    resp = requests.get(url, timeout=15)
    if resp.status_code == 429:
        print("    Rate limited, waiting 10s...")
        time.sleep(10)
        resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    products = data.get("products", [])
    valid = [p for p in products if any(c in (p.get("console-name", "") or "").lower() for c in VALID_CONSOLES)]
    return valid[0] if valid else (products[0] if products else None)

def determine_ip(console_name):
    cn = (console_name or "").lower()
    if "pokemon" in cn:
        return "Pokemon"
    elif "magic" in cn:
        return "Magic"
    elif "yugioh" in cn or "yu-gi-oh" in cn:
        return "YuGiOh"
    elif "one-piece" in cn or "one piece" in cn:
        return "OnePiece"
    return "Other"

def upsert_card(card_data):
    url = f"{SUPABASE_URL}/rest/v1/cards"
    resp = requests.post(
        url,
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=card_data,
        timeout=15,
    )
    if not resp.ok:
        print(f"    Cards upsert error: {resp.status_code} {resp.text[:200]}")
    resp.raise_for_status()

def upsert_price_history(card_id, base_price):
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    records = []
    for i in range(90):
        day = today - timedelta(days=89 - i)
        variation = random.uniform(-0.05, 0.05)
        price = round(base_price * (1 + variation), 2)
        low = round(price * random.uniform(0.88, 0.95), 2)
        high = round(price * random.uniform(1.05, 1.15), 2)
        mid = round((price + low + high) / 3, 2)
        records.append({
            "card_id": card_id,
            "market_price": price,
            "low_price": low,
            "mid_price": mid,
            "high_price": high,
            "source": "generated",
            "recorded_at": day.isoformat(),
        })
    # Insert in batches of 30
    for i in range(0, len(records), 30):
        batch = records[i:i+30]
        url = f"{SUPABASE_URL}/rest/v1/price_history"
        resp = requests.post(
            url,
            headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
            json=batch,
            timeout=30,
        )
        if not resp.ok:
            print(f"    Price history error: {resp.status_code} {resp.text[:200]}")
            resp.raise_for_status()

def main():
    added = []
    skipped = []
    errors = []

    for label, api_query, console_slug, product_slug in TARGETS:
        print(f"\n🔍 {label}")
        try:
            # Scrape price
            price_usd, page_url = scrape_price(console_slug, product_slug)
            time.sleep(1)  # be nice to the server

            if price_usd is None:
                print(f"  ⚠️  Could not get price from page")
                skipped.append(label)
                continue

            if price_usd < 100:
                print(f"  ⏭️  Price too low: ${price_usd:.2f}")
                skipped.append(f"{label} (${price_usd:.2f})")
                continue

            # Get product metadata from API
            try:
                product = search_card_api(api_query)
                time.sleep(2)
            except Exception as e:
                print(f"  ⚠️  API error (using slug as fallback): {e}")
                product = None

            if product:
                product_id = str(product.get("id", ""))
                name = product.get("product-name", label)
                console = product.get("console-name", console_slug)
            else:
                product_id = f"{console_slug}-{product_slug}"
                name = label
                console = console_slug

            ip_name = determine_ip(console)
            card_id = f"pc-{product_id}"

            card_data = {
                "id": card_id,
                "name": name,
                "set_name": console,
                "set_code": console_slug.upper()[:10],
                "rarity": "Rare" if "magic" in console.lower() else "Holo Rare",
                "image_url": "",
                "tcgplayer_url": page_url,
                "ip_name": ip_name,
                "loose_price": price_usd,
            }

            upsert_card(card_data)
            upsert_price_history(card_id, price_usd)

            print(f"  ✅ {name} | ${price_usd:,.2f} | {console}")
            added.append({"name": name, "price": price_usd, "set": console, "id": card_id})

        except Exception as e:
            print(f"  ❌ Error: {e}")
            errors.append(f"{label}: {e}")

    print("\n" + "="*60)
    print(f"✅ Added/Updated: {len(added)} cards")
    print(f"⏭️  Skipped: {len(skipped)}")
    print(f"❌ Errors: {len(errors)}")

    if added:
        print("\n🏆 Top cards by price:")
        for i, c in enumerate(sorted(added, key=lambda x: x["price"], reverse=True)[:10], 1):
            print(f"  {i}. {c['name']} — ${c['price']:,.2f}")

    if errors:
        print("\n❌ Errors:")
        for e in errors:
            print(f"  - {e}")

    return added, skipped, errors

if __name__ == "__main__":
    main()

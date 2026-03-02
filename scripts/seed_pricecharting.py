import urllib.request
import urllib.parse
import json
import time
import os
import sys

TOKEN = "c0b53bce27c1bdab90b1605249e600dc43dfd1d5"

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

SEARCHES = {
    "Pokemon": [
        "charizard", "pikachu", "mewtwo", "blastoise", "venusaur",
        "eevee", "umbreon", "rayquaza", "lugia", "mew", "gengar",
        "snorlax", "dragonite", "gyarados", "alakazam", "machamp",
        "zapdos", "articuno", "moltres", "celebi", "ho-oh",
        "entei", "suicune", "raikou", "latios", "latias",
        "groudon", "kyogre", "deoxys", "darkrai", "arceus"
    ],
    "Magic: The Gathering": [
        "black lotus", "mox sapphire", "ancestral recall",
        "timetwister", "lightning bolt", "counterspell",
        "force of will", "dark ritual", "serra angel",
        "shock lands", "fetch lands", "dual lands",
        "sol ring", "birds of paradise", "swords to plowshares"
    ],
    "Yu-Gi-Oh": [
        "blue eyes white dragon", "dark magician", "exodia",
        "pot of greed", "mirror force", "raigeki",
        "red eyes black dragon", "celtic guardian", "jinzo",
        "torrential tribute", "monster reborn", "change of heart",
        "black luster soldier", "chaos emperor dragon", "card of sanctity"
    ],
    "One Piece": [
        "monkey d luffy", "roronoa zoro", "nami one piece",
        "nico robin", "sanji one piece", "chopper",
        "ace one piece", "shanks one piece", "whitebeard",
        "kaido one piece", "yamato", "boa hancock"
    ],
    "Lorcana": [
        "elsa lorcana", "mickey mouse lorcana", "moana lorcana",
        "simba lorcana", "stitch lorcana", "maleficent lorcana",
        "ariel lorcana", "cinderella lorcana", "belle lorcana",
        "ursula lorcana", "hades lorcana", "jafar lorcana"
    ]
}

def search_cards(query, limit=20):
    url = f"https://www.pricecharting.com/api/products?t={TOKEN}&q={urllib.parse.quote(query)}"
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            data = json.load(r)
        return data.get("products", [])[:limit]
    except Exception as e:
        print(f"  search error for '{query}': {e}")
        return []

def get_price(product_id):
    url = f"https://www.pricecharting.com/api/product?t={TOKEN}&id={product_id}"
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            return json.load(r)
    except Exception as e:
        print(f"  price error for id {product_id}: {e}")
        return {}

def detect_ip(product, ip_name):
    """Verify the product belongs to the expected IP via console-name"""
    console = (product.get("console-name") or "").lower()
    name = ip_name.lower()
    if name == "pokemon":
        return "pokemon" in console
    elif name == "magic: the gathering":
        return "magic" in console
    elif name == "yu-gi-oh":
        return "yu-gi-oh" in console or "yugioh" in console
    elif name == "one piece":
        return "one piece" in console
    elif name == "lorcana":
        return "lorcana" in console
    return True  # fallback: accept

def upsert_card(card_data):
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  [DRY RUN] no supabase creds")
        return
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/cards",
        data=json.dumps([card_data]).encode(),
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            r.read()
    except Exception as e:
        print(f"  upsert error: {e}")

total_count = 0
ip_counts = {}

for ip_name, queries in SEARCHES.items():
    print(f"\n=== {ip_name} ===")
    ip_counts[ip_name] = 0
    for q in queries:
        print(f"  Searching: {q}")
        products = search_cards(q, limit=20)
        for p in products:
            pid = p.get("id")
            if not pid:
                continue
            # Optionally verify IP
            # if not detect_ip(p, ip_name): continue
            price_data = get_price(pid)
            loose = price_data.get("loose-price")
            market = price_data.get("used-price") or price_data.get("loose-price")
            card_data = {
                "id": str(pid),
                "name": p.get("product-name", ""),
                "set_name": p.get("console-name", ""),
                "rarity": "",
                "image_url": p.get("image", ""),
                "market_price": round(market / 100, 2) if market else None,
                "low_price": None,
                "high_price": None,
                "ip_name": ip_name,
                "loose_price": round(loose / 100, 2) if loose else None,
            }
            upsert_card(card_data)
            ip_counts[ip_name] += 1
            total_count += 1
            time.sleep(0.3)
        time.sleep(0.5)

print(f"\n=== DONE ===")
print(f"Total cards seeded: {total_count}")
for ip, cnt in ip_counts.items():
    print(f"  {ip}: {cnt}")

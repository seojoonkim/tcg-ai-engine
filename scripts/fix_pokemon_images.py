#!/usr/bin/env python3
"""Fix missing Pokemon card images by trying pokemontcg.io URLs."""
import os, json, requests

SUPABASE_URL = "https://vlrygkxgugpeekxikpnq.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscnlna3hndWdwZWVreGlrcG5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQyNjM2NiwiZXhwIjoyMDg4MDAyMzY2fQ.fQeHYYlkGMHMaiBStRKKg_KXZdnxG3BliaOyr3k4DT4"
HEADERS = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}", "Content-Type": "application/json"}

# Common TCGPlayer set_code -> pokemontcg.io set_id mappings
SET_MAP = {
    "swsh1": "swsh1", "swsh2": "swsh2", "swsh3": "swsh3", "swsh4": "swsh4",
    "swsh5": "swsh5", "swsh6": "swsh6", "swsh7": "swsh7", "swsh8": "swsh8",
    "swsh9": "swsh9", "swsh10": "swsh10", "swsh11": "swsh11", "swsh12": "swsh12",
    "sv1": "sv1", "sv2": "sv2", "sv3": "sv3", "sv3pt5": "sv3pt5",
    "sv4": "sv4", "sv4pt5": "sv4pt5", "sv5": "sv5", "sv6": "sv6", "sv7": "sv7",
    "sv8": "sv8", "sv8pt5": "sv8pt5",
    "sm1": "sm1", "sm2": "sm2", "sm3": "sm3", "sm4": "sm4",
    "sm5": "sm5", "sm6": "sm6", "sm7": "sm7", "sm8": "sm8",
    "sm9": "sm9", "sm10": "sm10", "sm11": "sm11", "sm12": "sm12",
    "xy1": "xy1", "xy2": "xy2", "xy3": "xy3", "xy4": "xy4",
    "xy5": "xy5", "xy6": "xy6", "xy7": "xy7", "xy8": "xy8",
    "xy9": "xy9", "xy10": "xy10", "xy11": "xy11", "xy12": "xy12",
}

def fetch_cards_without_images():
    url = f"{SUPABASE_URL}/rest/v1/cards?ip_name=eq.Pokemon&image_url=is.null&select=id,name,set_code,number&limit=500"
    r = requests.get(url, headers=HEADERS)
    return r.json() if r.status_code == 200 else []

def try_image_url(set_id, number):
    for suffix in ["_hires.png", ".png"]:
        url = f"https://images.pokemontcg.io/{set_id}/{number}{suffix}"
        try:
            r = requests.head(url, timeout=5)
            if r.status_code == 200:
                return url
        except:
            pass
    return None

def update_image(card_id, image_url):
    url = f"{SUPABASE_URL}/rest/v1/cards?id=eq.{card_id}"
    r = requests.patch(url, headers={**HEADERS, "Prefer": "return=minimal"}, json={"image_url": image_url})
    return r.status_code < 300

def main():
    cards = fetch_cards_without_images()
    print(f"Found {len(cards)} Pokemon cards without images")
    fixed = 0
    for card in cards:
        sc = (card.get("set_code") or "").lower()
        num = card.get("number") or ""
        set_id = SET_MAP.get(sc, sc)
        if not set_id or not num:
            continue
        img = try_image_url(set_id, num)
        if img:
            if update_image(card["id"], img):
                fixed += 1
                print(f"  ✓ {card['name']} -> {img}")
    print(f"\nFixed {fixed}/{len(cards)} cards")

if __name__ == "__main__":
    main()

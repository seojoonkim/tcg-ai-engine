#!/usr/bin/env python3
"""TCG Price Fetcher - pokemon-tcg.io -> Supabase"""
import os, json, time, logging, requests
from datetime import datetime, timezone

# Load env
def load_env(path):
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip())
    except: pass

load_env(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://vlrygkxgugpeekxikpnq.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'fetch_prices.log')),
    ]
)
log = logging.getLogger(__name__)

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates',
}

TARGET_SETS = [
    'sv1', 'sv2', 'sv3', 'sv3pt5', 'sv4', 'sv4pt5', 'sv5', 'sv6', 'sv6pt5', 'sv7', 'sv8',
    'swsh1', 'swsh2', 'swsh3', 'swsh4', 'swsh5', 'swsh6', 'swsh7', 'swsh9', 'swsh10', 'swsh11', 'swsh12',
    'base1', 'base2', 'gym1', 'gym2', 'neo1', 'neo2',
]

def fetch_cards_for_set(set_id, page=1, page_size=250):
    params = {'q': f'set.id:{set_id}', 'page': page, 'pageSize': page_size}
    try:
        r = requests.get('https://api.pokemontcg.io/v2/cards', params=params, timeout=30)
        r.raise_for_status()
        return r.json().get('data', [])
    except Exception as e:
        log.warning(f"Failed set {set_id} p{page}: {e}")
        return []

def extract_prices(card):
    prices = card.get('tcgplayer', {}).get('prices', {})
    for pt in ['holofoil','reverseHolofoil','normal','1stEditionHolofoil','unlimitedHolofoil','unlimitedNormal','1stEditionNormal']:
        p = prices.get(pt, {})
        if p.get('market'):
            return {'market_price': p.get('market'), 'low_price': p.get('low'), 'mid_price': p.get('mid'), 'high_price': p.get('high')}
    for pt, p in prices.items():
        if p.get('market'):
            return {'market_price': p.get('market'), 'low_price': p.get('low'), 'mid_price': p.get('mid'), 'high_price': p.get('high')}
    return {'market_price': None, 'low_price': None, 'mid_price': None, 'high_price': None}

def process_cards(raw_cards):
    cards_rows, history_rows = [], []
    now = datetime.now(timezone.utc).isoformat()
    for card in raw_cards:
        cid = card.get('id')
        if not cid: continue
        s = card.get('set', {})
        img = card.get('images', {})
        tcg = card.get('tcgplayer', {})
        p = extract_prices(card)
        cards_rows.append({
            'id': cid, 'name': card.get('name',''),
            'set_name': s.get('name',''), 'set_code': s.get('id',''),
            'rarity': card.get('rarity',''),
            'image_url': img.get('large') or img.get('small',''),
            'tcgplayer_url': tcg.get('url',''),
        })
        if p['market_price'] is not None:
            history_rows.append({**p, 'card_id': cid, 'source': 'pokemontcg.io', 'recorded_at': now})
    return cards_rows, history_rows

def upsert_cards(rows):
    if not rows: return 0
    r = requests.post(f'{SUPABASE_URL}/rest/v1/cards', headers=HEADERS, json=rows, timeout=30)
    if r.status_code not in (200,201): log.error(f"cards upsert: {r.status_code} {r.text[:200]}")
    else: return len(rows)
    return 0

def insert_history(rows):
    if not rows: return 0
    h = {**HEADERS, 'Prefer': 'return=minimal'}
    r = requests.post(f'{SUPABASE_URL}/rest/v1/price_history', headers=h, json=rows, timeout=30)
    if r.status_code not in (200,201): log.error(f"history insert: {r.status_code} {r.text[:200]}")
    else: return len(rows)
    return 0

def main():
    log.info("=== TCG Price Fetcher Starting ===")
    total_c, total_h = 0, 0
    all_c, all_h = [], []
    for set_id in TARGET_SETS:
        log.info(f"Fetching {set_id}...")
        page = 1
        while True:
            raw = fetch_cards_for_set(set_id, page=page)
            if not raw: break
            c, h = process_cards(raw)
            all_c.extend(c); all_h.extend(h)
            log.info(f"  {set_id} p{page}: {len(raw)} cards")
            if len(raw) < 250: break
            page += 1
            time.sleep(0.3)
        time.sleep(0.5)
        if len(all_c) >= 500:
            total_c += upsert_cards(all_c)
            total_h += insert_history(all_h)
            log.info(f"Batch upsert: {total_c} cards, {total_h} history")
            all_c, all_h = [], []
    if all_c:
        total_c += upsert_cards(all_c)
        total_h += insert_history(all_h)
    log.info(f"=== Done: {total_c} cards, {total_h} history ===")
    return total_c

if __name__ == '__main__':
    main()

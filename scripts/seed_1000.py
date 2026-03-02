#!/usr/bin/env python3
"""Seed 1000 cards across 5 IPs directly to Supabase (no external API needed)."""
import urllib.request, json, time, random, datetime, uuid

SUPABASE_URL = "https://vlrygkxgugpeekxikpnq.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscnlna3hndWdwZWVreGlrcG5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQyNjM2NiwiZXhwIjoyMDg4MDAyMzY2fQ.fQeHYYlkGMHMaiBStRKKg_KXZdnxG3BliaOyr3k4DT4"

# Card data by IP
IP_DATA = {
    "Magic: The Gathering": {
        "sets": ["Alpha Edition","Beta Edition","Unlimited","Revised","4th Edition","5th Edition","Mirage","Tempest","Urza's Saga","Mercadian Masques","Invasion","Odyssey","Onslaught","Mirrodin","Kamigawa","Ravnica","Time Spiral","Lorwyn","Alara","Zendikar","Scars of Mirrodin","Innistrad","Return to Ravnica","Theros","Khans of Tarkir","Battle for Zendikar","Shadows over Innistrad","Kaladesh","Amonkhet","Ixalan","Dominaria","Guilds of Ravnica","War of the Spark","Throne of Eldraine","Ikoria","Zendikar Rising","Kaldheim","Strixhaven","Midnight Hunt","Kamigawa Neon"],
        "cards": ["Black Lotus","Ancestral Recall","Time Walk","Mox Sapphire","Mox Jet","Mox Pearl","Mox Ruby","Mox Emerald","Timetwister","Library of Alexandria","Mana Drain","Force of Will","Jace the Mind Sculptor","Liliana of the Veil","Tarmogoyf","Dark Confidant","Snapcaster Mage","Uro Titan of Nature's Wrath","Oko Thief of Crowns","Emrakul the Aeons Torn","Thoughtseize","Lightning Bolt","Counterspell","Swords to Plowshares","Path to Exile","Birds of Paradise","Sol Ring","Vampiric Tutor","Demonic Tutor","Brainstorm","Fetchland Polluted Delta","Fetchland Scalding Tarn","Fetchland Misty Rainforest","Fetchland Verdant Catacombs","Fetchland Arid Mesa","Shockland Steam Vents","Shockland Overgrown Tomb","Shockland Hallowed Fountain","Serra Angel","Wrath of God","Armageddon","Balance","Wheel of Fortune","Regrowth","Channel","Fireball","Fork","Time Vault","Chaos Orb","Berserk","Mana Vault","Recall","Timetwister","Bazaar of Baghdad","Mishra Workshop","Strip Mine","Tolarian Academy","Gaea's Cradle","Tropical Island","Underground Sea","Volcanic Island","Badlands","Savannah","Taiga","Plateau","Scrubland","Tundra","Bayou","Dual Land Tropical","Rishadan Port","Wasteland","Dark Ritual","Necropotence","Yawgmoth's Will","Memory Jar","Tinker","Windfall","Contract from Below","Shahrazad","Falling Star","Flash","Frantic Search","Goblin Recruiter","Gush","Gifts Ungiven","Imperial Seal","Lotus Petal","Mana Crypt","Mind's Desire","Mystical Tutor","Personal Tutor","Ponder","Preordain","Probe","Skullclamp","Sensei's Divining Top","Show and Tell","Survival of the Fittest","Sylvan Library","Transmute Artifact","Yawgmoth's Bargain","Intuition","Time Spiral","Crop Rotation"],
        "rarity_map": {"Mythic Rare": 0.1, "Rare": 0.3, "Uncommon": 0.4, "Common": 0.2}
    },
    "Yu-Gi-Oh": {
        "sets": ["Legend of Blue Eyes","Metal Raiders","Spell Ruler","Pharaoh's Servant","Labyrinth of Nightmare","Legacy of Darkness","Pharaonic Guardian","Magician's Force","Dark Crisis","Invasion of Chaos","Ancient Sanctuary","Soul of the Duelist","Rise of Destiny","Flaming Eternity","The Lost Millennium","Cybernetic Revolution","Elemental Energy","Shadow of Infinity","Enemy of Justice","Power of the Duelist","Cyberdark Impact","Strike of Neos","Force of the Breaker","Tactical Evolution","Gladiator's Assault","Phantom Darkness","Light of Destruction","The Duelist Genesis","Crossroads of Chaos","Crimson Crisis","Raging Battle","Ancient Prophecy","Stardust Overdrive","Absolute Powerforce","The Shining Darkness","Duelist Revolution","Starstrike Blast","Storm of Ragnarok","Extreme Victory","Generation Force","Photon Shockwave","Order of Chaos","Galactic Overlord","Return of the Duelist","Abyss Rising","Cosmo Blazer","Lord of the Tachyon Galaxy","Judgment of the Light"],
        "cards": ["Blue-Eyes White Dragon","Dark Magician","Exodia the Forbidden One","Red-Eyes Black Dragon","Summoned Skull","Dark Hole","Monster Reborn","Raigeki","Pot of Greed","Mirror Force","Swords of Revealing Light","Change of Heart","Graceful Charity","Delinquent Duo","The Forceful Sentry","Confiscation","Painful Choice","Harpie's Feather Duster","Heavy Storm","Premature Burial","Call of the Haunted","Torrential Tribute","Ring of Destruction","Imperial Order","Magic Cylinder","Solemn Judgment","Ultimate Offering","Witch of the Black Forest","Sangan","Man-Eater Bug","Jinzo","Breaker the Magical Warrior","Breaker the Warrior","Gemini Elf","Reflect Bounder","Cyber Dragon","Elemental HERO Neos","Elemental HERO Flame Wingman","Stardust Dragon","Black Rose Dragon","Red Dragon Archfiend","Ancient Fairy Dragon","Blackwing Armor Master","Trishula Dragon of the Ice Barrier","Shooting Star Dragon","T.G. Hyper Librarian","Xyz Dragon","Number 39 Utopia","Leviair the Sea Dragon","Wind-Up Zenmaines","Evolzar Laggia","Evolzar Dolkka","Maestroke the Symphony Djinn","Shock Master","Number 11 Big Eye","Mermail Abyssgaios","Evilswarm Ophion","Number 101 Silent Honor ARK","Bujintei Susanowo","Mecha Phantom Beast Dracossack","Brotherhood of the Fire Fist Tiger King","Fire Fist Bear","Fire Fist Dragon","Bujin Yamato","Bujin Mikazuchi","Karakuri Shogun mdl 00 Burei","Lavalval Chain","Photon Papilloperative","Constellar Ptolemy M7","Inzektor Dragonfly","Inzektor Hornet","Inzektor Centipede","Wind-Up Shark","Wind-Up Hunter","Spellbook Magician of Prophecy","High Priestess of Prophecy","Spellbook of Judgment","Prophecy Destroyer","Reaper of Prophecy","Brotherhood of Fire Fist Rooster","M-X-Saber Invoker","Rescue Rabbit","Tour Guide from the Underworld","Sangan Classic","Nekroz of Unicore","Nekroz of Trishula","El Shaddoll Construct","Shaddoll Dragon","Shaddoll Squamata","Satellarknight Delteros","Satellarknight Unukalhai","Burning Abyss Dante","Burning Abyss Virgil","Qliphort Scout","Qliphort Towers","Qliphort Stealth","Majespecter Unicorn Kirin","Kozmo Dark Destroyer","Kozmo Forerunner"],
        "rarity_map": {"Ultra Rare": 0.1, "Super Rare": 0.2, "Rare": 0.3, "Common": 0.4}
    },
    "One Piece": {
        "sets": ["Romance Dawn","Paramount War","Pillars of Strength","Kingdoms of Intrigue","Awakening of the New Era","Wings of the Captain","500 Years in the Future","Two Legends","Emperors in the New World","Royal Blood"],
        "cards": ["Monkey D. Luffy","Roronoa Zoro","Nami","Usopp","Sanji","Tony Tony Chopper","Nico Robin","Franky","Brook","Jinbe","Trafalgar D. Water Law","Eustass Kid","Portgas D. Ace","Sabo","Monkey D. Dragon","Monkey D. Garp","Whitebeard Edward Newgate","Gol D. Roger","Shanks","Kaido","Big Mom Charlotte Linlin","Blackbeard Marshall D. Teach","Doflamingo Donquixote","Crocodile","Boa Hancock","Yamato","Kozuki Oden","Kozuki Momonosuke","Kozuki Hiyori","Marco the Phoenix","Vista","Jozu","Curiel","Speed Jiru","Blenheim","Atmos","Fossa","Izou","Haruta","Izo","Thatch","Rakuyo","Whitey Bay","Little Oars Jr.","Crocodile Baroque","Gecko Moria","Doflamingo Baroque","Kuma Bartholomew","Jinbe Baroque","Boa Hancock Warlord","Mihawk Dracule","Teach Marshall Warlord","Weevil Edward","Golden Lion Shiki","Rocks D. Xebec","Vegapunk","Kizaru Borsalino","Akainu Sakazuki","Aokiji Kuzan","Sengoku","Garp Instructor","Coby","Helmeppo","Smoker","Tashigi","Fujitora Issho","Ryokugyu","Momonga","Doberman","Onigumo","Tsuru","Sengoku Buddha","Whitebeard Second Division","Fire Fist Ace Attack","Gomu Gomu no Bazooka","Santoryu Oni Giri","Clima Tact Thunderbolt","Diable Jambe","Cherry Blossom","Rumble Ball","Coup de Burst","Franky Shogun","Soul King Brook","Going Merry","Thousand Sunny","Moby Dick","Red Force","Oro Jackson","Polar Tang","Big Mom Pirate","Beast Pirate","Straw Hat Grand Fleet","Worst Generation","Seven Warlords","Marine Admiral","Yonko Emperor","Revolutionary Army","Celestial Dragon","Fishman Island","Wano Country","Dressrosa","Whole Cake Island","Punk Hazard","Marineford","Enies Lobby","Water 7","Skypiea","Alabasta","Drum Island","Loguetown"],
        "rarity_map": {"Secret Rare": 0.05, "Super Rare": 0.15, "Rare": 0.35, "Common": 0.45}
    },
    "Lorcana": {
        "sets": ["The First Chapter","Rise of the Floodborn","Into the Inklands","Ursula's Return","Shimmering Skies","Azurite Sea","Archazia's Island"],
        "cards": ["Elsa Queen of Arendelle","Elsa Snow Queen","Elsa Spirits of Ice","Mickey Mouse Brave Little Tailor","Mickey Mouse Detective","Mickey Mouse True Friend","Moana Of Motunui","Moana Daughter of the Chief","Simba Future King","Simba King of Pride Rock","Stitch Carefree Surfer","Stitch Rock Star","Maleficent Monstrous Dragon","Maleficent Sinister Visitor","Ariel On Human Legs","Ariel Spectacular Singer","Cinderella Stouthearted","Cinderella Gentle and Kind","Belle Strange But Special","Belle Expert on Biscuits","Ursula Deceiver of All","Ursula Sea Witch","Hades King of Olympus","Hades Lord of the Dead","Rapunzel Gifted with Healing","Rapunzel Letting Down Her Hair","Woody Sheriff of Sunnyside","Woody Enlightened Explorer","Buzz Lightyear Galactic Ranger","Buzz Lightyear Space Ranger","Aurora Resting Peacefully","Aurora Dreaming Guardian","Gaston Scheming","Gaston Arrogant Hunter","Merlin Shapeshifter","Merlin Self-Appointed Mentor","Tinker Bell Giant Fairy","Tinker Bell Tiny Tactician","Peter Pan Never Landing","Peter Pan Fearless Fighter","Captain Hook Forceful Duelist","Captain Hook Captain of the Jolly Roger","Cruella De Vil Miserable as Usual","Cruella De Vil Fashionable Force","Evil Queen Commanding Presence","Evil Queen Wicked and Vain","Jafar Striking Illusionist","Jafar Keeper of Secrets","Aladdin Heroic Outlaw","Aladdin Street Rat","Jasmine Disguised","Jasmine Queen of Agrabah","Genie On the Job","Genie Powers Unleashed","Pinocchio Talkative Puppet","Pinocchio Star Wisher","Jiminy Cricket Pinocchio's Conscience","Dumbo Flying Elephant","Dumbo Soaring Above","Bambi Young Prince","Bambi Adored One","Thumper Noisy Friend","Flower Shy Little Skunk","Tigger Wonderful Thing","Pooh Friendly Bear","Eeyore Overstuffed Animal","Roo Small Roo","Kanga Very Proper Mama","Piglet Pooh's Best Friend","Minnie Mouse Beloved Princess","Minnie Mouse Stylish Surfer","Donald Duck Musketeer","Donald Duck Boisterous Fowl","Pluto Loyal Companion","Goofy Knight for a Day","Chip Resourceful Rescue Ranger","Dale Chip's Pal","Scrooge McDuck Richest Duck","Launchpad McQuack Daring Pilot","Darkwing Duck Terror That Flaps","Lilo Making a Wish","Nani Protective Sister","Pleakley Earth Expert","Jumba Mad Scientist","Grandmother Fa Family Matriarch","Mushu Little Dragon","Mulan Imperial Soldier","Shang Leader of the Troops","Yao Loose Cannon","Ling Falling in Love","Chien-Po Calm and Patient","Tiana Almost There","Tiana Restaurant Chef","Charlotte La Bouff Fairytale Fan","Louis Entertaining the Folks","Naveen Penniless Royal"],
        "rarity_map": {"Enchanted": 0.02, "Legendary": 0.08, "Super Rare": 0.2, "Rare": 0.3, "Uncommon": 0.25, "Common": 0.15}
    }
}

def gen_history(current_price, card_id, days=90):
    rows = []
    now = datetime.datetime.now(datetime.UTC)
    price = current_price * 0.85
    for i in range(days, 0, -1):
        volatility = 0.005 if current_price > 100 else 0.02
        change = random.gauss(0.001, volatility)
        price = max(price * (1 + change), 0.01)
        dt = (now - datetime.timedelta(days=i)).isoformat()
        rows.append({"card_id": card_id, "market_price": round(price, 2), "low_price": round(price*0.9, 2), "mid_price": round(price*0.95, 2), "high_price": round(price*1.1, 2), "source": "generated", "recorded_at": dt})
    rows.append({"card_id": card_id, "market_price": round(current_price, 2), "low_price": round(current_price*0.9, 2), "mid_price": round(current_price*0.95, 2), "high_price": round(current_price*1.1, 2), "source": "generated", "recorded_at": now.isoformat()})
    return rows

def supabase_upsert(table, rows):
    data = json.dumps(rows).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}",
        data=data,
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
                 "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except Exception as e:
        print(f"  UPSERT ERR {table}: {e}")
        return 500

# Price tiers by rarity
PRICE_MAP = {
    "Mythic Rare": (50, 5000), "Ultra Rare": (30, 3000), "Enchanted": (100, 10000),
    "Legendary": (20, 2000), "Secret Rare": (20, 1500), "Super Rare": (5, 200),
    "Rare": (1, 50), "Uncommon": (0.5, 10), "Common": (0.1, 3), "Default": (1, 30)
}

total = 0
ip_counts = {}

for ip_name, data in IP_DATA.items():
    ip_counts[ip_name] = 0
    sets = data["sets"]
    cards = data["cards"]
    rarity_map = data["rarity_map"]
    rarities = list(rarity_map.keys())
    weights = list(rarity_map.values())
    
    print(f"\n=== {ip_name} ({len(cards)} base cards, {len(sets)} sets) ===")
    
    idx = 0
    while ip_counts[ip_name] < 200 and total < 1000:
        card_name = cards[idx % len(cards)]
        set_name = sets[idx % len(sets)]
        # make unique by appending set index
        suffix = f" ({set_name[:15]})" if idx >= len(cards) else ""
        full_name = card_name + suffix
        
        rarity = random.choices(rarities, weights=weights)[0]
        price_range = PRICE_MAP.get(rarity, PRICE_MAP["Default"])
        price = round(random.uniform(*price_range), 2)
        
        card_id = f"gen-{ip_name[:3].lower()}-{idx:05d}"
        set_code = set_name[:10].upper().replace(" ", "").replace("'", "")
        
        card = {
            "id": card_id,
            "name": full_name,
            "set_name": set_name,
            "set_code": set_code,
            "rarity": rarity,
            "image_url": None,
            "tcgplayer_url": None,
            "ip_name": ip_name,
            "loose_price": price
        }
        
        status = supabase_upsert("cards", [card])
        if status in (200, 201):
            hist = gen_history(price, card_id)
            # batch insert history
            for batch_start in range(0, len(hist), 50):
                supabase_upsert("price_history", hist[batch_start:batch_start+50])
            
            total += 1
            ip_counts[ip_name] += 1
            if total % 20 == 0:
                print(f"  [{total}] {full_name[:50]} - {rarity} ${price:.2f}")
        
        idx += 1
        if total >= 1000:
            break

print(f"\nDone. Total: {total}")
print("IP breakdown:", ip_counts)

import os



RACE_CONFIG = None

REWARD_DISTRIBUTION = None

HORSE_FEED_PRICE = None
HORSE_REST_PRICE = None
HORSE_TRAIN_PRICE = None

TRAIN_SUCCESS_CHANCE = None
TRAIN_DETERMINATION_INCREASE = None

HORSE_ATTRIBUTES = None

OPTIMAL_STATS = None

RACE_LOGIC = None

GOODLUCK_CONFIG = None

SCHEDULER_CONFIG = None

HORSE_NAMES=["Midnight Comet","Silver Whisper","Thunder Chase","Blue Horizon","Wild Ember","Storm Dancer","Golden Feather","Mystic River","Iron Blaze","Shadow Spark","Whisper Wind","Crimson Rider","Silent Arrow","Star Chaser","Moonfire","Black Diamond","Frost Runner","Ocean Dream","Dusty Cloud","Dark Horizon","Silver Storm","Ember Knight","Wild Spirit","Ghost Runner","Sky Breaker","Lightning Step","Desert Mirage","Silver Bullet","Winter Flame","Shining Star","Thunder Bolt","Silver Stream","Night Echo","Storm Hunter","Golden Crown","Whisper Song","Iron Runner","Blue Phantom","Storm Surge","Shadow Blade","Nightfire","Ocean Mist","Dust Devil","Dark Moon","Silver Arrow","Ember Glow","Wild Flame","Ghost Rider","Sky Storm","Lightning Shadow","Desert Wind","Silver Spirit","Winter Ghost","Shining Flame","Thunder Strike","Silver Dust","Night Runner","Storm Rider","Golden Star","Whisper Ghost","Iron Star","Blue Thunder","Storm Echo","Shadow Flame","Night Whisper","Ocean Pearl","Dust Storm","Dark River","Silver Moon","Ember Star","Wild Thunder","Ghost Star","Sky Comet","Lightning Runner","Desert Flame","Silver Wing","Winter Wind","Shining Comet","Thunder Wing","Silver Rain","Night Storm","Storm Whisper","Golden Fire","Whisper Sky","Iron Comet","Blue Moon","Storm Spirit","Shadow Storm","Night Crown","Ocean Rain","Dust Rider","Dark Ember","Silver Sky","Ember Moon","Wild Echo","Ghost Comet","Sky Rider","Lightning Strike","Desert Storm","Silver Flame","Midnight Glory","Silent River","Sun Catcher","Lunar Spark","River Echo","Bright Horizon","Royal Feather","Swift Ember","Golden Mist","Thunder Song","Blue Falcon","Silver Shine","Mystic Arrow","Dark Rider","Whisper Cloud","Ember Wave","Shining Ember","Ice Storm","Velvet Moon","Golden Mirage","Thunder Dust","Ocean Glow","Silver Star","Lightning Wing","Shadow Runner","Silent Blaze","Winter Comet","Desert Whisper","Thunder River","Silver Comet","Wild Arrow","Whisper Flame","Ember Arrow","Sky Flame","Lightning Storm","Golden Wind","Storm Crown","Black Comet","Frost Whisper","Desert Moon","Storm Blaze","Iron Whisper","Silver Ember","Shining River","Golden Ember","Thunder Ember","Sky Thunder","Ocean Thunder","River Ghost","Moon Whisper","Crimson Sky","Twilight Star","Solar Arrow","Emerald River","Silent Storm","Fire Whisper","Iron Flame","Silver Wind","Ghost Whisper","Thunder Whisper","Ocean Arrow","Blue Wind","Golden Flame","Desert Comet","Lightning Ember","Whisper Ember","Shining Sky","Thunder Cloud","Silver Echo","Mystic Star","Wild Whisper","River Star","Ember Whisper","Black Shadow","Storm Flame","Moon Dancer","Winter Rain","Crystal Storm","Silver Runner","Golden Arrow","Thunder Rain","Wild Comet","Blue Flame","Silent Comet","Ocean Spark","Night Spark","River Whisper","Ember Echo","Lightning River","Desert Ember","Golden River","Mystic Moon","Thunder Blade","Whisper Rider","Golden Wave","Thunder Arrow","Blue Comet","Silver River","Sky Ember","Lightning Whisper","Shadow Ember","Night River","Ember Storm","Wild Rain","Thunder Wind","Silver Blaze","Winter Frost","Golden Rider","Whisper Arrow","Storm Runner","Lightning Dancer","Blue Shadow","Golden Dancer","Mystic Comet","Thunder Star","Whisper Moon","Ocean Star","Ember Rain","Desert Echo","Shadow Rider","Winter Arrow","Storm Ghost","Lightning Crown","Golden Thunder","Blue Arrow","Silver Cloud","Ocean Crown","Ember Wind","Night Star","Thunder Echo","Whisper Rain","Mystic Echo","Shadow Star","Thunder Moon","Ember Rider","Golden Storm","Blue Ember","Lightning Sky","Desert Rain","Ocean Flame","Frost Rider","Iron Thunder","Shadow Comet","Whisper Star","Silver Rider","Ember Comet","Sky Whisper","Lightning Blaze","Golden Runner","Thunder Spirit","Blue Rider","Desert Arrow","Ocean Ember","Ember Sky","Storm Breeze","Golden Whisper","Mystic Whisper","Shadow Whisper","Thunder Rider","Wild Storm","Ocean Whisper","Ember Crown","Storm Crown","Lightning Cloud","Golden Breeze","Mystic Rain","Shadow Crown","Thunder Flame","Silver Horizon","Firestorm Echo","Dusk Ember","Iron River","Arctic Whisper","Royal Mirage","Cloud Dancer","Shadow Frost","Whisper Windstorm","Phoenix Rider","Sunflare Comet","Ember Mirage","Mystic Tide","Silver Phantom","Thunder Mirage","Blue Blizzard","Golden Tempest","Storm Mirage","Crystal Arrow","Twilight Whisper","Shadow Emberwind","Whisper Emberfall","Winter Blossom","Lightning Frost","Iron Hurricane","Wild Tempest","Thunder Bloom","Ocean Whisperer","Emberlight","Starlit Thunder","Stormlight Echo","Midnight Tempest"];

BOT_CONFIG = {
    "enabled": True,
    "bots": [
        {
            "wallet_address": os.getenv("BOT_WALLET_1"),
            "is_bot": True,
        },
        {
            "wallet_address": os.getenv("BOT_WALLET_2"),
            "is_bot": True,
        },
        {
            "wallet_address": os.getenv("BOT_WALLET_3"),
            "is_bot": True,
        },
        {
            "wallet_address": os.getenv("BOT_WALLET_4"),
            "is_bot": True,
        },
        {
            "wallet_address": os.getenv("BOT_WALLET_5"),
            "is_bot": True,
        },
        {
            "wallet_address": os.getenv("BOT_WALLET_6"),
            "is_bot": True,
        }
    ],
    "race_levels": {
        1: {
            "enabled": True,
            "time_remaining_seconds": 55,
            "min_registered_horses": 8,
            "registration_interval_seconds": 5,
            "max_bots_per_race": 4
        },
        2: {
            "enabled": False,
            "time_remaining_seconds": 62,
            "min_registered_horses": 8,
            "registration_interval_seconds": 5,
            "max_bots_per_race": 6
        },
        3: {
            "enabled": False,
            "time_remaining_seconds": 58,
            "min_registered_horses": 8,
            "registration_interval_seconds": 5,
            "max_bots_per_race": 6
        }
    },
    "race_levels_1v1": {
        1: {
            "enabled": False,
            "time_remaining_seconds": 55,
            "min_registered_horses": 2,
            "registration_interval_seconds": 3,
            "max_bots_per_race": 1
        },
        2: {
            "enabled": False,
            "time_remaining_seconds": 62,
            "min_registered_horses": 2,
            "registration_interval_seconds": 3,
            "max_bots_per_race": 1
        },
        3: {
            "enabled": False,
            "time_remaining_seconds": 58,
            "min_registered_horses": 2,
            "registration_interval_seconds": 3,
            "max_bots_per_race": 1
        }
    },
    "anti_detection": {
        "randomize_join_timing": True,
        "timing_variance_seconds": 1,
        "use_random_horse": True,  # Use random horse from bot's collection
        "skip_race_chance": 25
    },
    "startup": {
        "create_bot_accounts": True,
        "horses_per_bot": 4,
        "horse_levels": [1,1,1,1]
    }
}

TREASURY_PROTECTION_CONFIG = {
    "enabled": True,
    1: {
        "bot_speed_boost_min_seconds": 3,
        "bot_speed_boost_max_seconds": 5,
    },
    2: {
        "bot_speed_boost_min_seconds": 2,
        "bot_speed_boost_max_seconds": 4,
    },
    3: {
        "bot_speed_boost_min_seconds": 1,
        "bot_speed_boost_max_seconds": 3,
    },
}
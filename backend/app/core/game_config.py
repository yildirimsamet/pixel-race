
import json
from pathlib import Path
from typing import Dict, Any, TypedDict, cast

class RaceLogicConfig(TypedDict):
    segment_speed_variation: Dict[str, float]
    high_determination_threshold: int
    high_determination_boost_segment: int
    old_age_threshold: int
    old_age_energy_segment: int
    young_age_threshold: int
    young_age_boost_start_segment: int
    young_age_boost_end_segment: int
    heavy_weight_threshold: int
    uphill_start_segment: int
    uphill_end_segment: int

class AttributeRange(TypedDict):
    min: int
    max: int

class OptimalStatConfig(TypedDict):
    value: int
    max_penalty_ms: int

class RewardDistribution(TypedDict):
    first: float
    second: float
    third: float

class RaceLevelConfig(TypedDict):
    entry_fee: float
    max_horses: int
    min_horses: int
    base_time_ms: int

class HorseCareConfig(TypedDict):
    feed: float
    rest: float
    train: float

class HorsePurchaseConfig(TypedDict):
    level_1: float
    level_2: float
    level_3: float

class RaceEntryConfig(TypedDict):
    level_1: float
    level_2: float
    level_3: float

class PricingConfig(TypedDict):
    horse_purchase: HorsePurchaseConfig
    goodluck_token: float
    race_entry: RaceEntryConfig
    horse_care: HorseCareConfig

class RaceConfig(TypedDict):
    min_horses: Dict[str, int]
    max_horses: Dict[str, int]
    base_time_ms: Dict[str, int]
    reward_distribution: RewardDistribution
    num_segments: int
    create_interval_minutes: int
    start_delay_minutes: int

class TrainingConfig(TypedDict):
    success_chance: float
    determination_increase: int

class GoodluckTokenConfig(TypedDict):
    max_purchase_quantity: int
    race_boost_description: str

class SchedulerConfig(TypedDict):
    stuck_race_timeout_minutes: int
    max_kept_old_races: int

class GameConfig(TypedDict):
    pricing: PricingConfig
    race: RaceConfig
    horse_attributes: Dict[str, AttributeRange]
    optimal_stats: Dict[str, OptimalStatConfig]
    race_logic: RaceLogicConfig
    training: TrainingConfig
    goodluck_token: GoodluckTokenConfig
    scheduler: SchedulerConfig

_config: GameConfig = None

def load_game_config() -> GameConfig:

    global _config

    if _config is not None:
        return _config

    possible_paths = [
        Path(__file__).parent.parent.parent / "common" / "game-config.json",
        Path("/app/game-config.json"),
        Path("./game-config.json"),
    ]

    config_path = None
    for path in possible_paths:
        if path.exists():
            config_path = path
            break

    if config_path is None:
        raise RuntimeError(
            f"game-config.json not found. Searched paths: {[str(p) for p in possible_paths]}. "
            "Ensure the file exists in the project root."
        )

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            raw_config = json.load(f)

        _config = cast(GameConfig, raw_config)
        return _config

    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid JSON in game-config.json: {e}")
    except Exception as e:
        raise RuntimeError(f"Failed to load game-config.json from {config_path}: {e}")

def get_game_config() -> GameConfig:

    if _config is None:
        return load_game_config()
    return _config

def get_horse_price(level: int) -> float:

    config = get_game_config()
    prices = config["pricing"]["horse_purchase"]

    if level == 1:
        return prices["level_1"]
    elif level == 2:
        return prices["level_2"]
    elif level == 3:
        return prices["level_3"]
    else:
        raise ValueError(f"Invalid horse level: {level}. Must be 1, 2, or 3.")

def get_goodluck_price() -> float:

    config = get_game_config()
    return config["pricing"]["goodluck_token"]

def get_race_config(level: int, is_1v1: bool = False) -> RaceLevelConfig:

    config = get_game_config()
    race_cfg = config["race"]

    level_str = f"level_{level}" if not is_1v1 else f"level_{level}_1v1"

    return {
        "entry_fee": config["pricing"]["race_entry"][f"level_{level}"],
        "max_horses": race_cfg["max_horses"][level_str],
        "min_horses": race_cfg["min_horses"][level_str],
        "base_time_ms": race_cfg["base_time_ms"][f"level_{level}"],
    }

def get_race_reward_distribution(is_1v1: bool = False) -> Dict[int, float]:

    config = get_game_config()
    if is_1v1:
        dist = config["race"]["reward_distribution_1v1"]
        return {
            1: dist["first"],
            2: dist["second"],
        }
    else:
        dist = config["race"]["reward_distribution"]
        return {
            1: dist["first"],
            2: dist["second"],
            3: dist["third"],
        }

def get_horse_care_prices() -> HorseCareConfig:

    config = get_game_config()
    return config["pricing"]["horse_care"]

def get_horse_attributes() -> Dict[str, AttributeRange]:

    config = get_game_config()
    return config["horse_attributes"]

def get_optimal_stats() -> Dict[str, OptimalStatConfig]:

    config = get_game_config()
    return config["optimal_stats"]

def get_race_logic() -> RaceLogicConfig:

    config = get_game_config()
    return config["race_logic"]

def get_training_config() -> TrainingConfig:

    config = get_game_config()
    return config["training"]

def get_goodluck_config() -> GoodluckTokenConfig:

    config = get_game_config()
    return config["goodluck_token"]

def get_scheduler_config() -> SchedulerConfig:

    config = get_game_config()
    return config["scheduler"]

def get_race_create_interval() -> int:

    config = get_game_config()
    return config["race"]["create_interval_minutes"]

def get_race_start_delay() -> int:

    config = get_game_config()
    return config["race"]["start_delay_minutes"]

def get_num_segments() -> int:

    config = get_game_config()
    return config["race"]["num_segments"]
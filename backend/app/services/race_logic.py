
import random
from typing import Any, Dict, List

from app.core import game_config
from app.core.game_mechanics import calculate_performance_modifier


def _calculate_optimal_penalty(value: float, stat_name: str) -> float:
    optimal_stats = game_config.get_optimal_stats()
    horse_attributes = game_config.get_horse_attributes()

    optimal_config = optimal_stats[stat_name]
    attr_config = horse_attributes[stat_name]

    optimal_value = optimal_config["value"]
    max_penalty = optimal_config["max_penalty_ms"]
    min_value = attr_config["min"]
    max_value = attr_config["max"]


    distance = abs(value - optimal_value)

    if value < optimal_value:
        max_distance = optimal_value - min_value
    else:
        max_distance = max_value - optimal_value

    if max_distance == 0:
        return 0.0 if distance == 0 else max_penalty

    penalty = (distance / max_distance) * max_penalty

    return penalty


def calculate_base_race_time(horse: "Horse", tier: int = 1, goodluck_used: bool = False, bot_speed_boost_seconds: float = 0) -> int:
    if not horse.stats:
        raise ValueError(f"Horse {horse.id} has no stats initialized")

    race_cfg = game_config.get_race_config(tier)
    base_time = race_cfg["base_time_ms"]

    age_penalty = _calculate_optimal_penalty(horse.age, "age")
    weight_penalty = _calculate_optimal_penalty(horse.stats.weight, "weight")
    satiety_penalty = _calculate_optimal_penalty(horse.stats.satiety, "satiety")
    determination_penalty = _calculate_optimal_penalty(horse.stats.determination, "determination")
    bond_penalty = _calculate_optimal_penalty(horse.stats.bond, "bond")
    fame_penalty = _calculate_optimal_penalty(horse.stats.fame, "fame")
    instinct_penalty = _calculate_optimal_penalty(horse.stats.instinct, "instinct")

    total_time = (
        base_time +
        age_penalty +
        weight_penalty +
        satiety_penalty +
        determination_penalty +
        bond_penalty +
        fame_penalty +
        instinct_penalty
    )

    if goodluck_used:
        randomization_factor = random.uniform(0.95, 1.00)
        from app.core.logging_config import get_logger
        logger = get_logger(__name__)
        logger.debug(f"GoodLuck used, randomization factor: {randomization_factor}")
    else:
        randomization_factor = random.uniform(0.95, 1.05)
        from app.core.logging_config import get_logger
        logger = get_logger(__name__)
        logger.debug(f"Normal randomization factor: {randomization_factor}")

    final_time = int(total_time * randomization_factor)

    if bot_speed_boost_seconds > 0:
        bot_boost_ms = int(bot_speed_boost_seconds * 1000)
        final_time = max(final_time - bot_boost_ms, int(final_time * 0.5))  # Don't reduce more than 50%
        logger.debug(f"Bot speed boost applied: -{bot_speed_boost_seconds}s (-{bot_boost_ms}ms)")

    return final_time


def calculate_horse_segments(horse: "Horse", tier: int = 1, goodluck_used: bool = False, bot_speed_boost_seconds: float = 0) -> List[Dict[str, int]]:

    total_race_time = calculate_base_race_time(horse, tier, goodluck_used, bot_speed_boost_seconds)

    race_logic = game_config.get_race_logic()
    num_segments = game_config.get_num_segments()

    speed_factors = []
    for i in range(num_segments):
        segment_num = i + 1

        speed_factor = random.uniform(
            race_logic["segment_speed_variation"]["min"],
            race_logic["segment_speed_variation"]["max"]
        )

        if (segment_num > race_logic["high_determination_boost_segment"] and
            horse.stats.determination > race_logic["high_determination_threshold"]):
            boost = 1.0 + ((horse.stats.determination - race_logic["high_determination_threshold"]) / 100)
            speed_factor *= (1.0 / boost)

        if (segment_num > race_logic["old_age_energy_segment"] and
            horse.age > race_logic["old_age_threshold"]):
            energy = 1.0 + ((horse.age - race_logic["old_age_threshold"]) / 20)
            speed_factor *= energy

        if (race_logic["young_age_boost_start_segment"] <= segment_num <= race_logic["young_age_boost_end_segment"] and
            horse.age < race_logic["young_age_threshold"]):
            youth_boost = 1.0 - ((race_logic["young_age_threshold"] - horse.age) / 20)
            speed_factor *= youth_boost

        if (race_logic["uphill_start_segment"] <= segment_num <= race_logic["uphill_end_segment"] and
            horse.stats.weight > race_logic["heavy_weight_threshold"]):
            weight_penalty = 1.0 + ((horse.stats.weight - race_logic["heavy_weight_threshold"]) / 1000)
            speed_factor *= weight_penalty

        speed_factors.append(speed_factor)

    factor_sum = sum(speed_factors)
    normalized_factors = [f * num_segments / factor_sum for f in speed_factors]

    base_segment_time = total_race_time / num_segments
    segments = []

    for i in range(num_segments):
        segment_num = i + 1
        checkpoint_percent = segment_num * (100 // num_segments)
        segment_time = int(base_segment_time * normalized_factors[i])

        segments.append({
            "checkpoint": checkpoint_percent,
            "time": segment_time
        })

    return segments


def calculate_horse_finish_time(horse: "Horse") -> int:
    segments = calculate_horse_segments(horse)
    total_time = sum(seg["time"] for seg in segments)
    return total_time


def calculate_rewards(race: "Race", race_results: List[Any]) -> Dict[int, float]:

    from app.core.logging_config import get_logger
    logger = get_logger(__name__)

    total_pool = race.prize_pool_sol

    if total_pool <= 0:
        logger.warning(f"Race {race.id} has zero prize pool, no rewards to distribute")
        return {}

    is_1v1 = race.max_horses == 2
    reward_distribution = game_config.get_race_reward_distribution(is_1v1=is_1v1)
    rewards = {}
    for position, percentage in reward_distribution.items():
        if len(race_results) >= position:
            rewards[position] = total_pool * percentage

    return rewards
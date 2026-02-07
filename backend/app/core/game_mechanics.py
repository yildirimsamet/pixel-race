
from app.models.horse_stats import HorseStats


def calculate_performance_modifier(stats: HorseStats) -> float:

    weight_penalty = max(0, (stats.weight - 300) / 700) * 0.15

    satiety_penalty = (stats.satiety / 100) * 0.15

    total_penalty = weight_penalty + satiety_penalty
    modifier = max(0.7, 1.0 - total_penalty)

    return modifier


def _calculate_optimal_distance_score(value: float, optimal: float, min_val: float, max_val: float) -> float:

    distance = abs(value - optimal)

    if value < optimal:
        max_distance = optimal - min_val
    else:
        max_distance = max_val - optimal

    if max_distance == 0:
        return 25.0 if distance == 0 else 0.0

    score = 25.0 * (1 - (distance / max_distance))

    return max(0.0, min(25.0, score))


def calculate_speed_score(stats: HorseStats, age: int) -> float:

    from app.core import game_config

    optimal_stats = game_config.get_optimal_stats()
    age_optimal = optimal_stats["age"]["value"]
    weight_optimal = optimal_stats["weight"]["value"]
    satiety_optimal = optimal_stats["satiety"]["value"]
    determination_optimal = optimal_stats["determination"]["value"]
    bond_optimal = optimal_stats["bond"]["value"]
    fame_optimal = optimal_stats["fame"]["value"]
    instinct_optimal = optimal_stats["instinct"]["value"]

    AGE_MIN, AGE_MAX = 1, 10
    WEIGHT_MIN, WEIGHT_MAX = 300, 1000
    SATIETY_MIN, SATIETY_MAX = 0, 100
    DETERMINATION_MIN, DETERMINATION_MAX = 0, 100
    BOND_MIN, BOND_MAX = 0, 100
    FAME_MIN, FAME_MAX = 0, 100
    INSTINCT_MIN, INSTINCT_MAX = 0, 100

    points_per_stat = 100.0 / 7

    age_score = _calculate_optimal_distance_score(age, age_optimal, AGE_MIN, AGE_MAX)
    weight_score = _calculate_optimal_distance_score(stats.weight, weight_optimal, WEIGHT_MIN, WEIGHT_MAX)
    satiety_score = _calculate_optimal_distance_score(stats.satiety, satiety_optimal, SATIETY_MIN, SATIETY_MAX)
    determination_score = _calculate_optimal_distance_score(stats.determination, determination_optimal, DETERMINATION_MIN, DETERMINATION_MAX)
    bond_score = _calculate_optimal_distance_score(stats.bond, bond_optimal, BOND_MIN, BOND_MAX)
    fame_score = _calculate_optimal_distance_score(stats.fame, fame_optimal, FAME_MIN, FAME_MAX)
    instinct_score = _calculate_optimal_distance_score(stats.instinct, instinct_optimal, INSTINCT_MIN, INSTINCT_MAX)

    normalized_scores = [
        (age_score / 25) * points_per_stat,
        (weight_score / 25) * points_per_stat,
        (satiety_score / 25) * points_per_stat,
        (determination_score / 25) * points_per_stat,
        (bond_score / 25) * points_per_stat,
        (fame_score / 25) * points_per_stat,
        (instinct_score / 25) * points_per_stat,
    ]

    total_score = sum(normalized_scores)

    final_score = max(0.0, min(100.0, total_score))

    return round(final_score, 2)
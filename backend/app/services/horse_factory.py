from dataclasses import dataclass
from datetime import date
from uuid import UUID
import random

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.horse import Horse
from app.models.horse_stats import HorseStats
from app.core.constants import HORSE_NAMES
from app.core import game_config
from app.utils.colors import generate_vibrant_color
from app.core.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class HorseAttributes:
    name: str
    color: str
    age: int
    birthdate: date
    weight: float
    determination: int
    level: int
    instinct: int


class HorseFactory:
    @staticmethod
    def generate_attributes(level: int) -> HorseAttributes:
        name = random.choice(HORSE_NAMES)
        color = generate_vibrant_color()

        horse_attrs = game_config.get_horse_attributes()

        age = random.randint(
            horse_attrs["age"]["min"],
            horse_attrs["age"]["max"]
        )
        current_year = date.today().year
        birth_year = current_year - age
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)
        birthdate = date(birth_year, birth_month, birth_day)

        weight = random.uniform(
            horse_attrs["weight"]["min"],
            horse_attrs["weight"]["max"]
        )
        determination = random.randint(
            horse_attrs["determination"]["min"],
            horse_attrs["determination"]["max"]
        )

        instinct = random.randint(0, 30)

        return HorseAttributes(
            name=name,
            color=color,
            age=age,
            birthdate=birthdate,
            weight=weight,
            determination=determination,
            level=level,
            instinct=instinct
        )

    async def create_horse(
        self,
        db: AsyncSession,
        user_id: UUID,
        level: int,
        auto_commit: bool = False
    ) -> tuple[Horse, HorseStats]:
        attrs = self.generate_attributes(level)

        horse = Horse(
            user_id=user_id,
            name=attrs.name,
            birthdate=attrs.birthdate,
            color=attrs.color
        )
        db.add(horse)
        await db.flush()

        stats = HorseStats(
            horse_id=horse.id,
            weight=int(attrs.weight),
            determination=attrs.determination,
            satiety=100,
            energy=100,
            level=attrs.level,
            bond=0,
            fame=0,
            instinct=attrs.instinct
        )
        db.add(stats)
        await db.flush()

        if auto_commit:
            await db.commit()

        logger.info(
            f"Created horse '{attrs.name}' (Level {attrs.level}) "
            f"for user {user_id}: age={attrs.age}, weight={attrs.weight:.1f}kg, "
            f"determination={attrs.determination}, instinct={attrs.instinct}"
        )

        return horse, stats

from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging_config import get_logger
from app.models.horse import Horse
from app.models.race import RaceResult
from app.repositories.base import BaseRepository

logger = get_logger(__name__)


class HorseRepository(BaseRepository[Horse]):


    def __init__(self, db: AsyncSession):

        super().__init__(Horse, db)

    async def get_by_id(self, id: UUID) -> Optional[Horse]:

        result = await self.db.execute(
            select(Horse)
            .where(Horse.id == id)
            .options(selectinload(Horse.stats))
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: UUID) -> List[Horse]:

        result = await self.db.execute(
            select(Horse)
            .where(Horse.user_id == user_id)
            .options(selectinload(Horse.stats))
        )
        return list(result.scalars().all())

    async def get_by_user_and_horse_id(
        self, user_id: UUID, horse_id: UUID
    ) -> Optional[Horse]:

        result = await self.db.execute(
            select(Horse).where(Horse.id == horse_id, Horse.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_available_for_race(self, limit: int) -> List[Horse]:

        result = await self.db.execute(
            select(Horse)
            .where(Horse.in_race == False)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_in_race(self, horse_id: UUID, in_race: bool = True) -> None:

        horse = await self.get_by_id(horse_id)
        if horse:
            horse.in_race = in_race
            await self.db.flush()
            logger.debug(f"Horse {horse_id} marked in_race={in_race}")

    async def release_from_race(self, horse_ids: List[UUID]) -> None:

        await self.db.execute(
            update(Horse).where(Horse.id.in_(horse_ids)).values(in_race=False)
        )
        await self.db.flush()
        logger.info(f"Released {len(horse_ids)} horses from races")

    async def get_horse_statistics(self, horse_id: UUID) -> Dict[str, any]:

        result = await self.db.execute(
            select(
                func.count(RaceResult.id).label("total_races"),
                func.coalesce(func.sum(RaceResult.reward_amount), 0.0).label("total_earnings")
            ).where(RaceResult.horse_id == horse_id)
        )
        row = result.first()

        wins_result = await self.db.execute(
            select(func.count(RaceResult.id)).where(
                RaceResult.horse_id == horse_id,
                RaceResult.finish_position == 1
            )
        )
        total_wins = wins_result.scalar_one()

        statistics = {
            "total_races": row.total_races if row else 0,
            "total_wins": total_wins,
            "total_earnings": float(row.total_earnings) if row else 0.0
        }

        logger.debug(f"Computed statistics for horse {horse_id}: {statistics}")
        return statistics

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.logging_config import get_logger
from app.models.horse import Horse
from app.models.horse_stats import HorseStats
from app.models.race import Race, RaceResult, RaceStatus
from app.models.user import User
from app.repositories.base import BaseRepository

logger = get_logger(__name__)


class RaceRepository(BaseRepository[Race]):


    def __init__(self, db: AsyncSession):

        super().__init__(Race, db)

    async def get_by_status(self, status: RaceStatus) -> List[Race]:

        result = await self.db.execute(
            select(Race).where(Race.status == status).order_by(Race.start_time)
        )
        return list(result.scalars().all())

    async def count_by_status(self, status: RaceStatus) -> int:

        result = await self.db.execute(
            select(func.count()).where(Race.status == status)
        )
        return result.scalar_one()

    async def get_races_to_start(self, current_time: datetime, level: int | None = None) -> List[Race]:

        if level:
            result = await self.db.execute(
                select(Race).where(
                    Race.status == RaceStatus.waiting, Race.start_time <= current_time, Race.level_requirement == level
                )
            )
        else:
            result = await self.db.execute(
                select(Race).where(
                    Race.status == RaceStatus.waiting, Race.start_time <= current_time
                )
            )
        return list(result.scalars().all())

    async def get_stuck_races(self, cutoff_time: datetime) -> List[Race]:

        result = await self.db.execute(
            select(Race).where(
                Race.status == RaceStatus.racing, Race.start_time <= cutoff_time
            )
        )
        return list(result.scalars().all())

    async def get_old_finished_races(self, keep_count: int = 100) -> List[Race]:

        count_result = await self.db.execute(
            select(func.count()).where(
                Race.status.in_([RaceStatus.done, RaceStatus.cancelled])
            )
        )
        total_count = count_result.scalar_one()

        if total_count <= keep_count:
            return []

        delete_count = total_count - keep_count
        result = await self.db.execute(
            select(Race)
            .where(Race.status.in_([RaceStatus.done, RaceStatus.cancelled]))
            .order_by(Race.created_at.asc())
            .limit(delete_count)
        )
        return list(result.scalars().all())

    async def get_with_registered_count(
        self, status_filter: Optional[str] = None
    ) -> List[tuple]:

        query = (
            select(Race, func.count(RaceResult.id).label("registered_count"))
            .outerjoin(RaceResult, Race.id == RaceResult.race_id)
            .group_by(Race.id)
            .order_by(Race.start_time)
        )

        if status_filter:
            query = query.where(Race.status == status_filter)

        result = await self.db.execute(query)
        return list(result.all())


class RaceResultRepository(BaseRepository[RaceResult]):


    def __init__(self, db: AsyncSession):

        super().__init__(RaceResult, db)

    async def get_by_race_id(self, race_id: UUID) -> List[RaceResult]:

        result = await self.db.execute(
            select(RaceResult)
            .where(RaceResult.race_id == race_id)
            .order_by(RaceResult.finish_position)
        )
        return list(result.scalars().all())

    async def get_by_race_id_with_details(self, race_id: UUID) -> List[RaceResult]:

        result = await self.db.execute(
            select(RaceResult)
            .where(RaceResult.race_id == race_id)
            .options(
                selectinload(RaceResult.horse).selectinload(Horse.owner),
                selectinload(RaceResult.horse).selectinload(Horse.stats)
            )
            .order_by(RaceResult.finish_position.asc().nulls_last(), RaceResult.finish_time_ms.asc())
        )
        return list(result.scalars().all())

    async def count_by_race_id(self, race_id: UUID) -> int:

        result = await self.db.execute(
            select(func.count()).where(RaceResult.race_id == race_id)
        )
        return result.scalar_one()

    async def exists(self, race_id: UUID, horse_id: UUID) -> bool:

        result = await self.db.execute(
            select(RaceResult).where(
                RaceResult.race_id == race_id, RaceResult.horse_id == horse_id
            )
        )
        return result.scalar_one_or_none() is not None

    async def get_by_race_and_horse(
        self, race_id: UUID, horse_id: UUID
    ) -> Optional[RaceResult]:

        from sqlalchemy.orm import selectinload
        from app.models.horse import Horse

        result = await self.db.execute(
            select(RaceResult)
            .where(
                RaceResult.race_id == race_id,
                RaceResult.horse_id == horse_id
            )
            .options(
                selectinload(RaceResult.horse).selectinload(Horse.owner),
                selectinload(RaceResult.horse).selectinload(Horse.stats)
            )
        )
        return result.scalar_one_or_none()

    async def delete_by_race_id(self, race_id: UUID) -> None:

        await self.db.execute(
            delete(RaceResult).where(RaceResult.race_id == race_id)
        )
        await self.db.flush()
        logger.info(f"Deleted all results for race {race_id}")
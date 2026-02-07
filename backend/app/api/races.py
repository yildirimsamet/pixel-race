
from datetime import datetime, timedelta
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import (
    get_current_user,
    get_join_race_use_case,
    get_start_race_use_case,
    get_end_race_use_case
)
from app.application.race.join_race_use_case import JoinRaceCommand, JoinRaceUseCase
from app.application.race.start_race_use_case import StartRaceCommand, StartRaceUseCase
from app.application.race.end_race_use_case import EndRaceCommand, EndRaceUseCase, RaceEndResult
from app.core.rate_limiter import rate_limit_dependency
from app.core.exceptions import NotFoundError, RaceNotAvailableError, ValidationError
from app.core.logging_config import get_logger
from app.db.base import get_db
from app.models.horse import Horse
from app.models.horse_stats import HorseStats
from app.models.race import Race, RaceResult, RaceStatus
from app.models.user import User
from app.repositories.race_repository import RaceRepository, RaceResultRepository
from app.schemas import RaceJoin, RaceResponse, RaceResultResponse

logger = get_logger(__name__)
router = APIRouter(prefix="/races", tags=["races"])


@router.get("/", response_model=List[RaceResponse])
async def get_races(
    status_filter: str = None,
    db: AsyncSession = Depends(get_db),
) -> List[RaceResponse]:

    logger.info(f"Fetching races with status filter: {status_filter}")

    race_repo = RaceRepository(db)

    if status_filter:
        races_with_counts = await race_repo.get_with_registered_count(status_filter)
    else:
        races_with_counts = await race_repo.get_with_registered_count()

    result = []
    for race, registered_count in races_with_counts:
        race_dict = RaceResponse.model_validate(race).model_dump()
        race_dict["registered_horses"] = registered_count
        result.append(RaceResponse(**race_dict))

    logger.debug(f"Retrieved {len(result)} races")
    return result


@router.get("/{race_id}/can-join")
async def can_join_race(
    race_id: UUID,
    horse_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:

    logger.info(
        f"User {current_user.id} checking if horse {horse_id} can join race {race_id}"
    )

    race_repo = RaceRepository(db)
    race = await race_repo.get_by_id(race_id)

    if not race:
        logger.debug(f"Race {race_id} not found")
        return {"can_join": False, "reason": "Race not found"}

    if race.status != RaceStatus.waiting:
        logger.debug(f"Race {race_id} is not accepting registrations (status: {race.status})")
        return {"can_join": False, "reason": "Race is not accepting registrations"}

    result = await db.execute(
        select(Horse).where(
            Horse.id == horse_id, Horse.user_id == current_user.id
        )
    )
    horse = result.scalar_one_or_none()

    if not horse:
        logger.debug(
            f"Horse {horse_id} not found or not owned by user {current_user.id}"
        )
        return {"can_join": False, "reason": "Horse not found or not owned by you"}

    if horse.in_race:
        logger.debug(f"Horse {horse_id} is already in a race")
        return {"can_join": False, "reason": "Horse is already in a race"}

    result = await db.execute(select(HorseStats).where(HorseStats.horse_id == horse.id))
    stats = result.scalar_one_or_none()

    if not stats:
        logger.error(f"Horse {horse_id} has no stats")
        return {"can_join": False, "reason": "Horse stats not found"}

    if stats.level != race.level_requirement:
        logger.debug(
            f"Horse {horse_id} level {stats.level} doesn't match race requirement {race.level_requirement}"
        )
        return {
            "can_join": False,
            "reason": f"Horse level {stats.level} doesn't match race requirement (Level {race.level_requirement})"
        }

    if stats.energy < 10:
        logger.debug(f"Horse {horse_id} is too tired to race (energy: {stats.energy})")
        return {"can_join": False, "reason": "Horse is too tired to race! Let it rest."}

    if stats.satiety < 10:
        logger.debug(
            f"Horse {horse_id} is too hungry to race (satiety: {stats.satiety})"
        )
        return {"can_join": False, "reason": "Horse is too hungry! Feed it first."}

    race_result_repo = RaceResultRepository(db)
    registered_count = await race_result_repo.count_by_race_id(race_id)

    if registered_count >= race.max_horses:
        logger.debug(f"Race {race_id} is full ({registered_count}/{race.max_horses})")
        return {"can_join": False, "reason": "Race is full"}

    result = await db.execute(
        select(RaceResult)
        .join(Horse, RaceResult.horse_id == Horse.id)
        .where(RaceResult.race_id == race_id)
        .where(Horse.user_id == current_user.id)
    )
    user_already_registered = result.scalar_one_or_none()

    if user_already_registered:
        logger.debug(
            f"User {current_user.id} already has a horse registered for race {race_id}"
        )
        return {"can_join": False, "reason": "You already have a horse registered for this race"}

    already_registered = await race_result_repo.exists(race_id, horse_id)

    if already_registered:
        logger.debug(f"Horse {horse_id} is already registered for race {race_id}")
        return {"can_join": False, "reason": "Horse is already registered for this race"}

    logger.debug(f"Horse {horse_id} can join race {race_id}")
    return {
        "can_join": True,
        "entry_fee": race.entry_fee
    }


@router.post("/{race_id}/join", status_code=status.HTTP_200_OK, dependencies=[Depends(rate_limit_dependency)])
async def join_race(
    race_id: UUID,
    join_data: RaceJoin,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    join_race_use_case: JoinRaceUseCase = Depends(get_join_race_use_case)
) -> dict:

    command = JoinRaceCommand(
        race_id=race_id,
        horse_id=join_data.horse_id,
        transaction_signature=join_data.transaction_signature,
        user_id=current_user.id,
        user_wallet=current_user.wallet_address
    )

    result = await join_race_use_case.execute(db, command)

    return {
        "message": result.message,
        "entry_fee_paid": result.entry_fee_paid,
        "prize_pool": result.prize_pool,
        "registered_count": result.registered_count,
        "max_horses": result.max_horses,
        "transaction_signature": result.transaction_signature
    }


@router.get("/{race_id}/results", response_model=List[RaceResultResponse])
async def get_race_results(
    race_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> List[RaceResultResponse]:

    from app.utils.wallet_utils import slice_wallet_address

    logger.info(f"Fetching results for race {race_id}")

    race_repo = RaceRepository(db)
    race = await race_repo.get_by_id(race_id)

    if not race:
        logger.warning(f"Race {race_id} not found")
        raise NotFoundError("Race")

    race_result_repo = RaceResultRepository(db)
    results = await race_result_repo.get_by_race_id_with_details(race_id)

    enriched_results = []
    for result in results:
        horse = result.horse
        owner = horse.owner if horse else None

        owner_display = slice_wallet_address(owner.wallet_address) if owner else "Unknown"

        enriched_results.append(
            RaceResultResponse(
                id=result.id,
                race_id=result.race_id,
                horse_id=result.horse_id,
                horse_name=horse.name if horse else "Unknown",
                owner_name=owner_display,
                color=horse.color if horse else "#ffffff",
                finish_position=result.finish_position,
                finish_time_ms=result.finish_time_ms,
                reward_amount=result.reward_amount or 0,
                created_at=result.created_at,
                race_segments=result.race_segments,
                goodluck_used=result.goodluck_used,
            )
        )

    logger.debug(f"Retrieved {len(enriched_results)} results for race {race_id}")
    return enriched_results


@router.post("/{race_id}/start", status_code=status.HTTP_200_OK)
async def start_race(
    race_id: UUID,
    db: AsyncSession = Depends(get_db),
    start_race_use_case: StartRaceUseCase = Depends(get_start_race_use_case)
) -> dict:

    command = StartRaceCommand(race_id=race_id)
    result = await start_race_use_case.execute(db, command)

    return {
        "message": result.message,
        "horses": result.horses_data
    }


class RaceEndResultSchema(BaseModel):


    horse_id: str
    finish_time_ms: int
    position: int


class RaceEndData(BaseModel):


    results: List[RaceEndResultSchema]


@router.post("/{race_id}/end", status_code=status.HTTP_200_OK)
async def end_race(
    race_id: UUID,
    end_data: RaceEndData,
    db: AsyncSession = Depends(get_db),
    end_race_use_case: EndRaceUseCase = Depends(get_end_race_use_case)
) -> dict:

    command = EndRaceCommand(
        race_id=race_id,
        results=[
            RaceEndResult(
                horse_id=r.horse_id,
                finish_time_ms=r.finish_time_ms,
                position=r.position
            )
            for r in end_data.results
        ]
    )

    result = await end_race_use_case.execute(db, command)

    return {
        "message": result.message,
        "prize_pool": result.prize_pool,
        "rewards_distributed": result.rewards_distributed
    }


@router.post("/create-test-race", status_code=status.HTTP_201_CREATED)
async def create_test_race(
    level: int = 1,
    db: AsyncSession = Depends(get_db),
) -> dict:

    logger.info(f"Creating test race with level {level}")

    if level not in [1, 2, 3]:
        logger.warning(f"Invalid race level {level} requested")
        raise ValidationError("Level must be 1, 2, or 3")

    entry_fees = {1: 0.01, 2: 0.03, 3: 0.05}
    max_horses_config = {1: 8, 2: 6, 3: 6}
    min_horses_config = {1: 6, 2: 5, 3: 5}

    start_time = datetime.utcnow() + timedelta(minutes=2)

    race_repo = RaceRepository(db)
    new_race = await race_repo.create(
        entry_fee=entry_fees[level],
        max_horses=max_horses_config[level],
        min_horses=min_horses_config[level],
        start_time=start_time,
        level_requirement=level,
        status=RaceStatus.waiting,
    )

    logger.info(f"Created test race {new_race.id} with level {level}")

    return {
        "message": "Test race created",
        "race_id": str(new_race.id),
        "level": level,
        "start_time": new_race.start_time.isoformat(),
    }


@router.post("/{race_id}/auto-register-horses", status_code=status.HTTP_200_OK)
async def auto_register_horses(
    race_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:

    from app.core.config import settings
    if hasattr(settings, 'ENVIRONMENT') and settings.ENVIRONMENT == "production":
        from fastapi import HTTPException
        logger.warning("Attempt to use test endpoint in production")
        raise HTTPException(
            status_code=404,
            detail="Endpoint not available in production"
        )

    logger.info(f"Auto-registering horses for race {race_id}")

    race_repo = RaceRepository(db)
    race = await race_repo.get_by_id(race_id)

    if not race:
        logger.warning(f"Race {race_id} not found")
        raise NotFoundError("Race")

    if race.status != RaceStatus.waiting:
        logger.warning(f"Race {race_id} is not in waiting status")
        raise RaceNotAvailableError("Race is not in waiting status")

    result = await db.execute(
        select(Horse)
        .where(Horse.in_race == False)
        .limit(race.max_horses)
    )
    available_horses = result.scalars().all()

    race_result_repo = RaceResultRepository(db)
    registered_count = 0

    for horse in available_horses:
        already_exists = await race_result_repo.exists(race_id, horse.id)

        if already_exists:
            continue

        user_result = await db.execute(select(User).where(User.id == horse.user_id))
        user = user_result.scalar_one_or_none()

        if not user:
            continue

        horse.in_race = True

        await race_result_repo.create(race_id=race_id, horse_id=horse.id)

        registered_count += 1

        if registered_count >= race.max_horses:
            break

    await db.commit()

    logger.info(f"Auto-registered {registered_count} horses for race {race_id}")

    return {
        "message": f"Auto-registered {registered_count} horses",
        "registered_count": registered_count,
    }


@router.get("/{race_id}/my-horse-stats")
async def get_my_horse_stats_after_race(
    race_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    logger.info(f"User {current_user.id} fetching stats for their horse in race {race_id}")

    result = await db.execute(
        select(RaceResult)
        .join(Horse)
        .where(RaceResult.race_id == race_id)
        .where(Horse.user_id == current_user.id)
        .options(
            selectinload(RaceResult.horse)
        )
    )
    race_result = result.scalar_one_or_none()

    if not race_result:
        logger.warning(f"User {current_user.id} has no horse in race {race_id}")
        raise NotFoundError("Your horse did not participate in this race")

    stats_before = race_result.stats_before or {}
    stats_after = race_result.stats_after or {}

    stat_changes = {}
    for key in stats_after:
        before_val = stats_before.get(key, 0)
        after_val = stats_after.get(key, 0)
        stat_changes[key] = after_val - before_val

    horse = race_result.horse
    from app.schemas import HorseResponse

    return {
        "race_id": str(race_id),
        "horse": HorseResponse.model_validate(horse),
        "position": race_result.finish_position,
        "reward_amount": race_result.reward_amount,
        "stats_before": stats_before,
        "stats_after": stats_after,
        "stat_changes": stat_changes,
        "horse_age": horse.age
    }
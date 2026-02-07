import json
from dataclasses import dataclass
from typing import Dict, List
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import TREASURY_PROTECTION_CONFIG
from app.core.exceptions import NotFoundError, RaceNotAvailableError
from app.core.logging_config import get_logger
from app.models.race import RaceStatus
from app.repositories.race_repository import RaceRepository, RaceResultRepository
from app.services.race_logic import calculate_horse_segments
from app.services.logging_service import LogAction, LogLevel, LogStep, logging_service
from app.services.treasury_monitor import treasury_monitor

logger = get_logger(__name__)


@dataclass
class StartRaceCommand:

    race_id: UUID


@dataclass
class RaceStartedResult:

    race_id: UUID
    horses_data: List[Dict]
    message: str = "Race started"


class StartRaceUseCase:


    def __init__(self):
        pass

    async def execute(self, db: AsyncSession, command: StartRaceCommand, request_id = None) -> RaceStartedResult:

        logger.info(f"RACE_START - START - Starting race {command.race_id}")

        race_repo = RaceRepository(db)
        race = await race_repo.get_by_id(command.race_id)

        if not race:
            logger.warning(f"Race {command.race_id} not found")
            await logging_service.log_action(
                user_id=None,
                action=LogAction.RACE_START,
                step=LogStep.ERROR,
                level=LogLevel.ERROR,
                message=f"Race {command.race_id} not found",
                metadata={"race_id": str(command.race_id)},
                request_id=request_id,
            )
            raise NotFoundError("Race")

        if race.status != RaceStatus.waiting:
            logger.warning(f"Race {command.race_id} is not in waiting status (status: {race.status})")
            await logging_service.log_action(
                user_id=None,
                action=LogAction.RACE_START,
                step=LogStep.ERROR,
                level=LogLevel.ERROR,
                message=f"Race not in waiting status (status: {race.status})",
                metadata={"race_id": str(command.race_id), "status": race.status.value},
                request_id=request_id,
            )
            raise RaceNotAvailableError("Race is not in waiting status")

        race_result_repo = RaceResultRepository(db)
        race_results = await race_result_repo.get_by_race_id_with_details(command.race_id)

        if len(race_results) < race.min_horses:
            logger.warning(
                f"Not enough horses for race {command.race_id}: need {race.min_horses}, have {len(race_results)}"
            )
            raise RaceNotAvailableError(
                f"Not enough horses registered. Need {race.min_horses}, have {len(race_results)}"
            )

        treasury_balance, _ = await treasury_monitor.check_balance()
        bot_speed_boost_active = (
            TREASURY_PROTECTION_CONFIG["enabled"] and
            treasury_balance < settings.TREASURY_LOW_BALANCE_THRESHOLD
        )

        if bot_speed_boost_active:
            logger.warning(
                f"⚠️ TREASURY PROTECTION ACTIVATED - Balance: {treasury_balance:.4f} SOL "
                f"(threshold: {settings.TREASURY_LOW_BALANCE_THRESHOLD} SOL). "
                f"Bot horses will receive speed boost to increase win rate."
            )

        logger.info(f"RACE_START - CALCULATE_SEGMENTS - Calculating segments for {len(race_results)} horses")

        horses_data = []
        for result in race_results:
            horse = result.horse

            if not horse:
                logger.warning(f"Horse {result.horse_id} not found for race {command.race_id}")
                continue

            if not horse.stats:
                logger.error(f"Horse {horse.id} has no stats - cannot calculate segments")
                continue

            owner = horse.owner

            bot_speed_boost_seconds = 0
            race_level = race.level_requirement

            if bot_speed_boost_active and owner and owner.is_bot:
                import random
                bot_speed_boost_seconds = random.uniform(
                    TREASURY_PROTECTION_CONFIG[race_level]["bot_speed_boost_min_seconds"],
                    TREASURY_PROTECTION_CONFIG[race_level]["bot_speed_boost_max_seconds"]
                )
                logger.debug(
                    f"Bot horse {horse.name} (owner: {owner.wallet_address[:8]}...) "
                    f"receiving {bot_speed_boost_seconds:.2f}s speed boost"
                )

            goodluck_used = getattr(result, 'goodluck_used', False)
            segments = calculate_horse_segments(
                horse,
                tier=race.level_requirement,
                goodluck_used=goodluck_used,
                bot_speed_boost_seconds=bot_speed_boost_seconds
            )
            finish_time_ms = sum(seg["time"] for seg in segments)

            result.race_segments = json.dumps(segments)
            result.finish_time_ms = finish_time_ms

            from app.utils.wallet_utils import slice_wallet_address

            horses_data.append(
                {
                    "horse_id": str(horse.id),
                    "horse_name": horse.name,
                    "segments": segments,
                    "finish_time_ms": finish_time_ms,
                    "color": horse.color,
                    "owner_name": slice_wallet_address(owner.wallet_address) if owner else "Unknown",
                }
            )

        race.status = RaceStatus.racing
        await db.commit()

        logger.info(f"Race {command.race_id} started with {len(horses_data)} horses")

        logger.info(f"RACE_START - NOTIFY_SOCKET - Notifying socket server")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{settings.SOCKET_SERVER_URL}/races/{command.race_id}/start",
                    json={"horses": horses_data},
                )
                response.raise_for_status()
            logger.debug(f"Notified socket server about race {command.race_id} start")
        except Exception as e:
            logger.error(f"RACE_START - ERROR - Failed to notify socket server: {e}")
            await logging_service.log_action(
                user_id=None,
                action=LogAction.RACE_START,
                step=LogStep.ERROR,
                level=LogLevel.ERROR,
                message=f"Failed to notify socket server: {str(e)}",
                metadata={"race_id": str(command.race_id), "error": str(e)},
                request_id=request_id,
            )
            await db.rollback()
            raise RaceNotAvailableError(
                "Failed to start race: socket server unavailable"
            )

        logger.info(f"RACE_START - SUCCESS - Race {command.race_id} started successfully")

        return RaceStartedResult(
            race_id=command.race_id,
            horses_data=horses_data
        )
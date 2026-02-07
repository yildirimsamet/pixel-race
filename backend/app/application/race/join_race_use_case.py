from dataclasses import dataclass
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    HorseUnavailableError,
    NotFoundError,
    RaceFullError,
    RaceNotAvailableError,
    ValidationError,
)
from app.core.logging_config import get_logger
from app.models.horse import Horse
from app.models.horse_stats import HorseStats
from app.models.race import Race, RaceResult, RaceStatus
from app.repositories.race_repository import RaceRepository, RaceResultRepository
from app.services.notification_service import NotificationService
from app.services.transaction_verification_service import TransactionVerificationService

logger = get_logger(__name__)


@dataclass
class JoinRaceCommand:

    race_id: UUID
    horse_id: UUID
    transaction_signature: str
    user_id: UUID
    user_wallet: str


@dataclass
class RaceJoinedResult:

    message: str
    entry_fee_paid: float
    prize_pool: float
    registered_count: int
    max_horses: int
    transaction_signature: str


class JoinRaceUseCase:


    def __init__(
        self,
        notification_service: NotificationService,
        transaction_verifier: TransactionVerificationService
    ):
        self.notification_service = notification_service
        self.transaction_verifier = transaction_verifier

    async def execute(self, db: AsyncSession, command: JoinRaceCommand) -> RaceJoinedResult:

        logger.info(
            f"User {command.user_id} joining race {command.race_id} with horse {command.horse_id}"
        )

        race_repo = RaceRepository(db)
        race = await race_repo.get_by_id(command.race_id)

        if not race:
            logger.warning(f"Race {command.race_id} not found")
            raise NotFoundError("Race")

        if race.status != RaceStatus.waiting:
            logger.warning(f"Race {command.race_id} is not accepting registrations (status: {race.status})")
            raise RaceNotAvailableError("Race is not accepting registrations")

        result = await db.execute(
            select(Horse)
            .where(Horse.id == command.horse_id, Horse.user_id == command.user_id)
            .with_for_update()
        )
        horse = result.scalar_one_or_none()

        if not horse:
            logger.warning(
                f"Horse {command.horse_id} not found or not owned by user {command.user_id}"
            )
            raise NotFoundError("Horse not found or not owned by you")

        if horse.in_race:
            logger.warning(f"Horse {command.horse_id} is already in a race")
            raise HorseUnavailableError("Horse is already in a race")

        result = await db.execute(select(HorseStats).where(HorseStats.horse_id == horse.id))
        stats = result.scalar_one_or_none()

        if not stats:
            logger.error(f"Horse {command.horse_id} has no stats")
            raise ValidationError("Horse stats not found")

        if stats.level != race.level_requirement:
            logger.warning(
                f"Horse {command.horse_id} level {stats.level} doesn't match race requirement {race.level_requirement}"
            )
            raise ValidationError(
                f"Horse level {stats.level} doesn't match race requirement (Level {race.level_requirement})"
            )

        if stats.energy < 10:
            logger.warning(f"Horse {command.horse_id} is too tired to race (energy: {stats.energy})")
            raise HorseUnavailableError("Horse is too tired to race! Let it rest.")

        if stats.satiety < 10:
            logger.warning(
                f"Horse {command.horse_id} is too hungry to race (satiety: {stats.satiety})"
            )
            raise HorseUnavailableError("Horse is too hungry! Feed it first.")

        race_result_repo = RaceResultRepository(db)
        registered_count = await race_result_repo.count_by_race_id(command.race_id)

        if registered_count >= race.max_horses:
            logger.warning(f"Race {command.race_id} is full ({registered_count}/{race.max_horses})")
            raise RaceFullError()

        result = await db.execute(
            select(RaceResult)
            .join(Horse, RaceResult.horse_id == Horse.id)
            .where(RaceResult.race_id == command.race_id)
            .where(Horse.user_id == command.user_id)
        )
        user_already_registered = result.scalar_one_or_none()

        if user_already_registered:
            logger.warning(
                f"User {command.user_id} already has a horse registered for race {command.race_id}"
            )
            raise ValidationError("You already have a horse registered for this race. Only one horse per race is allowed.")

        already_registered = await race_result_repo.exists(command.race_id, command.horse_id)

        if already_registered:
            logger.warning(f"Horse {command.horse_id} is already registered for race {command.race_id}")
            raise ValidationError("Horse is already registered for this race")

        if not command.transaction_signature:
            logger.warning(f"No transaction signature provided for race join by user {command.user_id}")
            raise ValidationError(
                "Transaction signature is required for race entry",
                details={"field": "transaction_signature"}
            )

        await self.transaction_verifier.verify_payment_transaction(
            db=db,
            from_wallet=command.user_wallet,
            transaction_signature=command.transaction_signature,
            expected_amount_sol=race.entry_fee
        )

        logger.info(f"Entry fee payment verified for user {command.user_id}, race {command.race_id}")

        if not race.prize_pool_sol:
            race.prize_pool_sol = 0.0
        race.prize_pool_sol += race.entry_fee
        logger.debug(f"Updated prize pool for race {command.race_id}: {race.prize_pool_sol} SOL")

        horse.in_race = True

        race_result = await race_result_repo.create(
            race_id=command.race_id, horse_id=command.horse_id
        )

        await self.notification_service.notify_race_joined(
            db=db,
            user_id=command.user_id,
            horse_name=horse.name,
            horse_id=command.horse_id,
            race_id=command.race_id,
            entry_fee=race.entry_fee,
            prize_pool=race.prize_pool_sol,
            transaction_signature=command.transaction_signature
        )

        await db.commit()

        registered_count = await race_result_repo.count_by_race_id(command.race_id)

        logger.info(f"Horse {command.horse_id} successfully joined race {command.race_id}")

        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                await client.post(
                    f"{settings.SOCKET_SERVER_URL}/races/{command.race_id}/registration",
                    json={
                        "horse_name": horse.name,
                        "registered_count": registered_count,
                        "max_horses": race.max_horses
                    }
                )
                logger.debug(f"Notified socket server of registration for race {command.race_id}")
        except Exception as e:
            logger.warning(f"Failed to notify socket server: {e}")

        return RaceJoinedResult(
            message="Successfully joined race",
            entry_fee_paid=race.entry_fee,
            prize_pool=race.prize_pool_sol,
            registered_count=registered_count,
            max_horses=race.max_horses,
            transaction_signature=command.transaction_signature
        )
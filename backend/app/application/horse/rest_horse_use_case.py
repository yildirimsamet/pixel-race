from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import game_config
from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.core.logging_config import get_logger
from app.models.horse import Horse
from app.models.horse_stats import HorseStats
from app.models.notification import NotificationType
from app.repositories.notification_repository import NotificationRepository
from app.services.transaction_verification_service import TransactionVerificationService

logger = get_logger(__name__)


@dataclass
class RestHorseCommand:

    horse_id: UUID
    user_id: UUID
    user_wallet: str
    transaction_signature: str


@dataclass
class HorseRestedResult:

    stats: HorseStats
    message: str = "Horse rested successfully"


class RestHorseUseCase:


    def __init__(self, transaction_verifier: TransactionVerificationService):
        self.transaction_verifier = transaction_verifier

    async def execute(self, db: AsyncSession, command: RestHorseCommand) -> HorseRestedResult:

        logger.info(f"User {command.user_id} resting horse {command.horse_id}")

        result = await db.execute(select(Horse).where(Horse.id == command.horse_id))
        horse = result.scalar_one_or_none()

        if not horse:
            logger.warning(f"Horse {command.horse_id} not found")
            raise NotFoundError("Horse")

        if horse.user_id != command.user_id:
            logger.warning(
                f"User {command.user_id} attempted to rest horse {command.horse_id} owned by {horse.user_id}"
            )
            raise AuthorizationError("You do not own this horse")

        if horse.in_race:
            logger.warning(f"Horse {command.horse_id} is currently in a race")
            raise ValidationError(
                "Cannot rest horse while in race",
                details={"horse_id": str(command.horse_id), "in_race": True}
            )

        result = await db.execute(select(HorseStats).where(HorseStats.horse_id == horse.id))
        stats = result.scalar_one_or_none()

        if not stats:
            logger.warning(f"Stats not initialized for horse {command.horse_id}")
            raise NotFoundError("Horse stats not initialized")

        if stats.energy >= 100:
            logger.warning(f"Horse {command.horse_id} energy already at maximum")
            raise ValidationError(
                "Already at maximum",
                details={"current_energy": stats.energy}
            )

        care_prices = game_config.get_horse_care_prices()
        await self.transaction_verifier.verify_payment_transaction(
            db=db,
            from_wallet=command.user_wallet,
            transaction_signature=command.transaction_signature,
            expected_amount_sol=care_prices["rest"]
        )

        stats.energy = 100
        stats.updated_at = datetime.utcnow()

        notification_repo = NotificationRepository(db)
        await notification_repo.create(
            user_id=command.user_id,
            notification_type=NotificationType.HORSE_RESTED,
            title=f"⚡ {horse.name} Rested Successfully",
            message=f"Your horse {horse.name} has rested well and energy restored to 100%!",
            horse_id=horse.id
        )

        await db.commit()
        await db.refresh(stats)

        logger.info(f"Successfully rested horse {command.horse_id}, energy restored to 100")

        return HorseRestedResult(stats=stats)
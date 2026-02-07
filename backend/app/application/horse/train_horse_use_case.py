import random
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
class TrainHorseCommand:

    horse_id: UUID
    user_id: UUID
    user_wallet: str
    transaction_signature: str


@dataclass
class HorseTrainedResult:

    success: bool
    old_determination: int
    new_determination: int
    message: str


class TrainHorseUseCase:


    def __init__(self, transaction_verifier: TransactionVerificationService):
        self.transaction_verifier = transaction_verifier

    async def execute(self, db: AsyncSession, command: TrainHorseCommand) -> HorseTrainedResult:

        logger.info(f"User {command.user_id} training horse {command.horse_id}")

        result = await db.execute(select(Horse).where(Horse.id == command.horse_id))
        horse = result.scalar_one_or_none()

        if not horse:
            logger.warning(f"Horse {command.horse_id} not found")
            raise NotFoundError("Horse")

        if horse.user_id != command.user_id:
            logger.warning(
                f"User {command.user_id} attempted to train horse {command.horse_id} owned by {horse.user_id}"
            )
            raise AuthorizationError("You do not own this horse")

        if horse.in_race:
            logger.warning(f"Horse {command.horse_id} is currently in a race")
            raise ValidationError(
                "Cannot train horse while in race",
                details={"horse_id": str(command.horse_id), "in_race": True}
            )

        result = await db.execute(select(HorseStats).where(HorseStats.horse_id == horse.id))
        stats = result.scalar_one_or_none()

        if not stats:
            logger.warning(f"Stats not initialized for horse {command.horse_id}")
            raise NotFoundError("Horse stats not initialized")

        if stats.determination >= 100:
            logger.warning(f"Horse {command.horse_id} determination already at maximum")
            raise ValidationError(
                "Already at maximum determination",
                details={"current_determination": stats.determination}
            )

        care_prices = game_config.get_horse_care_prices()
        await self.transaction_verifier.verify_payment_transaction(
            db=db,
            from_wallet=command.user_wallet,
            transaction_signature=command.transaction_signature,
            expected_amount_sol=care_prices["train"]
        )

        old_determination = stats.determination

        training_cfg = game_config.get_training_config()
        success = random.random() < training_cfg["success_chance"]

        notification_repo = NotificationRepository(db)

        if success:
            new_determination = min(old_determination + training_cfg["determination_increase"], 100)
            stats.determination = new_determination
            stats.updated_at = datetime.utcnow()

            await notification_repo.create(
                user_id=command.user_id,
                notification_type=NotificationType.TRAIN_SUCCESS,
                title=f"💪 {horse.name} Training Success!",
                message=f"Great work! {horse.name}'s determination increased from {old_determination} to {new_determination} (+{new_determination - old_determination})!",
                horse_id=horse.id
            )

            await db.commit()
            await db.refresh(stats)
            message = f"Training successful! Determination increased by {new_determination - old_determination}"
            logger.info(
                f"Training successful for horse {command.horse_id}: determination {old_determination} -> {new_determination}"
            )
        else:
            new_determination = old_determination

            await notification_repo.create(
                user_id=command.user_id,
                notification_type=NotificationType.TRAIN_FAILED,
                title=f"💪 {horse.name} Training Failed",
                message=f"Unfortunately, training didn't work this time. {horse.name}'s determination remains at {old_determination}. Try again!",
                horse_id=horse.id
            )

            await db.commit()
            message = "Training failed. Better luck next time!"
            logger.info(f"Training failed for horse {command.horse_id}: determination unchanged at {old_determination}")

        return HorseTrainedResult(
            success=success,
            old_determination=old_determination,
            new_determination=new_determination,
            message=message
        )
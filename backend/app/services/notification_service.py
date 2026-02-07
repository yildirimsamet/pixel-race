from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from app.models.notification import NotificationType
from app.repositories.notification_repository import NotificationRepository

logger = get_logger(__name__)


class NotificationService:


    def __init__(self):
        pass

    async def notify_horse_purchased(
        self,
        db: AsyncSession,
        user_id: UUID,
        horse_name: str,
        horse_level: int,
        horse_id: UUID,
        nft_mint: str,
        transaction_signature: str
    ) -> None:

        notification_repo = NotificationRepository(db)
        await notification_repo.create(
            user_id=user_id,
            notification_type=NotificationType.HORSE_PURCHASED,
            title=f"Mystery Box Opened - {horse_name} Acquired!",
            message=(
                f"Congratulations! You've obtained a Level {horse_level} horse named {horse_name}! "
                f"NFT minted: {nft_mint[:8]}..."
            ),
            horse_id=horse_id,
            transaction_signature=transaction_signature
        )
        logger.debug(f"Notification sent: horse_purchased for user {user_id}, horse {horse_id}")

    async def notify_race_joined(
        self,
        db: AsyncSession,
        user_id: UUID,
        horse_name: str,
        horse_id: UUID,
        race_id: UUID,
        entry_fee: float,
        prize_pool: float,
        transaction_signature: str
    ) -> None:

        notification_repo = NotificationRepository(db)
        await notification_repo.create(
            user_id=user_id,
            notification_type=NotificationType.RACE_JOIN,
            title="Race Joined Successfully!",
            message=(
                f"{horse_name} has joined the race. "
                f"Entry fee: {entry_fee} SOL. Prize pool: {prize_pool} SOL."
            ),
            race_id=race_id,
            horse_id=horse_id,
            amount_sol=entry_fee,
            transaction_signature=transaction_signature
        )
        logger.debug(f"Notification sent: race_joined for user {user_id}, race {race_id}")

    async def notify_race_win(
        self,
        db: AsyncSession,
        user_id: UUID,
        horse_name: str,
        horse_id: UUID,
        race_id: UUID,
        position: int,
        reward_amount: float,
        transaction_signature: str
    ) -> None:

        position_text = {1: "1st", 2: "2nd", 3: "3rd"}.get(position, f"{position}th")

        notification_repo = NotificationRepository(db)
        await notification_repo.create(
            user_id=user_id,
            notification_type=NotificationType.RACE_WIN,
            title=f"{position_text} Place - {horse_name}!",
            message=(
                f"Your horse {horse_name} finished in {position_text} place and won {reward_amount} SOL!"
            ),
            race_id=race_id,
            horse_id=horse_id,
            amount_sol=reward_amount,
            transaction_signature=transaction_signature
        )
        logger.debug(f"Notification sent: race_win for user {user_id}, position {position}")

    async def notify_horse_fed(
        self,
        db: AsyncSession,
        user_id: UUID,
        horse_name: str,
        horse_id: UUID
    ) -> None:

        notification_repo = NotificationRepository(db)
        await notification_repo.create(
            user_id=user_id,
            notification_type=NotificationType.HORSE_FED,
            title=f"{horse_name} Fed Successfully",
            message=f"Your horse {horse_name} has been fed and satiety restored to 100%!",
            horse_id=horse_id
        )
        logger.debug(f"Notification sent: horse_fed for user {user_id}, horse {horse_id}")

    async def notify_horse_rested(
        self,
        db: AsyncSession,
        user_id: UUID,
        horse_name: str,
        horse_id: UUID
    ) -> None:

        notification_repo = NotificationRepository(db)
        await notification_repo.create(
            user_id=user_id,
            notification_type=NotificationType.HORSE_RESTED,
            title=f"{horse_name} Rested Successfully",
            message=f"Your horse {horse_name} has rested well and energy restored to 100%!",
            horse_id=horse_id
        )
        logger.debug(f"Notification sent: horse_rested for user {user_id}, horse {horse_id}")

    async def notify_train_success(
        self,
        db: AsyncSession,
        user_id: UUID,
        horse_name: str,
        horse_id: UUID,
        old_determination: int,
        new_determination: int
    ) -> None:

        increase = new_determination - old_determination

        notification_repo = NotificationRepository(db)
        await notification_repo.create(
            user_id=user_id,
            notification_type=NotificationType.TRAIN_SUCCESS,
            title=f"{horse_name} Training Success!",
            message=(
                f"Great work! {horse_name}'s determination increased from {old_determination} "
                f"to {new_determination} (+{increase})!"
            ),
            horse_id=horse_id
        )
        logger.debug(f"Notification sent: train_success for user {user_id}, horse {horse_id}")

    async def notify_train_failed(
        self,
        db: AsyncSession,
        user_id: UUID,
        horse_name: str,
        horse_id: UUID,
        determination: int
    ) -> None:

        notification_repo = NotificationRepository(db)
        await notification_repo.create(
            user_id=user_id,
            notification_type=NotificationType.TRAIN_FAILED,
            title=f"{horse_name} Training Failed",
            message=(
                f"Unfortunately, training didn't work this time. {horse_name}'s determination "
                f"remains at {determination}. Try again!"
            ),
            horse_id=horse_id
        )
        logger.debug(f"Notification sent: train_failed for user {user_id}, horse {horse_id}")

    async def notify_race_cancelled(
        self,
        db: AsyncSession,
        user_id: UUID,
        race_id: UUID,
        refund_amount: Optional[float] = None,
        transaction_signature: Optional[str] = None
    ) -> None:

        notification_repo = NotificationRepository(db)

        if refund_amount:
            message = f"Race has been cancelled and your entry fee of {refund_amount} SOL has been refunded."
        else:
            message = "Race has been cancelled."

        await notification_repo.create(
            user_id=user_id,
            notification_type=NotificationType.RACE_CANCELLED,
            title="Race Cancelled",
            message=message,
            race_id=race_id,
            amount_sol=refund_amount,
            transaction_signature=transaction_signature
        )
        logger.debug(f"Notification sent: race_cancelled for user {user_id}, race {race_id}")

    async def notify_goodluck_used(
        self,
        db: AsyncSession,
        user_id: UUID,
        horse_name: str,
        horse_id: UUID,
        race_id: UUID
    ) -> None:

        notification_repo = NotificationRepository(db)
        await notification_repo.create(
            user_id=user_id,
            notification_type=NotificationType.GOODLUCK_USED,
            title="GoodLuck Token Activated!",
            message=f"GoodLuck token used for {horse_name}! Speed boost applied for this race.",
            race_id=race_id,
            horse_id=horse_id
        )
        logger.debug(f"Notification sent: goodluck_used for user {user_id}, race {race_id}")
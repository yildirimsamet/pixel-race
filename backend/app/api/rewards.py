
import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.base import get_db
from app.models.user import User
from app.models.user_reward import RewardType
from app.services.reward_service import RewardService
from app.repositories.notification_repository import NotificationRepository
from app.models.notification import NotificationType
from app.services.horse_factory import HorseFactory

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rewards", tags=["rewards"])


class RewardResponse(BaseModel):

    id: str
    user_id: str
    reward_type: str
    claimed: bool
    claimed_at: str | None
    created_at: str

    class Config:
        from_attributes = True


class ClaimRewardRequest(BaseModel):

    reward_id: str


class ClaimRewardResponse(BaseModel):

    success: bool
    reward: RewardResponse | None
    message: str
    horse_id: str | None = None


@router.get("/", response_model=List[RewardResponse])
async def get_my_rewards(
    unclaimed_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    rewards = await RewardService.get_user_rewards(
        db=db,
        user_id=current_user.id,
        unclaimed_only=unclaimed_only
    )

    return [
        RewardResponse(
            id=str(r.id),
            user_id=str(r.user_id),
            reward_type=r.reward_type,
            claimed=r.claimed,
            claimed_at=r.claimed_at.isoformat() if r.claimed_at else None,
            created_at=r.created_at.isoformat()
        )
        for r in rewards
    ]


@router.post("/claim", response_model=ClaimRewardResponse)
async def claim_reward(
    request: ClaimRewardRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    try:
        reward_id = UUID(request.reward_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reward_id format"
        )

    reward = await RewardService.claim_reward(
        db=db,
        user_id=current_user.id,
        reward_id=reward_id
    )

    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reward not found or already claimed"
        )

    horse_id = None
    if reward.reward_type == RewardType.WELCOME_BOX.value:
        logger.info(f"Opening welcome box for user {current_user.id}")

        factory = HorseFactory()
        new_horse, initial_stats = await factory.create_horse(
            db=db,
            user_id=current_user.id,
            level=1
        )

        from app.services.solana_service import SolanaService
        solana = SolanaService()

        metadata = {
            "name": new_horse.name,
            "birthdate": str(new_horse.birthdate),
            "color": new_horse.color,
            "level": 1,
        }

        try:
            nft_mint, metadata_uri = await solana.mint_horse_nft(
                horse_id=str(new_horse.id),
                owner_wallet=current_user.wallet_address,
                metadata=metadata,
            )

            new_horse.nft_mint_address = nft_mint
            new_horse.nft_metadata_uri = metadata_uri
            from datetime import datetime
            new_horse.minted_at = datetime.utcnow()

            await db.commit()
            logger.info(f"Welcome box opened: Created horse {new_horse.id} ({new_horse.name}) for user {current_user.id}")

            horse_id = str(new_horse.id)

            notification_repo = NotificationRepository(db)
            await notification_repo.create(
                user_id=current_user.id,
                notification_type=NotificationType.WELCOME_HORSE,
                title="🎁 Welcome Gift Received!",
                message=f"You received a free Level 1 horse: {new_horse.name}! Check your stable to start racing.",
                horse_id=new_horse.id
            )

        except Exception as e:
            logger.error(f"Failed to mint NFT for welcome box horse: {e}")
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create horse NFT"
            )

    elif reward.reward_type == RewardType.GOODLUCK.value:
        logger.info(f"Granting GoodLuck token to user {current_user.id}")
        current_user.goodluck_count += 1
        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)
        logger.info(f"User {current_user.id} now has {current_user.goodluck_count} GoodLuck tokens")

        notification_repo = NotificationRepository(db)
        await notification_repo.create(
            user_id=current_user.id,
            notification_type=NotificationType.GOODLUCK_RECEIVED,
            title="🍀 Good Luck Token Received!",
            message="You earned 1 Good Luck token! Use it in your next race to eliminate negative speed variations and boost your chances of winning.",
        )

    return ClaimRewardResponse(
        success=True,
        reward=RewardResponse(
            id=str(reward.id),
            user_id=str(reward.user_id),
            reward_type=reward.reward_type,
            claimed=reward.claimed,
            claimed_at=reward.claimed_at.isoformat() if reward.claimed_at else None,
            created_at=reward.created_at.isoformat()
        ),
        message=f"Successfully claimed {reward.reward_type} reward!" + (" Your new horse is ready!" if horse_id else ""),
        horse_id=horse_id
    )


@router.get("/check/{reward_type}", response_model=dict)
async def check_reward_eligibility(
    reward_type: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    try:
        reward_type_enum = RewardType(reward_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid reward type. Valid types: {[r.value for r in RewardType]}"
        )

    has_reward = await RewardService.has_reward(
        db=db,
        user_id=current_user.id,
        reward_type=reward_type_enum
    )

    return {
        "has_reward": has_reward,
        "reward_type": reward_type,
        "message": "Already received" if has_reward else "Eligible"
    }
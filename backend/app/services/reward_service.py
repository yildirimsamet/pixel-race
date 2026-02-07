
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_reward import UserReward, RewardType

logger = logging.getLogger(__name__)


class RewardService:


    @staticmethod
    async def grant_reward(
        db: AsyncSession,
        user_id: UUID,
        reward_type: RewardType,
        auto_claim: bool = False
    ) -> Optional[UserReward]:

        try:
            stmt = (
                select(UserReward)
                .where(
                    UserReward.user_id == user_id,
                    UserReward.reward_type == reward_type.value
                )
                .with_for_update()
            )
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()

            if existing:
                logger.warning(
                    f"Duplicate reward attempt blocked: user={user_id}, type={reward_type.value}"
                )
                return None

            reward = UserReward(
                user_id=user_id,
                reward_type=reward_type.value,
                claimed=auto_claim,
                claimed_at=datetime.utcnow() if auto_claim else None
            )

            db.add(reward)
            await db.commit()
            await db.refresh(reward)

            logger.info(
                f"Reward granted: user={user_id}, type={reward_type.value}, auto_claim={auto_claim}"
            )
            return reward

        except IntegrityError as e:
            await db.rollback()
            logger.error(
                f"IntegrityError when granting reward: user={user_id}, type={reward_type.value}, error={str(e)}"
            )
            return None

    @staticmethod
    async def claim_reward(
        db: AsyncSession,
        user_id: UUID,
        reward_id: UUID
    ) -> Optional[UserReward]:

        stmt = (
            select(UserReward)
            .where(
                UserReward.id == reward_id,
                UserReward.user_id == user_id,
                UserReward.claimed == False
            )
            .with_for_update()
        )
        result = await db.execute(stmt)
        reward = result.scalar_one_or_none()

        if not reward:
            logger.warning(
                f"Claim attempt failed: user={user_id}, reward_id={reward_id} (not found or already claimed)"
            )
            return None

        reward.claimed = True
        reward.claimed_at = datetime.utcnow()

        await db.commit()
        await db.refresh(reward)

        logger.info(
            f"Reward claimed: user={user_id}, reward_id={reward_id}, type={reward.reward_type}"
        )
        return reward

    @staticmethod
    async def get_user_rewards(
        db: AsyncSession,
        user_id: UUID,
        unclaimed_only: bool = False
    ) -> list[UserReward]:

        stmt = select(UserReward).where(UserReward.user_id == user_id)

        if unclaimed_only:
            stmt = stmt.where(UserReward.claimed == False)

        stmt = stmt.order_by(UserReward.created_at.desc())

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def has_reward(
        db: AsyncSession,
        user_id: UUID,
        reward_type: RewardType
    ) -> bool:

        stmt = select(UserReward).where(
            UserReward.user_id == user_id,
            UserReward.reward_type == reward_type.value
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none() is not None
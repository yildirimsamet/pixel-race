
import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, String, Boolean, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class RewardType(str, Enum):

    WELCOME_BOX = "welcome_box"
    GOODLUCK = "goodluck"
    DAILY_LOGIN = "daily_login"
    SPECIAL_EVENT = "special_event"


class UserReward(Base):


    __tablename__ = "user_rewards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reward_type = Column(String, nullable=False)
    claimed = Column(Boolean, default=False, nullable=False)
    claimed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="rewards")

    __table_args__ = (
        Index("ix_user_rewards_user_id", "user_id"),
        Index("ix_user_rewards_reward_type", "reward_type"),
        Index("ix_user_rewards_claimed", "claimed"),
        UniqueConstraint("user_id", "reward_type", name="uq_user_reward_type"),
    )

    def __repr__(self) -> str:

        return f"<UserReward(id={self.id}, user_id={self.user_id}, type={self.reward_type}, claimed={self.claimed})>"
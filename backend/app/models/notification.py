
from datetime import datetime
from enum import Enum
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class NotificationType(str, Enum):

    RACE_JOIN = "race_join"
    RACE_WIN = "race_win"           # User's horse won/placed (top 3)
    RACE_CANCELLED = "race_cancelled"
    REFUND = "refund"

    HORSE_FED = "horse_fed"
    HORSE_RESTED = "horse_rested"
    TRAIN_SUCCESS = "train_success"
    TRAIN_FAILED = "train_failed"

    HORSE_PURCHASED = "horse_purchased"

    GOODLUCK_USED = "goodluck_used"

    REWARD_CLAIMED = "reward_claimed"
    WELCOME_HORSE = "welcome_horse"
    GOODLUCK_RECEIVED = "goodluck_received"
    CONSOLATION_GOODLUCK = "consolation_goodluck"


class Notification(Base):

    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    race_id = Column(UUID(as_uuid=True), ForeignKey("races.id", ondelete="SET NULL"), nullable=True)
    horse_id = Column(UUID(as_uuid=True), ForeignKey("horses.id", ondelete="SET NULL"), nullable=True)

    amount_sol = Column(Float, nullable=True)
    transaction_signature = Column(String(255), nullable=True)

    is_read = Column(Boolean, default=False, nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    read_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="notifications")
    race = relationship("Race", foreign_keys=[race_id])
    horse = relationship("Horse", foreign_keys=[horse_id])

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type}, is_read={self.is_read})>"
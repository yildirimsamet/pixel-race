
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Index, String, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):


    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_address = Column(String, unique=True, nullable=False)
    wallet_connected_at = Column(DateTime, nullable=False)
    nonce = Column(String, nullable=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_bot = Column(Boolean, default=False, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False, index=True)
    goodluck_count = Column(Integer, default=0, nullable=False)

    horses = relationship("Horse", back_populates="owner", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    rewards = relationship("UserReward", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_wallet_address", "wallet_address"),
        Index("ix_users_created_at", "created_at"),
    )

    def __repr__(self) -> str:

        return f"<User(id={self.id}, wallet={self.wallet_address[:8]}...)>"
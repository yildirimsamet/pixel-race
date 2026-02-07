from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class ChatMessage(Base):

    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    race_id = Column(UUID(as_uuid=True), ForeignKey("races.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    message = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    race = relationship("Race", foreign_keys=[race_id])
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self) -> str:
        return f"<ChatMessage(id={self.id}, race_id={self.race_id}, user_id={self.user_id})>"

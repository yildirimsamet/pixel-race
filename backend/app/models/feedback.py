
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class FeedbackType(PyEnum):

    SUGGESTION = "SUGGESTION"
    BUG_REPORT = "BUG_REPORT"
    COMPLAINT = "COMPLAINT"
    QUESTION = "QUESTION"
    OTHER = "OTHER"


class FeedbackStatus(PyEnum):

    NEW = "NEW"
    REVIEWED = "REVIEWED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class Feedback(Base):


    __tablename__ = "feedbacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    type = Column(Enum(FeedbackType), nullable=False)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    email = Column(String(255), nullable=True)
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.NEW, nullable=False)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="feedbacks")

    __table_args__ = (
        Index("ix_feedbacks_type_status_created", "type", "status", "created_at"),
        Index("ix_feedbacks_status", "status"),
        Index("ix_feedbacks_created_at", "created_at"),
    )

    def __repr__(self) -> str:

        return f"<Feedback(id={self.id}, type={self.type.value}, status={self.status.value})>"
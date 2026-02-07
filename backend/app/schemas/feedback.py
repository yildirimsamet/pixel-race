
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.feedback import FeedbackStatus, FeedbackType


class FeedbackSubmit(BaseModel):

    type: FeedbackType
    subject: str = Field(..., max_length=200, min_length=1)
    message: str = Field(..., max_length=2000, min_length=10)
    email: Optional[EmailStr] = None


class FeedbackUpdate(BaseModel):

    status: Optional[FeedbackStatus] = None
    admin_notes: Optional[str] = Field(None, max_length=2000)


class FeedbackResponse(BaseModel):

    id: UUID
    user_id: Optional[UUID] = None
    type: FeedbackType
    subject: str
    message: str
    email: Optional[str] = None
    status: FeedbackStatus
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
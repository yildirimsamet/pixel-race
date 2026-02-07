from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional
import html
import re


class ChatMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=500, description="Chat message content")

    @field_validator('message')
    @classmethod
    def sanitize_message(cls, v: str) -> str:
        if not v:
            raise ValueError("Message cannot be empty")

        v = v.strip()

        v = html.escape(v)

        v = v.replace('\x00', '')

        v = re.sub(r'\n{3,}', '\n\n', v)

        if len(v) > 500:
            raise ValueError("Message too long")

        if len(v) == 0:
            raise ValueError("Message cannot be empty after sanitization")

        return v

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: UUID
    race_id: UUID
    user_id: Optional[UUID]
    message: str
    created_at: datetime

    user_wallet: Optional[str] = None

    class Config:
        from_attributes = True


class ChatMessageListResponse(BaseModel):
    messages: list[ChatMessageResponse]
    total: int
    page: int
    page_size: int
    has_more: bool

    class Config:
        from_attributes = True

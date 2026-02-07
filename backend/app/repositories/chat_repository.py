from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.logging_config import get_logger
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.repositories.base import BaseRepository

logger = get_logger(__name__)


class ChatRepository(BaseRepository[ChatMessage]):

    def __init__(self, db: AsyncSession):
        super().__init__(ChatMessage, db)

    async def get_messages_by_race(
        self,
        race_id: UUID,
        page: int = 1,
        page_size: int = 50,
        order_desc: bool = True
    ) -> Tuple[List[ChatMessage], int]:
        offset = (page - 1) * page_size

        query = (
            select(ChatMessage)
            .options(joinedload(ChatMessage.user))
            .where(ChatMessage.race_id == race_id)
        )

        if order_desc:
            query = query.order_by(ChatMessage.created_at.desc())
        else:
            query = query.order_by(ChatMessage.created_at.asc())

        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        messages = list(result.scalars().all())

        count_query = select(func.count()).select_from(ChatMessage).where(ChatMessage.race_id == race_id)
        count_result = await self.db.execute(count_query)
        total_count = count_result.scalar_one()

        logger.debug(
            f"Retrieved {len(messages)} messages for race {race_id} "
            f"(page {page}, total {total_count})"
        )

        return messages, total_count

    async def create_message(
        self,
        race_id: UUID,
        user_id: UUID,
        message: str
    ) -> ChatMessage:
        chat_message = await self.create(
            race_id=race_id,
            user_id=user_id,
            message=message
        )

        await self.db.refresh(chat_message, ["user"])

        logger.info(f"Created chat message {chat_message.id} for race {race_id} by user {user_id}")

        return chat_message

    async def get_recent_messages(
        self,
        race_id: UUID,
        limit: int = 50
    ) -> List[ChatMessage]:
        query = (
            select(ChatMessage)
            .options(joinedload(ChatMessage.user))
            .where(ChatMessage.race_id == race_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )

        result = await self.db.execute(query)
        messages = list(result.scalars().all())

        messages.reverse()

        logger.debug(f"Retrieved {len(messages)} recent messages for race {race_id}")

        return messages

    async def count_messages_by_race(self, race_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(ChatMessage).where(ChatMessage.race_id == race_id)
        )
        count = result.scalar_one()

        logger.debug(f"Race {race_id} has {count} total messages")

        return count

    async def delete_messages_by_race(self, race_id: UUID) -> int:
        from sqlalchemy import delete

        result = await self.db.execute(
            delete(ChatMessage).where(ChatMessage.race_id == race_id)
        )

        deleted_count = result.rowcount
        await self.db.flush()

        logger.info(f"Deleted {deleted_count} messages for race {race_id}")

        return deleted_count

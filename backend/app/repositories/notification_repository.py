
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType


class NotificationRepository:


    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        race_id: Optional[UUID] = None,
        horse_id: Optional[UUID] = None,
        amount_sol: Optional[float] = None,
        transaction_signature: Optional[str] = None
    ) -> Notification:

        notification = Notification(
            user_id=user_id,
            type=notification_type.value,
            title=title,
            message=message,
            race_id=race_id,
            horse_id=horse_id,
            amount_sol=amount_sol,
            transaction_signature=transaction_signature,
            is_read=False
        )
        self.db.add(notification)
        await self.db.flush()
        await self.db.refresh(notification)
        return notification

    async def get_by_id(self, notification_id: UUID) -> Optional[Notification]:

        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(
        self,
        user_id: UUID,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Notification]:

        query = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.is_read == False)

        query = query.order_by(Notification.created_at.desc()).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def mark_as_read(self, notification_id: UUID) -> Optional[Notification]:

        notification = await self.get_by_id(notification_id)
        if notification and not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            await self.db.flush()
            await self.db.refresh(notification)
        return notification

    async def mark_all_as_read(self, user_id: UUID) -> int:

        unread_notifications = await self.get_by_user_id(user_id, unread_only=True)
        count = 0
        for notification in unread_notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            count += 1
        await self.db.flush()
        return count

    async def count_unread(self, user_id: UUID) -> int:

        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.is_read == False)
        )
        return len(list(result.scalars().all()))

    async def delete(self, notification_id: UUID) -> bool:

        notification = await self.get_by_id(notification_id)
        if notification:
            await self.db.delete(notification)
            await self.db.flush()
            return True
        return False
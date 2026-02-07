
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.base import get_db
from app.models.notification import Notification
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationResponse(BaseModel):

    id: str
    type: str
    title: str
    message: str
    race_id: str | None
    horse_id: str | None
    amount_sol: float | None
    transaction_signature: str | None
    is_read: bool
    created_at: str
    read_at: str | None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, notification: Notification) -> "NotificationResponse":
        return cls(
            id=str(notification.id),
            type=notification.type,
            title=notification.title,
            message=notification.message,
            race_id=str(notification.race_id) if notification.race_id else None,
            horse_id=str(notification.horse_id) if notification.horse_id else None,
            amount_sol=notification.amount_sol,
            transaction_signature=notification.transaction_signature,
            is_read=notification.is_read,
            created_at=notification.created_at.isoformat(),
            read_at=notification.read_at.isoformat() if notification.read_at else None
        )


class UnreadCountResponse(BaseModel):

    unread_count: int


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    repo = NotificationRepository(db)
    notifications = await repo.get_by_user_id(
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit
    )
    return [NotificationResponse.from_orm(n) for n in notifications]


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    repo = NotificationRepository(db)
    count = await repo.count_unread(current_user.id)
    return UnreadCountResponse(unread_count=count)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    repo = NotificationRepository(db)

    notification = await repo.get_by_id(notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this notification"
        )

    notification = await repo.mark_as_read(notification_id)
    await db.commit()

    return NotificationResponse.from_orm(notification)


@router.post("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    repo = NotificationRepository(db)
    count = await repo.mark_all_as_read(current_user.id)
    await db.commit()

    return {"message": f"Marked {count} notifications as read"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    repo = NotificationRepository(db)

    notification = await repo.get_by_id(notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this notification"
        )

    await repo.delete(notification_id)
    await db.commit()

    return {"message": "Notification deleted"}
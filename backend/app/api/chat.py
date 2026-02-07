from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.logging_config import get_logger
from app.db.base import get_db
from app.models.race import Race
from app.models.user import User
from app.repositories.chat_repository import ChatRepository
from app.schemas.chat import ChatMessageCreate, ChatMessageListResponse, ChatMessageResponse

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get(
    "/races/{race_id}/messages",
    response_model=ChatMessageListResponse,
    status_code=status.HTTP_200_OK
)
async def get_race_messages(
    race_id: UUID,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(50, ge=1, le=100, description="Messages per page"),
    db: AsyncSession = Depends(get_db),
) -> ChatMessageListResponse:
    try:
        race = await db.get(Race, race_id)
        if not race:
            logger.warning(f"Attempted to get messages for non-existent race: {race_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race not found"
            )

        chat_repo = ChatRepository(db)
        messages, total_count = await chat_repo.get_messages_by_race(
            race_id=race_id,
            page=page,
            page_size=page_size,
            order_desc=False
        )

        has_more = (page * page_size) < total_count

        message_responses = []
        for msg in messages:
            message_responses.append(
                ChatMessageResponse(
                    id=msg.id,
                    race_id=msg.race_id,
                    user_id=msg.user_id,
                    message=msg.message,
                    created_at=msg.created_at,
                    user_wallet=msg.user.wallet_address if msg.user else None
                )
            )

        logger.debug(
            f"Retrieved {len(message_responses)} messages for race {race_id} "
            f"(page {page}/{(total_count + page_size - 1) // page_size})"
        )

        return ChatMessageListResponse(
            messages=message_responses,
            total=total_count,
            page=page,
            page_size=page_size,
            has_more=has_more
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages for race {race_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve messages"
        )


@router.post(
    "/races/{race_id}/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_race_message(
    race_id: UUID,
    message_data: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatMessageResponse:
    try:
        race = await db.get(Race, race_id)
        if not race:
            logger.warning(
                f"User {current_user.id} attempted to send message to non-existent race: {race_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race not found"
            )

        chat_repo = ChatRepository(db)
        chat_message = await chat_repo.create_message(
            race_id=race_id,
            user_id=current_user.id,
            message=message_data.message
        )

        await db.commit()

        logger.info(
            f"User {current_user.wallet_address} sent message {chat_message.id} to race {race_id}"
        )

        return ChatMessageResponse(
            id=chat_message.id,
            race_id=chat_message.race_id,
            user_id=chat_message.user_id,
            message=chat_message.message,
            created_at=chat_message.created_at,
            user_wallet=current_user.wallet_address
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error creating message for race {race_id} by user {current_user.id}: {e}",
            exc_info=True
        )
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )


@router.get(
    "/races/{race_id}/messages/recent",
    response_model=list[ChatMessageResponse],
    status_code=status.HTTP_200_OK
)
async def get_recent_race_messages(
    race_id: UUID,
    limit: int = Query(50, ge=1, le=100, description="Number of recent messages"),
    db: AsyncSession = Depends(get_db),
) -> list[ChatMessageResponse]:
    try:
        race = await db.get(Race, race_id)
        if not race:
            logger.warning(f"Attempted to get recent messages for non-existent race: {race_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race not found"
            )

        chat_repo = ChatRepository(db)
        messages = await chat_repo.get_recent_messages(race_id=race_id, limit=limit)

        message_responses = [
            ChatMessageResponse(
                id=msg.id,
                race_id=msg.race_id,
                user_id=msg.user_id,
                message=msg.message,
                created_at=msg.created_at,
                user_wallet=msg.user.wallet_address if msg.user else None
            )
            for msg in messages
        ]

        logger.debug(f"Retrieved {len(message_responses)} recent messages for race {race_id}")

        return message_responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recent messages for race {race_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recent messages"
        )

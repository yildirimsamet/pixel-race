
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user_optional
from app.core.logging_config import get_logger
from app.db.base import get_db
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackResponse, FeedbackSubmit
from app.services.logging_service import LogAction, LogLevel, LogStep, logging_service

logger = get_logger(__name__)

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("/submit", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    request: Request,
    feedback_data: FeedbackSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> FeedbackResponse:

    request_id = getattr(request.state, 'request_id', None)
    user_id = current_user.id if current_user else None
    wallet_address = current_user.wallet_address if current_user else None

    try:
        feedback = Feedback(
            user_id=user_id,
            type=feedback_data.type,
            subject=feedback_data.subject,
            message=feedback_data.message,
            email=feedback_data.email,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(feedback)
        await db.commit()
        await db.refresh(feedback)

        logger.info(
            f"Feedback submitted: {feedback.id} - {feedback.type.value} - {feedback.subject}"
        )

        return FeedbackResponse.model_validate(feedback)

    except Exception as e:
        logger.error(f"Error submitting feedback: {e}", exc_info=True)

        await logging_service.log_action(
            user_id=user_id,
            action=LogAction.SUBMIT_FEEDBACK,
            step=LogStep.ERROR,
            level=LogLevel.ERROR,
            message=f"Failed to submit feedback: {str(e)}",
            metadata={"error": str(e)},
            request_id=request_id,
            wallet_address=wallet_address,
        )

        raise
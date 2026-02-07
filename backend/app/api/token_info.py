
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from app.db.base import get_db
from app.models.token_info import TokenInfo
from app.schemas.token_info import TokenInfoResponse

logger = get_logger(__name__)
router = APIRouter(prefix="/token", tags=["token"])


@router.get("/info", response_model=TokenInfoResponse)
async def get_token_info(
    db: AsyncSession = Depends(get_db),
) -> TokenInfoResponse:

    result = await db.execute(select(TokenInfo).limit(1))
    token_info = result.scalar_one_or_none()

    if not token_info:
        raise HTTPException(
            status_code=404,
            detail="Token information not configured yet"
        )

    return TokenInfoResponse.model_validate(token_info)

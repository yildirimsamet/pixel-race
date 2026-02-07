
from uuid import UUID
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.core.logging_config import get_logger
from app.db.base import get_db
from app.models.race import RaceStatus
from app.models.user import User
from app.repositories.horse_repository import HorseRepository
from app.repositories.race_repository import RaceRepository, RaceResultRepository
from app.services.solana_service import SolanaService

logger = get_logger(__name__)
router = APIRouter(prefix="/goodluck", tags=["goodluck"])

solana_service = SolanaService()


class BuyGoodLuckRequest(BaseModel):

    transaction_signature: str = Field(..., description="Solana transaction signature for payment")
    quantity: int = Field(..., ge=1, le=100, description="Number of GoodLuck tokens to purchase")


class BuyGoodLuckResponse(BaseModel):

    goodluck_count: int
    message: str
    quantity_purchased: int
    total_cost_sol: float


class UseGoodLuckRequest(BaseModel):

    horse_id: UUID = Field(..., description="Horse ID to apply GoodLuck boost")


class UseGoodLuckResponse(BaseModel):

    success: bool
    remaining_goodluck: int
    message: str


@router.post("/buy", response_model=BuyGoodLuckResponse)
async def buy_goodluck(
    request: BuyGoodLuckRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BuyGoodLuckResponse:

    logger.info(f"User {current_user.wallet_address} purchasing {request.quantity} GoodLuck tokens")

    try:
        from app.core import game_config
        total_cost_sol = request.quantity * game_config.get_goodluck_price()

        treasury_wallet = settings.TREASURY_WALLET_ADDRESS
        if not treasury_wallet:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Treasury wallet not configured"
            )

        is_valid = await solana_service.verify_transaction(
            tx_signature=request.transaction_signature,
            from_wallet=current_user.wallet_address,
            to_wallet=treasury_wallet,
            expected_amount_sol=total_cost_sol,
            tolerance_sol=0.005
        )

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transaction verification failed. Please ensure payment was sent correctly."
            )

        current_user.goodluck_count += request.quantity
        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)

        logger.info(
            f"GoodLuck purchase successful: {current_user.wallet_address} "
            f"bought {request.quantity} tokens for {total_cost_sol} SOL"
        )

        return BuyGoodLuckResponse(
            goodluck_count=current_user.goodluck_count,
            message=f"Successfully purchased {request.quantity} GoodLuck token(s)",
            quantity_purchased=request.quantity,
            total_cost_sol=total_cost_sol
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error purchasing GoodLuck: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process GoodLuck purchase"
        )


@router.post("/races/{race_id}/use", response_model=UseGoodLuckResponse)
async def use_goodluck_on_race(
    race_id: UUID,
    request: UseGoodLuckRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UseGoodLuckResponse:

    logger.info(
        f"User {current_user.wallet_address} using GoodLuck on race {race_id} "
        f"for horse {request.horse_id}"
    )

    try:
        race_repo = RaceRepository(db)
        result_repo = RaceResultRepository(db)
        horse_repo = HorseRepository(db)

        race = await race_repo.get_by_id(str(race_id))
        if not race:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race not found"
            )

        if race.status != RaceStatus.waiting:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot use GoodLuck on race with status '{race.status.value}'. Race must be in 'waiting' status."
            )

        if current_user.goodluck_count <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient GoodLuck tokens. Purchase tokens first."
            )

        horse = await horse_repo.get_by_id(str(request.horse_id))
        if not horse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Horse not found"
            )

        if horse.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't own this horse"
            )

        race_result = await result_repo.get_by_race_and_horse(str(race_id), str(request.horse_id))
        if not race_result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Horse is not registered in this race"
            )

        if race_result.goodluck_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GoodLuck already used for this race entry"
            )

        race_result.goodluck_used = True
        current_user.goodluck_count -= 1
        db.add(race_result)
        db.add(current_user)

        from app.repositories.notification_repository import NotificationRepository
        from app.models.notification import NotificationType

        notification_repo = NotificationRepository(db)
        await notification_repo.create(
            user_id=current_user.id,
            notification_type=NotificationType.GOODLUCK_USED,
            title=f"🍀 Good Luck Activated for {horse.name}!",
            message=f"Good Luck token has been applied to {horse.name} in Race #{str(race_id)[:8]}... This will eliminate negative speed variations during the race!",
            race_id=race_id,
            horse_id=request.horse_id
        )

        await db.commit()
        await db.refresh(current_user)
        await db.refresh(race_result)

        logger.info(
            f"🍀 GoodLuck applied: {current_user.wallet_address} on race {race_id} "
            f"for horse {request.horse_id}"
        )

        try:
            from app.utils.wallet_utils import slice_wallet_address

            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{settings.SOCKET_SERVER_URL}/broadcast/goodluck-used",
                    json={
                        "race_id": str(race_id),
                        "horse_id": str(request.horse_id),
                        "horse_name": horse.name,
                        "wallet_address": slice_wallet_address(current_user.wallet_address),
                    }
                )
        except Exception as e:
            logger.warning(f"Failed to broadcast GoodLuck usage: {e}")

        return UseGoodLuckResponse(
            success=True,
            remaining_goodluck=current_user.goodluck_count,
            message=f"GoodLuck applied to horse {horse.name} for this race"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error using GoodLuck: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to apply GoodLuck"
        )


@router.get("/balance")
async def get_goodluck_balance(
    current_user: User = Depends(get_current_user),
) -> dict:

    from app.core import game_config
    return {
        "goodluck_count": current_user.goodluck_count,
        "price_per_token_sol": game_config.get_goodluck_price(),
        "wallet_address": current_user.wallet_address
    }
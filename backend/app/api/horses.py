
import os
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    get_current_user,
    get_buy_horse_use_case,
    get_feed_horse_use_case,
    get_rest_horse_use_case,
    get_train_horse_use_case
)
from app.application.horse.buy_horse_use_case import BuyHorseCommand, BuyHorseUseCase
from app.application.horse.feed_horse_use_case import FeedHorseCommand, FeedHorseUseCase
from app.application.horse.rest_horse_use_case import RestHorseCommand, RestHorseUseCase
from app.application.horse.train_horse_use_case import TrainHorseCommand, TrainHorseUseCase
from app.core.rate_limiter import rate_limit_dependency
from app.core.exceptions import NotFoundError, AuthorizationError, ValidationError
from app.core.logging_config import get_logger
from app.db.base import get_db
from app.models.horse import Horse
from app.models.horse_stats import HorseStats
from app.models.user import User
from app.repositories.horse_repository import HorseRepository
from app.schemas import (
    HorseBoxBuy,
    HorseResponse,
    HorseStatsDetailResponse,
    TransactionSignature,
    HorseStatsResponse,
    TrainResponse,
)
import random

logger = get_logger(__name__)
router = APIRouter(prefix="/horses", tags=["horses"])


@router.get("/", response_model=List[HorseResponse])
async def get_user_horses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[HorseResponse]:

    logger.info(f"Fetching horses for user {current_user.id}")

    horse_repo = HorseRepository(db)
    horses = await horse_repo.get_by_user_id(current_user.id)

    logger.debug(f"Found {len(horses)} horses for user {current_user.id}")
    return [HorseResponse.model_validate(horse) for horse in horses]


@router.get("/boxes/can-buy")
async def can_buy_horse_box(
    max_level: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:

    logger.info(
        f"User {current_user.id} checking if can buy horse box with max_level {max_level}"
    )

    if max_level not in [1, 2, 3]:
        logger.debug(f"Invalid max_level {max_level} requested")
        return {
            "can_buy": False,
            "reason": "Invalid max_level. Must be 1, 2, or 3"
        }

    from app.core.config import settings
    treasury_wallet = settings.TREASURY_WALLET_ADDRESS
    if not treasury_wallet:
        logger.error("TREASURY_WALLET_ADDRESS not configured in environment")
        return {
            "can_buy": False,
            "reason": "Treasury wallet not configured"
        }

    from app.core import game_config
    required_sol = game_config.get_horse_price(max_level)

    logger.debug(f"Horse box validation passed for user {current_user.id}")

    return {
        "can_buy": True,
        "price_sol": required_sol
    }


@router.post("/boxes/buy", status_code=status.HTTP_201_CREATED, dependencies=[Depends(rate_limit_dependency)])
async def buy_horse_box(
    request: Request,
    box_data: HorseBoxBuy,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    buy_horse_use_case: BuyHorseUseCase = Depends(get_buy_horse_use_case)
) -> dict:

    request_id = getattr(request.state, 'request_id', None)

    command = BuyHorseCommand(
        max_level=box_data.max_level,
        transaction_signature=box_data.transaction_signature,
        user_id=current_user.id,
        user_wallet=current_user.wallet_address,
        request_id=request_id
    )

    result = await buy_horse_use_case.execute(db, command)

    return {
        "horse": HorseResponse.model_validate(result.horse),
        "nft_mint": result.nft_mint,
        "metadata_uri": result.metadata_uri,
        "metadata_gateway_url": result.metadata_gateway_url,
        "explorer_url": result.explorer_url,
        "message": result.message,
        "transaction_signature": result.transaction_signature
    }


@router.get("/{horse_id}/stats", response_model=HorseStatsDetailResponse)
async def get_horse_stats(
    horse_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HorseStatsDetailResponse:

    logger.info(f"User {current_user.id} fetching stats for horse {horse_id}")

    result = await db.execute(select(Horse).where(Horse.id == horse_id))
    horse = result.scalar_one_or_none()

    if not horse:
        logger.warning(f"Horse {horse_id} not found")
        raise NotFoundError("Horse")

    if horse.user_id != current_user.id:
        logger.warning(
            f"User {current_user.id} attempted to view stats for horse {horse_id} owned by {horse.user_id}"
        )
        raise AuthorizationError("You do not own this horse")

    result = await db.execute(select(HorseStats).where(HorseStats.horse_id == horse.id))
    stats = result.scalar_one_or_none()

    if not stats:
        logger.warning(f"Stats not initialized for horse {horse_id}")
        raise NotFoundError("Horse stats not initialized")

    horse_repo = HorseRepository(db)
    computed_stats = await horse_repo.get_horse_statistics(horse.id)

    win_rate = (
        round((computed_stats["total_wins"] / computed_stats["total_races"] * 100), 2)
        if computed_stats["total_races"] > 0 else 0.0
    )
    average_earnings = (
        round(computed_stats["total_earnings"] / computed_stats["total_races"], 2)
        if computed_stats["total_races"] > 0 else 0.0
    )

    logger.debug(f"Retrieved stats for horse {horse_id}")

    return HorseStatsDetailResponse(
        base_stats={
            "name": horse.name,
            "age": horse.age,
            "color": horse.color,
            "birthdate": horse.birthdate.isoformat(),
        },
        dynamic_stats={
            "weight": stats.weight,
            "determination": stats.determination,
            "satiety": stats.satiety,
            "energy": stats.energy,
            "bond": stats.bond,
            "fame": stats.fame,
            "instinct": stats.instinct,
            "level": stats.level,
            "speed_score": stats.speed_score,
        },
        performance={
            "total_races": computed_stats["total_races"],
            "total_wins": computed_stats["total_wins"],
            "win_rate": round(win_rate, 2),
            "total_earnings": computed_stats["total_earnings"],
            "average_earnings": round(average_earnings, 2),
        },
    )


@router.post("/{horse_id}/feed", response_model=HorseStatsResponse)
async def feed_horse(
    horse_id: UUID,
    tx_data: TransactionSignature,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    feed_horse_use_case: FeedHorseUseCase = Depends(get_feed_horse_use_case)
) -> HorseStatsResponse:

    command = FeedHorseCommand(
        horse_id=horse_id,
        user_id=current_user.id,
        user_wallet=current_user.wallet_address,
        transaction_signature=tx_data.transaction_signature
    )

    result = await feed_horse_use_case.execute(db, command)

    return HorseStatsResponse.model_validate(result.stats)


@router.post("/{horse_id}/rest", response_model=HorseStatsResponse)
async def rest_horse(
    horse_id: UUID,
    tx_data: TransactionSignature,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    rest_horse_use_case: RestHorseUseCase = Depends(get_rest_horse_use_case)
) -> HorseStatsResponse:

    command = RestHorseCommand(
        horse_id=horse_id,
        user_id=current_user.id,
        user_wallet=current_user.wallet_address,
        transaction_signature=tx_data.transaction_signature
    )

    result = await rest_horse_use_case.execute(db, command)

    return HorseStatsResponse.model_validate(result.stats)


@router.post("/{horse_id}/train", response_model=TrainResponse)
async def train_horse(
    horse_id: UUID,
    tx_data: TransactionSignature,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    train_horse_use_case: TrainHorseUseCase = Depends(get_train_horse_use_case)
) -> TrainResponse:

    command = TrainHorseCommand(
        horse_id=horse_id,
        user_id=current_user.id,
        user_wallet=current_user.wallet_address,
        transaction_signature=tx_data.transaction_signature
    )

    result = await train_horse_use_case.execute(db, command)

    return TrainResponse(
        success=result.success,
        old_determination=result.old_determination,
        new_determination=result.new_determination,
        message=result.message
    )



from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_user, get_admin_user
from app.core.logging_config import get_logger
from app.db.base import get_db
from app.models.user import User
from app.models.race import RaceResult, Race
from app.models.horse import Horse
from app.schemas import UserResponse
from app.services.solana_service import SolanaService

logger = get_logger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


class SetAdminRequest(BaseModel):

    is_admin: bool


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)) -> UserResponse:

    logger.debug(f"Fetching profile for user: {current_user.id}")
    return UserResponse.model_validate(current_user)


@router.get("/me/sol-balance")
async def get_sol_balance(current_user: User = Depends(get_current_user)) -> dict:

    logger.info(f"Fetching SOL balance for wallet: {current_user.wallet_address}")

    solana = SolanaService()
    balance = solana.get_wallet_balance(current_user.wallet_address)

    return {"sol_balance": balance, "wallet": current_user.wallet_address}


@router.get("/me/transactions")
async def get_transaction_history(
    limit: int = Query(default=50, ge=1, le=200, description="Number of transactions to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:

    logger.info(f"Fetching transaction history for user: {current_user.id}")

    horses_query = select(Horse).where(Horse.user_id == current_user.id)
    horses_result = await db.execute(horses_query)
    user_horses = horses_result.scalars().all()
    user_horse_ids = [h.id for h in user_horses]

    if not user_horse_ids:
        return {
            "transactions": [],
            "total_count": 0,
            "wallet_address": current_user.wallet_address
        }

    results_query = (
        select(RaceResult)
        .where(RaceResult.horse_id.in_(user_horse_ids))
        .options(
            selectinload(RaceResult.race),
            selectinload(RaceResult.horse)
        )
        .order_by(RaceResult.created_at.desc())
        .limit(limit)
    )

    results_result = await db.execute(results_query)
    race_results = results_result.scalars().all()

    transactions = []

    for result in race_results:
        if result.entry_tx_signature:
            transactions.append({
                "type": "race_entry",
                "signature": result.entry_tx_signature,
                "amount_sol": -result.race.entry_fee,
                "horse_name": result.horse.name,
                "horse_id": str(result.horse_id),
                "race_id": str(result.race_id),
                "race_level": result.race.level_requirement,
                "timestamp": result.created_at.isoformat(),
                "explorer_url": f"https://explorer.solana.com/tx/{result.entry_tx_signature}?cluster=devnet"
            })

        if result.reward_tx_signature and result.reward_amount > 0:
            transactions.append({
                "type": "race_reward",
                "signature": result.reward_tx_signature,
                "amount_sol": result.reward_amount,
                "horse_name": result.horse.name,
                "horse_id": str(result.horse_id),
                "race_id": str(result.race_id),
                "race_level": result.race.level_requirement,
                "finish_position": result.finish_position,
                "timestamp": result.created_at.isoformat(),
                "explorer_url": f"https://explorer.solana.com/tx/{result.reward_tx_signature}?cluster=devnet"
            })

    transactions.sort(key=lambda x: x["timestamp"], reverse=True)

    return {
        "transactions": transactions[:limit],
        "total_count": len(transactions),
        "wallet_address": current_user.wallet_address
    }


@router.post("/{user_id}/set-admin")
async def set_admin_status(
    user_id: UUID,
    request: SetAdminRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:

    logger.info(
        f"Admin {current_user.id} ({current_user.wallet_address}) "
        f"setting is_admin={request.is_admin} for user {user_id}"
    )

    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()

    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )

    target_user.is_admin = request.is_admin
    await db.commit()
    await db.refresh(target_user)

    action = "granted" if request.is_admin else "revoked"
    logger.info(
        f"Admin privileges {action} for user {target_user.id} "
        f"({target_user.wallet_address})"
    )

    return {
        "user_id": str(target_user.id),
        "wallet_address": target_user.wallet_address,
        "is_admin": target_user.is_admin,
        "updated_by": str(current_user.id)
    }
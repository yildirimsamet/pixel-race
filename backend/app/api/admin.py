
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_admin_user
from app.core.logging_config import get_logger
from app.db.base import get_db
from app.models.feedback import Feedback, FeedbackStatus, FeedbackType
from app.models.horse import Horse
from app.models.horse_stats import HorseStats
from app.models.race import Race, RaceResult, RaceStatus
from app.models.token_info import TokenInfo
from app.models.user import User
from app.schemas.feedback import FeedbackResponse, FeedbackUpdate
from app.schemas.token_info import TokenInfoResponse, TokenInfoUpdate
from app.services.logging_service import LogLevel, logging_service

logger = get_logger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/logs/{user_id}")
async def get_user_logs(
    user_id: UUID,
    limit: int = Query(default=100, ge=1, le=500),
    action_filter: Optional[str] = None,
    level_filter: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
):

    logger.info(
        f"Admin {current_user.id} fetching logs for user {user_id} "
        f"(limit={limit}, action={action_filter}, level={level_filter})"
    )

    logs = await logging_service.get_user_logs(
        user_id=user_id,
        limit=limit,
        action_filter=action_filter,
        level_filter=level_filter,
    )

    return {
        "user_id": str(user_id),
        "logs_count": len(logs),
        "filters": {
            "action": action_filter,
            "level": level_filter,
            "limit": limit,
        },
        "logs": logs,
    }


@router.get("/logs/errors/recent")
async def get_recent_errors(
    limit: int = Query(default=50, ge=1, le=200),
    hours: int = Query(default=24, ge=1, le=168),
    current_user: User = Depends(get_admin_user),
):

    logger.info(
        f"Admin {current_user.id} fetching recent errors "
        f"(limit={limit}, hours={hours})"
    )

    errors = await logging_service.get_recent_errors(limit=limit, hours=hours)

    return {
        "errors_count": len(errors),
        "period_hours": hours,
        "errors": errors,
    }


@router.get("/logs/errors/backend")
async def get_backend_errors(
    limit: int = Query(default=100, ge=1, le=500),
    hours: int = Query(default=24, ge=1, le=168),
    severity_filter: Optional[str] = Query(default=None, regex="^(ERROR|CRITICAL|WARNING)$"),
    error_type_filter: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
):

    logger.info(
        f"Admin {current_user.id} fetching backend errors "
        f"(limit={limit}, hours={hours}, severity={severity_filter}, type={error_type_filter})"
    )

    errors = await logging_service.get_error_logs(
        limit=limit,
        hours=hours,
        severity_filter=severity_filter,
        error_type_filter=error_type_filter,
    )

    return {
        "errors_count": len(errors),
        "period_hours": hours,
        "filters": {
            "severity": severity_filter,
            "error_type": error_type_filter,
        },
        "errors": errors,
    }


@router.get("/logs/request/{request_id}")
async def get_request_logs(
    request_id: UUID,
    current_user: User = Depends(get_admin_user),
):

    logger.info(f"Admin {current_user.id} fetching request trace {request_id}")

    logs = await logging_service.get_logs_by_request_id(request_id=request_id)

    return {
        "request_id": str(request_id),
        "logs_count": len(logs),
        "logs": logs,
    }


@router.get("/stats/{action}")
async def get_action_stats(
    action: str,
    hours: int = Query(default=24, ge=1, le=168),
    current_user: User = Depends(get_admin_user),
):

    logger.info(
        f"Admin {current_user.id} fetching stats for action {action} "
        f"(hours={hours})"
    )

    stats = await logging_service.get_action_stats(action=action, hours=hours)

    return stats




@router.get("/feedback", response_model=List[FeedbackResponse])
async def list_feedback(
    request: Request,
    status_filter: Optional[FeedbackStatus] = None,
    type_filter: Optional[FeedbackType] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
) -> List[FeedbackResponse]:

    logger.info(
        f"Admin {admin_user.wallet_address} listing feedback "
        f"(status={status_filter}, type={type_filter}, limit={limit})"
    )

    query = select(Feedback).order_by(Feedback.created_at.desc())

    if status_filter:
        query = query.where(Feedback.status == status_filter)
    if type_filter:
        query = query.where(Feedback.type == type_filter)

    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    feedbacks = result.scalars().all()

    return [FeedbackResponse.model_validate(f) for f in feedbacks]


@router.patch("/feedback/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    request: Request,
    feedback_id: str,
    feedback_update: FeedbackUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
) -> FeedbackResponse:

    try:
        feedback_uuid = UUID(feedback_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid feedback ID format")

    result = await db.execute(
        select(Feedback).where(Feedback.id == feedback_uuid)
    )
    feedback = result.scalar_one_or_none()

    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if feedback_update.status is not None:
        feedback.status = feedback_update.status
    if feedback_update.admin_notes is not None:
        feedback.admin_notes = feedback_update.admin_notes

    feedback.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(feedback)

    logger.info(
        f"Admin {admin_user.wallet_address} updated feedback {feedback_id} "
        f"(status={feedback.status.value})"
    )

    return FeedbackResponse.model_validate(feedback)




@router.get("/dashboard/stats")
async def get_dashboard_stats(
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):

    logger.info(f"Admin {admin_user.wallet_address} fetching dashboard stats")

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = now - timedelta(days=7)

    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar()

    new_today_result = await db.execute(
        select(func.count(User.id)).where(User.created_at >= today_start)
    )
    new_today = new_today_result.scalar()

    new_week_result = await db.execute(
        select(func.count(User.id)).where(User.created_at >= week_start)
    )
    new_week = new_week_result.scalar()

    total_horses_result = await db.execute(select(func.count(Horse.id)))
    total_horses = total_horses_result.scalar()

    nft_minted_result = await db.execute(
        select(func.count(Horse.id)).where(Horse.nft_mint_address.isnot(None))
    )
    nft_minted = nft_minted_result.scalar()

    in_race_result = await db.execute(
        select(func.count(Horse.id)).where(Horse.in_race == True)
    )
    in_race = in_race_result.scalar()

    total_races_result = await db.execute(select(func.count(Race.id)))
    total_races = total_races_result.scalar()

    active_races_result = await db.execute(
        select(func.count(Race.id)).where(
            Race.status.in_([RaceStatus.waiting, RaceStatus.racing])
        )
    )
    active_races = active_races_result.scalar()

    completed_today_result = await db.execute(
        select(func.count(Race.id)).where(
            Race.status == RaceStatus.done,
            Race.created_at >= today_start
        )
    )
    completed_today = completed_today_result.scalar()

    total_prize_pool_result = await db.execute(
        select(func.sum(Race.prize_pool_sol)).where(
            Race.status.in_([RaceStatus.waiting, RaceStatus.racing])
        )
    )
    total_prize_pool = total_prize_pool_result.scalar() or 0.0

    total_feedback_result = await db.execute(select(func.count(Feedback.id)))
    total_feedback = total_feedback_result.scalar()

    unreviewed_result = await db.execute(
        select(func.count(Feedback.id)).where(Feedback.status == FeedbackStatus.NEW)
    )
    unreviewed = unreviewed_result.scalar()

    feedback_by_type = {}
    for feedback_type in FeedbackType:
        count_result = await db.execute(
            select(func.count(Feedback.id)).where(Feedback.type == feedback_type)
        )
        feedback_by_type[feedback_type.value] = count_result.scalar()

    return {
        "total_users": total_users,
        "new_users_today": new_today,
        "new_users_this_week": new_week,
        "total_horses": total_horses,
        "horses_nft_minted": nft_minted,
        "horses_in_race": in_race,
        "total_races": total_races,
        "active_races": active_races,
        "completed_races_today": completed_today,
        "total_prize_pool_sol": float(total_prize_pool),
        "total_feedback": total_feedback,
        "unreviewed_feedback": unreviewed,
        "feedback_by_type": feedback_by_type,
    }


@router.get("/dashboard/activity")
async def get_recent_activity(
    request: Request,
    hours: int = Query(24, ge=1, le=168),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):

    logger.info(
        f"Admin {admin_user.wallet_address} fetching recent activity "
        f"(hours={hours}, limit={limit})"
    )

    cutoff = datetime.utcnow() - timedelta(hours=hours)

    recent_users_result = await db.execute(
        select(User)
        .where(User.created_at >= cutoff)
        .order_by(User.created_at.desc())
        .limit(limit)
    )
    recent_users = recent_users_result.scalars().all()

    recent_horses_result = await db.execute(
        select(Horse)
        .where(Horse.created_at >= cutoff)
        .order_by(Horse.created_at.desc())
        .limit(limit)
    )
    recent_horses = recent_horses_result.scalars().all()

    recent_races_result = await db.execute(
        select(Race)
        .where(Race.created_at >= cutoff)
        .order_by(Race.created_at.desc())
        .limit(limit)
    )
    recent_races = recent_races_result.scalars().all()

    recent_errors = []
    try:
        if logging_service.enabled:
            cursor = logging_service.db[logging_service.collection_name].find(
                {
                    "level": LogLevel.ERROR,
                    "timestamp": {"$gte": cutoff},
                }
            ).sort("timestamp", -1).limit(limit)

            async for log in cursor:
                log["_id"] = str(log["_id"])
                if "user_id" in log and log["user_id"]:
                    log["user_id"] = str(log["user_id"])
                recent_errors.append(log)
    except Exception as e:
        logger.error(f"Failed to fetch recent errors from MongoDB: {e}")

    from app.utils.wallet_utils import slice_wallet_address

    recent_users_with_counts = []
    for u in recent_users:
        horse_count_result = await db.execute(
            select(func.count(Horse.id)).where(Horse.user_id == u.id)
        )
        horse_count = horse_count_result.scalar()
        recent_users_with_counts.append({
            "id": str(u.id),
            "wallet_address": slice_wallet_address(u.wallet_address),
            "created_at": u.created_at.isoformat(),
            "is_bot": u.is_bot,
            "horse_count": horse_count,
        })

    recent_horses_with_owner = []
    for h in recent_horses:
        owner_result = await db.execute(
            select(User.wallet_address).where(User.id == h.user_id)
        )
        owner_wallet = owner_result.scalar()

        stats_result = await db.execute(
            select(HorseStats.level).where(HorseStats.horse_id == h.id)
        )
        level = stats_result.scalar() or 1

        recent_horses_with_owner.append({
            "id": str(h.id),
            "name": h.name,
            "color": h.color,
            "level": level,
            "created_at": h.created_at.isoformat(),
            "nft_mint_address": h.nft_mint_address,
            "owner_wallet": slice_wallet_address(owner_wallet) if owner_wallet else "Unknown",
        })

    recent_races_with_winner = []
    for r in recent_races:
        winner_name = None

        if r.status == RaceStatus.done:
            winner_result = await db.execute(
                select(Horse.name)
                .join(RaceResult, RaceResult.horse_id == Horse.id)
                .where(
                    RaceResult.race_id == r.id,
                    RaceResult.finish_position == 1
                )
            )
            winner_name = winner_result.scalar()

        recent_races_with_winner.append({
            "id": str(r.id),
            "status": r.status.value,
            "level_requirement": r.level_requirement,
            "entry_fee": float(r.entry_fee),
            "prize_pool_sol": float(r.prize_pool_sol),
            "created_at": r.created_at.isoformat(),
            "winner_horse_name": winner_name,
        })

    return {
        "recent_users": recent_users_with_counts,
        "recent_horses": recent_horses_with_owner,
        "recent_races": recent_races_with_winner,
        "recent_errors": recent_errors,
    }


@router.get("/dashboard/transactions")
async def get_transaction_metrics(
    request: Request,
    hours: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):

    logger.info(
        f"Admin {admin_user.wallet_address} fetching transaction metrics "
        f"(hours={hours})"
    )

    cutoff = datetime.utcnow() - timedelta(hours=hours)

    horses_created_result = await db.execute(
        select(func.count(Horse.id)).where(Horse.created_at >= cutoff)
    )
    horses_created = horses_created_result.scalar()

    horse_purchase_volume = horses_created * 1.5

    race_entries_result = await db.execute(
        select(func.count(RaceResult.id)).where(RaceResult.created_at >= cutoff)
    )
    race_entries = race_entries_result.scalar()

    entry_volume_result = await db.execute(
        select(func.sum(Race.entry_fee))
        .join(RaceResult, RaceResult.race_id == Race.id)
        .where(RaceResult.created_at >= cutoff)
    )
    race_entry_volume = entry_volume_result.scalar() or 0.0

    prizes_count_result = await db.execute(
        select(func.count(RaceResult.id)).where(
            RaceResult.reward_amount > 0,
            RaceResult.created_at >= cutoff
        )
    )
    prizes_count = prizes_count_result.scalar()

    prizes_volume_result = await db.execute(
        select(func.sum(RaceResult.reward_amount)).where(
            RaceResult.reward_amount > 0,
            RaceResult.created_at >= cutoff
        )
    )
    prizes_volume = prizes_volume_result.scalar() or 0.0

    failed_transactions = 0
    try:
        if logging_service.enabled:
            failed_count = await logging_service.db[logging_service.collection_name].count_documents(
                {
                    "level": LogLevel.ERROR,
                    "action": {"$in": ["BUY_HORSE", "JOIN_RACE", "TRANSFER_SOL"]},
                    "timestamp": {"$gte": cutoff},
                }
            )
            failed_transactions = failed_count
    except Exception as e:
        logger.error(f"Failed to fetch failed transactions from MongoDB: {e}")

    return {
        "total_volume_24h": float(horse_purchase_volume + race_entry_volume),
        "horse_purchases": {
            "count": horses_created,
            "volume": float(horse_purchase_volume),
        },
        "race_entries": {
            "count": race_entries,
            "volume": float(race_entry_volume),
        },
        "prizes_distributed": {
            "count": prizes_count,
            "volume": float(prizes_volume),
        },
        "failed_transactions": failed_transactions,
    }


@router.get("/dashboard/performance")
async def get_performance_metrics(
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):

    logger.info(f"Admin {admin_user.wallet_address} fetching performance metrics")

    error_rate_percent = 0.0
    avg_response_time_ms = 0.0
    try:
        if logging_service.enabled:
            cutoff = datetime.utcnow() - timedelta(hours=1)

            total_requests = await logging_service.db[logging_service.collection_name].count_documents(
                {"timestamp": {"$gte": cutoff}}
            )

            error_requests = await logging_service.db[logging_service.collection_name].count_documents(
                {
                    "level": LogLevel.ERROR,
                    "timestamp": {"$gte": cutoff},
                }
            )

            if total_requests > 0:
                error_rate_percent = (error_requests / total_requests) * 100

    except Exception as e:
        logger.error(f"Failed to calculate error rate from MongoDB: {e}")

    active_races_result = await db.execute(
        select(func.count(Race.id)).where(
            Race.status.in_([RaceStatus.waiting, RaceStatus.racing])
        )
    )
    active_races = active_races_result.scalar()

    from app.db.base import engine
    pool_status = {
        "size": engine.pool.size(),
        "checked_in": engine.pool.checkedin(),
        "checked_out": engine.pool.checkedout(),
        "overflow": engine.pool.overflow(),
    }

    mongodb_connected = logging_service.enabled

    throttle_stats = logging_service.get_throttle_stats()

    return {
        "avg_response_time_ms": avg_response_time_ms,
        "error_rate_percent": round(error_rate_percent, 2),
        "active_races": active_races,
        "database_connection_pool": pool_status,
        "mongodb_connection": mongodb_connected,
        "error_throttle": throttle_stats,
    }


@router.get("/logs/throttle-stats")
async def get_throttle_statistics(
    current_user: User = Depends(get_admin_user),
):

    logger.info(f"Admin {current_user.id} fetching throttle statistics")

    stats = logging_service.get_throttle_stats()

    from app.core.config import settings

    return {
        "current_stats": stats,
        "configuration": {
            "max_errors_per_minute": settings.LOG_MAX_ERRORS_PER_MINUTE,
            "dedupe_window_seconds": settings.LOG_DEDUPE_WINDOW_SECONDS,
            "sampling_rate": settings.LOG_SAMPLING_RATE,
            "max_per_error_type": settings.LOG_MAX_PER_ERROR_TYPE,
        },
        "status": {
            "throttling_active": stats.get("global_count", 0) >= settings.LOG_MAX_ERRORS_PER_MINUTE,
            "sampling_mode": stats.get("sampling_mode", False),
            "suppression_rate": (
                round(stats.get("total_suppressed", 0) / max(stats.get("global_count", 1), 1) * 100, 2)
                if stats.get("global_count", 0) > 0 else 0.0
            ),
        },
    }


@router.get("/token-info", response_model=TokenInfoResponse)
async def get_token_info_admin(
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
) -> TokenInfoResponse:

    logger.info(f"Admin {admin_user.wallet_address} fetching token info")

    result = await db.execute(select(TokenInfo).limit(1))
    token_info = result.scalar_one_or_none()

    if not token_info:
        raise HTTPException(status_code=404, detail="Token info not found")

    return TokenInfoResponse.model_validate(token_info)


@router.patch("/token-info", response_model=TokenInfoResponse)
async def update_token_info_admin(
    request: Request,
    token_update: TokenInfoUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
) -> TokenInfoResponse:

    logger.info(f"Admin {admin_user.wallet_address} updating token info")

    result = await db.execute(select(TokenInfo).limit(1))
    token_info = result.scalar_one_or_none()

    if not token_info:
        token_info = TokenInfo(
            token_name=token_update.token_name or "Pixel Race Token",
            contract_address=token_update.contract_address or "",
            token_url=token_update.token_url or "",
            description=token_update.description,
        )
        db.add(token_info)
    else:
        if token_update.token_name is not None:
            token_info.token_name = token_update.token_name
        if token_update.contract_address is not None:
            token_info.contract_address = token_update.contract_address
        if token_update.token_url is not None:
            token_info.token_url = token_update.token_url
        if token_update.description is not None:
            token_info.description = token_update.description

        token_info.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(token_info)

    logger.info(f"Admin {admin_user.wallet_address} updated token info successfully")

    return TokenInfoResponse.model_validate(token_info)